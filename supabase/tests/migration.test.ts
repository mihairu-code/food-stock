import { readdirSync, readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Прогоняет все миграции по порядку на настоящем движке Postgres (PGlite, WASM) и проверяет
 * политики RLS и RPC от имени разных пользователей.
 *
 * Окружение Supabase здесь имитируется: схема auth, роли anon/authenticated,
 * права по умолчанию и публикация supabase_realtime. Auth, Realtime и Data API
 * этот тест не покрывает.
 */
const SUPABASE_STUB = `
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;

  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid
  $$;
  grant execute on function auth.jwt(), auth.uid() to anon, authenticated;

  -- Supabase выдаёт эти права на всё, что создаётся в public.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;

  create publication supabase_realtime;
`

type TestUser = { id: string; email: string }

const ALICE: TestUser = { id: '00000000-0000-0000-0000-00000000000a', email: 'alice@example.com' }
const BOB: TestUser = { id: '00000000-0000-0000-0000-00000000000b', email: 'bob@example.com' }
const CAROL: TestUser = { id: '00000000-0000-0000-0000-00000000000c', email: 'carol@example.com' }

let db: PGlite

/** Выполняет запросы так, как их выполнил бы вошедший пользователь через Data API. */
async function as<T>(user: TestUser | null, run: () => Promise<T>): Promise<T> {
  const claims = user ? JSON.stringify({ sub: user.id, email: user.email }) : ''
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims])
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`)
  try {
    return await run()
  } finally {
    await db.exec('reset role')
  }
}

const rows = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows

const affected = async (sql: string, params: unknown[] = []) =>
  (await db.query(sql, params)).affectedRows ?? 0

async function createHousehold(owner: TestUser, name: string): Promise<string> {
  return as(owner, async () => {
    const [row] = await rows<{ id: string }>(`select public.create_household($1) as id`, [name])
    return row.id
  })
}

async function createSection(user: TestUser, householdId: string, name: string): Promise<string> {
  return as(user, async () => {
    const [row] = await rows<{ id: string }>(
      `insert into public.sections (household_id, name) values ($1, $2) returning id`,
      [householdId, name],
    )
    return row.id
  })
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUB)
  const migrations = new URL('../migrations/', import.meta.url)
  for (const file of readdirSync(migrations).sort()) {
    await db.exec(readFileSync(new URL(file, migrations), 'utf8'))
  }
  for (const user of [ALICE, BOB, CAROL]) {
    await db.query(`insert into auth.users (id, email) values ($1, $2)`, [user.id, user.email])
  }
})

describe('миграции: доступ и RPC', () => {
  let aliceHome: string
  let bobHome: string
  let aliceFridge: string

  beforeAll(async () => {
    aliceHome = await createHousehold(ALICE, 'Дом Алисы')
    bobHome = await createHousehold(BOB, 'Дом Боба')
    aliceFridge = await createSection(ALICE, aliceHome, 'Холодильник')
    await createSection(BOB, bobHome, 'Холодильник')
  })

  it('создатель дома становится владельцем', async () => {
    const members = await as(ALICE, () =>
      rows(`select user_id, role, email from public.household_members where household_id = $1`, [aliceHome]),
    )
    expect(members).toEqual([{ user_id: ALICE.id, role: 'owner', email: ALICE.email }])
  })

  it('пользователь видит только свой дом и его данные', async () => {
    const seen = await as(ALICE, async () => ({
      households: await rows(`select id from public.households`),
      sections: await rows(`select id from public.sections`),
      members: await rows(`select user_id from public.household_members`),
    }))
    expect(seen.households).toEqual([{ id: aliceHome }])
    expect(seen.sections).toEqual([{ id: aliceFridge }])
    expect(seen.members).toEqual([{ user_id: ALICE.id }])
  })

  it('чужой дом нельзя ни читать, ни менять', async () => {
    await as(ALICE, async () => {
      await db.query(
        `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Молоко', 'staple')`,
        [aliceHome, aliceFridge],
      )
      await db.query(`insert into public.shopping_items (household_id, name) values ($1, 'Хлеб')`, [aliceHome])
    })

    await as(BOB, async () => {
      expect(await rows(`select 1 from public.products where household_id = $1`, [aliceHome])).toEqual([])
      expect(await rows(`select 1 from public.shopping_items where household_id = $1`, [aliceHome])).toEqual([])
      expect(await affected(`update public.products set is_available = false where household_id = $1`, [aliceHome])).toBe(0)
      expect(await affected(`delete from public.products where household_id = $1`, [aliceHome])).toBe(0)
      expect(await affected(`delete from public.sections where id = $1`, [aliceFridge])).toBe(0)
      expect(await affected(`update public.households set name = 'Взлом' where id = $1`, [aliceHome])).toBe(0)

      await expect(
        db.query(`insert into public.sections (household_id, name) values ($1, 'Чужой')`, [aliceHome]),
      ).rejects.toThrow(/row-level security/)
      // Свой продукт нельзя «переложить» в раздел чужого дома.
      await expect(
        db.query(
          `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Подкидыш', 'one_off')`,
          [bobHome, aliceFridge],
        ),
      ).rejects.toThrow(/foreign key/)
    })

    const left = await as(ALICE, () => rows(`select name from public.products where household_id = $1`, [aliceHome]))
    expect(left).toEqual([{ name: 'Молоко' }])
  })

  it('вступить в дом в обход RPC нельзя', async () => {
    await as(BOB, async () => {
      await expect(
        db.query(
          `insert into public.household_members (household_id, user_id, role, email) values ($1, $2, 'owner', $3)`,
          [aliceHome, BOB.id, BOB.email],
        ),
      ).rejects.toThrow(/permission denied/)
      await expect(db.query(`insert into public.households (name) values ('Самозванец')`)).rejects.toThrow(
        /permission denied/,
      )
    })
  })

  it('без входа недоступны ни таблицы, ни RPC', async () => {
    await as(null, async () => {
      for (const table of ['households', 'household_members', 'household_invites', 'sections', 'products', 'shopping_items']) {
        await expect(db.query(`select 1 from public.${table}`)).rejects.toThrow(/permission denied/)
      }
      await expect(db.query(`select public.create_household('Аноним')`)).rejects.toThrow(/permission denied/)
    })
  })

  it('updated_at обновляется триггером', async () => {
    await as(ALICE, async () => {
      const [before] = await rows<{ updated_at: Date }>(`select updated_at from public.products where name = 'Молоко'`)
      await db.exec(`select pg_sleep(0.01)`)
      await db.exec(`update public.products set is_available = false where name = 'Молоко'`)
      const [after] = await rows<{ updated_at: Date }>(`select updated_at from public.products where name = 'Молоко'`)
      expect(after.updated_at.getTime()).toBeGreaterThan(before.updated_at.getTime())
    })
  })

  it('разовый продукт не может закончиться — только исчезнуть', async () => {
    await as(ALICE, async () => {
      await expect(
        db.query(
          `insert into public.products (household_id, section_id, name, kind, is_available) values ($1, $2, 'Торт', 'one_off', false)`,
          [aliceHome, aliceFridge],
        ),
      ).rejects.toThrow(/one_off_is_always_available/)
    })
  })

  it('purchase_shopping_item переносит позицию в раздел атомарно', async () => {
    await as(ALICE, async () => {
      const [item] = await rows<{ id: string }>(
        `insert into public.shopping_items (household_id, name, icon) values ($1, 'Батарейки', '🔋') returning id`,
        [aliceHome],
      )
      await db.query(`select public.purchase_shopping_item($1, $2, true)`, [item.id, aliceFridge])
      expect(await rows(`select 1 from public.shopping_items where id = $1`, [item.id])).toEqual([])
      expect(await rows(`select kind, icon, is_available from public.products where name = 'Батарейки'`)).toEqual([
        { kind: 'staple', icon: '🔋', is_available: true },
      ])
    })
  })

  it('покупка в раздел чужого дома откатывается целиком', async () => {
    const bobSection = await createSection(BOB, bobHome, 'Шкаф')
    await as(ALICE, async () => {
      const [item] = await rows<{ id: string }>(
        `insert into public.shopping_items (household_id, name) values ($1, 'Сок') returning id`,
        [aliceHome],
      )
      await expect(db.query(`select public.purchase_shopping_item($1, $2)`, [item.id, bobSection])).rejects.toThrow()
      // Позиция осталась в покупках.
      expect(await rows(`select name from public.shopping_items where id = $1`, [item.id])).toEqual([{ name: 'Сок' }])
    })
  })

  it('удаление раздела каскадно удаляет его продукты', async () => {
    const pantry = await createSection(ALICE, aliceHome, 'Кладовка')
    await as(ALICE, async () => {
      await db.query(
        `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Крупа', 'staple')`,
        [aliceHome, pantry],
      )
      await db.query(`delete from public.sections where id = $1`, [pantry])
      expect(await rows(`select 1 from public.products where name = 'Крупа'`)).toEqual([])
    })
  })

  describe('приглашения по почте', () => {
    it('приглашает только владелец', async () => {
      await as(BOB, async () => {
        await expect(
          db.query(`insert into public.household_invites (household_id, email) values ($1, 'x@example.com')`, [aliceHome]),
        ).rejects.toThrow(/row-level security/)
      })
      await as(ALICE, async () => {
        await db.query(`insert into public.household_invites (household_id, email) values ($1, $2)`, [aliceHome, CAROL.email])
      })
    })

    it('адресат видит приглашение с названием дома, остальные — нет', async () => {
      const mine = await as(CAROL, () => rows(`select household_name, invited_by_email from public.list_my_invites()`))
      expect(mine).toEqual([{ household_name: 'Дом Алисы', invited_by_email: ALICE.email }])
      expect(await as(BOB, () => rows(`select * from public.list_my_invites()`))).toEqual([])
    })

    it('чужое приглашение принять нельзя', async () => {
      const [invite] = await as(CAROL, () => rows<{ id: string }>(`select id from public.list_my_invites()`))
      await as(BOB, async () => {
        await expect(db.query(`select public.accept_invite($1)`, [invite.id])).rejects.toThrow(/не найдено/)
      })
    })

    it('адресат принимает приглашение и получает доступ к дому', async () => {
      const [invite] = await as(CAROL, () => rows<{ id: string }>(`select id from public.list_my_invites()`))
      await as(CAROL, async () => {
        await db.query(`select public.accept_invite($1)`, [invite.id])
        expect(await rows(`select name from public.sections where household_id = $1`, [aliceHome])).toEqual([
          { name: 'Холодильник' },
        ])
        expect(await rows(`select * from public.list_my_invites()`)).toEqual([])
      })
    })

    it('владелец удаляет участника — и тот теряет доступ', async () => {
      await as(CAROL, async () => {
        expect(await affected(`delete from public.household_members where user_id = $1`, [ALICE.id])).toBe(0)
      })
      await as(ALICE, async () => {
        expect(await affected(`delete from public.household_members where user_id = $1`, [ALICE.id])).toBe(0)
        expect(await affected(`delete from public.household_members where user_id = $1`, [CAROL.id])).toBe(1)
      })
      await as(CAROL, async () => {
        expect(await rows(`select 1 from public.sections where household_id = $1`, [aliceHome])).toEqual([])
      })
    })
  })

  it('лишние права на таблицы отозваны: участник не вставит себя в дом напрямую', async () => {
    const grants = await rows<{ privilege_type: string }>(
      `select privilege_type from information_schema.role_table_grants
       where grantee = 'authenticated' and table_name = 'household_members' order by privilege_type`,
    )
    expect(grants.map((g) => g.privilege_type)).toEqual(['DELETE', 'SELECT'])
  })
})
