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
  create table auth.users (id uuid primary key, email text, is_anonymous boolean not null default true);
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

// Анонимные пользователи: у них есть только идентификатор.
const ALICE = { id: '00000000-0000-0000-0000-00000000000a' }
const BOB = { id: '00000000-0000-0000-0000-00000000000b' }
const CAROL = { id: '00000000-0000-0000-0000-00000000000c' }
/** Пользователь без email — анонимный; с email — вошедший через Google. */
type TestUser = { id: string; email?: string; avatar?: string }

let db: PGlite

/** Выполняет запросы так, как их выполнил бы вошедший пользователь через Data API. */
async function as<T>(user: TestUser | null, run: () => Promise<T>): Promise<T> {
  const claims = user
    ? JSON.stringify({
        sub: user.id,
        is_anonymous: !user.email,
        ...(user.email ? { email: user.email } : {}),
        // Данные профиля Google приходят в токене.
        ...(user.avatar ? { user_metadata: { avatar_url: user.avatar } } : {}),
      })
    : ''
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
    const [row] = await rows<{ id: string }>(`select public.create_household($1, $2) as id`, [name, 'Хозяин'])
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
    await db.query(`insert into auth.users (id) values ($1)`, [user.id])
  }
})

describe('миграции: доступ и RPC', () => {
  let aliceHome: string
  let bobHome: string
  let aliceFridge: string
  let bobFridge: string

  beforeAll(async () => {
    aliceHome = await createHousehold(ALICE, 'Дом Алисы')
    bobHome = await createHousehold(BOB, 'Дом Боба')
    aliceFridge = await createSection(ALICE, aliceHome, 'Холодильник')
    bobFridge = await createSection(BOB, bobHome, 'Холодильник')
  })

  it('создатель дома становится владельцем', async () => {
    const members = await as(ALICE, () =>
      rows(`select user_id, role, display_name from public.household_members where household_id = $1`, [aliceHome]),
    )
    expect(members).toEqual([{ user_id: ALICE.id, role: 'owner', display_name: 'Хозяин' }])
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
      const [milk] = await rows<{ id: string }>(
        `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Молоко', 'staple') returning id`,
        [aliceHome, aliceFridge],
      )
      await db.query(`insert into public.shopping_items (household_id, name) values ($1, 'Хлеб')`, [aliceHome])
      expect(milk.id).toBeTruthy()
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
      await expect(
        db.query(`insert into public.shopping_items (household_id, name) values ($1, 'Чужое')`, [aliceHome]),
      ).rejects.toThrow(/row-level security/)
      // Свой продукт нельзя «переложить» в раздел чужого дома.
      await expect(
        db.query(
          `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Подкидыш', 'one_off')`,
          [bobHome, aliceFridge],
        ),
      ).rejects.toThrow(/foreign key/)
    })

    // Данные Алисы на месте.
    const left = await as(ALICE, () => rows(`select name from public.products where household_id = $1`, [aliceHome]))
    expect(left).toEqual([{ name: 'Молоко' }])
  })

  it('вступить в дом в обход RPC нельзя', async () => {
    await as(BOB, async () => {
      await expect(
        db.query(
          `insert into public.household_members (household_id, user_id, role) values ($1, $2, 'owner')`,
          [aliceHome, BOB.id],
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
      await expect(db.query(`select public.join_household('0123456789abcdef0123456789abcdef')`)).rejects.toThrow(
        /permission denied/,
      )
    })
  })

  it('updated_at обновляется триггером', async () => {
    await as(ALICE, async () => {
      const [before] = await rows<{ updated_at: Date }>(`select updated_at from public.products where name = 'Молоко'`)
      await db.exec(`select pg_sleep(0.01)`)
      await db.exec(`update public.products set is_available = false where name = 'Молоко'`)
      const [after] = await rows<{ updated_at: Date; is_available: boolean }>(
        `select updated_at, is_available from public.products where name = 'Молоко'`,
      )
      expect(after.is_available).toBe(false)
      expect(after.updated_at.getTime()).toBeGreaterThan(before.updated_at.getTime())
    })
  })

  it('purchase_shopping_item переносит позицию в раздел атомарно', async () => {
    await as(ALICE, async () => {
      const [bread] = await rows<{ id: string }>(`select id from public.shopping_items where name = 'Хлеб'`)

      // Раздел чужого дома: ошибка, позиция остаётся в покупках.
      await expect(
        db.query(`select public.purchase_shopping_item($1, $2, false)`, [bread.id, bobFridge]),
      ).rejects.toThrow(/foreign key/)
      expect(await rows(`select 1 from public.shopping_items where id = $1`, [bread.id])).toHaveLength(1)

      await db.query(`select public.purchase_shopping_item($1, $2, true)`, [bread.id, aliceFridge])
      expect(await rows(`select 1 from public.shopping_items where id = $1`, [bread.id])).toEqual([])
      expect(
        await rows(`select kind, is_available, section_id, created_by from public.products where name = 'Хлеб'`),
      ).toEqual([{ kind: 'staple', is_available: true, section_id: aliceFridge, created_by: ALICE.id }])
    })

    // Чужую позицию купить нельзя: для Боба её не существует.
    const [other] = await as(ALICE, () =>
      rows<{ id: string }>(`insert into public.shopping_items (household_id, name) values ($1, 'Сок') returning id`, [aliceHome]),
    )
    await as(BOB, async () => {
      await expect(
        db.query(`select public.purchase_shopping_item($1, $2, false)`, [other.id, bobFridge]),
      ).rejects.toThrow(/не найдена/)
    })
    expect(await as(ALICE, () => rows(`select 1 from public.shopping_items where id = $1`, [other.id]))).toHaveLength(1)
  })

  it('удаление раздела каскадно удаляет его продукты', async () => {
    await as(ALICE, async () => {
      const [pantry] = await rows<{ id: string }>(
        `insert into public.sections (household_id, name) values ($1, 'Шкаф') returning id`,
        [aliceHome],
      )
      await db.query(
        `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Рис', 'staple')`,
        [aliceHome, pantry.id],
      )
      expect(await affected(`delete from public.sections where id = $1`, [pantry.id])).toBe(1)
      expect(await rows(`select 1 from public.products where name = 'Рис'`)).toEqual([])
      expect(await rows(`select name from public.products order by name`)).toEqual([{ name: 'Молоко' }, { name: 'Хлеб' }])
    })
  })

  describe('ссылки-приглашения и состав дома', () => {
    let token: string

    const createInvite = (user: TestUser, householdId: string) =>
      as(user, async () => {
        const [row] = await rows<{ token: string }>(`select public.create_invite($1) as token`, [householdId])
        return row.token
      })

    it('ссылку создаёт только владелец; токен в базе не хранится', async () => {
      await as(BOB, async () => {
        await expect(db.query(`select public.create_invite($1)`, [aliceHome])).rejects.toThrow(/только владелец/)
        // В обход RPC ссылку тоже не создать.
        await expect(
          db.query(`insert into public.household_invites (household_id, token_hash) values ($1, 'x')`, [aliceHome]),
        ).rejects.toThrow(/permission denied/)
      })

      token = await createInvite(ALICE, aliceHome)
      expect(token).toMatch(/^[0-9a-f]{32}$/)

      await as(ALICE, async () => {
        expect(await rows(`select household_id from public.household_invites`)).toEqual([{ household_id: aliceHome }])
        // Хеш токена участникам не отдаётся.
        await expect(db.query(`select token_hash from public.household_invites`)).rejects.toThrow(/permission denied/)
      })
      const [stored] = await rows<{ token_hash: string }>(`select token_hash from public.household_invites`)
      expect(stored.token_hash).not.toContain(token)
    })

    it('посторонний не видит ссылок и не подберёт токен', async () => {
      await as(CAROL, async () => {
        expect(await rows(`select id from public.household_invites`)).toEqual([])
        await expect(
          db.query(`select public.join_household('00000000000000000000000000000000')`),
        ).rejects.toThrow(/недействительна/)
        expect(await rows(`select 1 from public.sections where household_id = $1`, [aliceHome])).toEqual([])
      })
    })

    it('по ссылке человек становится участником и получает доступ', async () => {
      await as(BOB, async () => {
        const [row] = await rows<{ id: string }>(`select public.join_household($1, $2) as id`, [token, '  Боб  '])
        expect(row.id).toBe(aliceHome)
        expect(await rows(`select name from public.sections where household_id = $1`, [aliceHome])).toEqual([
          { name: 'Холодильник' },
        ])
        expect(
          await rows(`select role, display_name from public.household_members where user_id = $1 and household_id = $2`, [
            BOB.id,
            aliceHome,
          ]),
        ).toEqual([{ role: 'member', display_name: 'Боб' }])
        // Участник редактирует бытовые данные…
        await db.query(`insert into public.shopping_items (household_id, name) values ($1, 'Сыр')`, [aliceHome])
        // …но не управляет составом дома и не переименовывает его.
        await expect(db.query(`select public.create_invite($1)`, [aliceHome])).rejects.toThrow(/только владелец/)
        expect(
          await affected(`delete from public.household_members where household_id = $1 and user_id = $2`, [aliceHome, ALICE.id]),
        ).toBe(0)
        expect(await affected(`update public.households set name = 'Дом Боба 2' where id = $1`, [aliceHome])).toBe(0)
        // Собственный дом Боба не пустой (в нём есть раздел), поэтому он остался.
        expect(await rows(`select id from public.households order by name`)).toEqual([{ id: aliceHome }, { id: bobHome }])
      })
    })

    it('ссылка одноразовая', async () => {
      expect(await as(ALICE, () => rows(`select 1 from public.household_invites`))).toEqual([])
      await as(CAROL, async () => {
        await expect(db.query(`select public.join_household($1)`, [token])).rejects.toThrow(/уже использована/)
      })
    })

    it('тот, кто уже в доме, ссылку не расходует', async () => {
      const fresh = await createInvite(ALICE, aliceHome)
      await as(BOB, async () => {
        const [row] = await rows<{ id: string }>(`select public.join_household($1) as id`, [fresh])
        expect(row.id).toBe(aliceHome)
      })
      expect(await as(ALICE, () => rows(`select 1 from public.household_invites`))).toHaveLength(1)
      // Владелец отзывает ссылку — по ней больше не войти.
      expect(await as(BOB, () => affected(`delete from public.household_invites`))).toBe(0)
      expect(await as(ALICE, () => affected(`delete from public.household_invites`))).toBe(1)
      await as(CAROL, async () => {
        await expect(db.query(`select public.join_household($1)`, [fresh])).rejects.toThrow(/недействительна/)
      })
    })

    it('просроченная ссылка не работает', async () => {
      const expired = await createInvite(ALICE, aliceHome)
      await db.exec(`update public.household_invites set expires_at = now() - interval '1 minute'`)
      await as(CAROL, async () => {
        await expect(db.query(`select public.join_household($1)`, [expired])).rejects.toThrow(/истекла/)
      })
      // Следующее создание ссылки подчищает просроченные.
      await createInvite(ALICE, aliceHome)
      expect(await as(ALICE, () => rows(`select 1 from public.household_invites`))).toHaveLength(1)
      await as(ALICE, () => db.exec(`delete from public.household_invites`))
    })

    it('пустой автоматически созданный дом исчезает после вступления в чужой', async () => {
      const carolHome = await createHousehold(CAROL, 'Наш дом')
      const invite = await createInvite(ALICE, aliceHome)
      await as(CAROL, async () => {
        await db.query(`select public.join_household($1, 'Кэрол')`, [invite])
        expect(await rows(`select id from public.households`)).toEqual([{ id: aliceHome }])
      })
      expect(await rows(`select 1 from public.households where id = $1`, [carolHome])).toEqual([])
    })

    it('участник меняет только своё имя и не может повысить себе роль', async () => {
      await as(BOB, async () => {
        expect(
          await affected(`update public.household_members set display_name = 'Роберт' where household_id = $1 and user_id = $2`, [
            aliceHome,
            BOB.id,
          ]),
        ).toBe(1)
        expect(
          await affected(`update public.household_members set display_name = 'Взлом' where household_id = $1 and user_id = $2`, [
            aliceHome,
            ALICE.id,
          ]),
        ).toBe(0)
        await expect(
          db.query(`update public.household_members set role = 'owner' where user_id = $1`, [BOB.id]),
        ).rejects.toThrow(/permission denied/)
      })
      const names = await as(ALICE, () =>
        rows(`select display_name from public.household_members where household_id = $1 order by created_at, display_name`, [
          aliceHome,
        ]),
      )
      expect(names.map((n) => n.display_name).sort()).toEqual(['Кэрол', 'Роберт', 'Хозяин'])
    })

    it('владелец не может удалить себя, но удаляет участника — и тот теряет доступ', async () => {
      await as(ALICE, async () => {
        expect(
          await affected(`delete from public.household_members where household_id = $1 and user_id = $2`, [aliceHome, ALICE.id]),
        ).toBe(0)
        expect(
          await affected(`delete from public.household_members where household_id = $1 and user_id = $2`, [aliceHome, BOB.id]),
        ).toBe(1)
      })
      await as(BOB, async () => {
        expect(await rows(`select 1 from public.sections where household_id = $1`, [aliceHome])).toEqual([])
        expect(await rows(`select 1 from public.shopping_items where household_id = $1`, [aliceHome])).toEqual([])
        await expect(
          db.query(`insert into public.shopping_items (household_id, name) values ($1, 'После удаления')`, [aliceHome]),
        ).rejects.toThrow(/row-level security/)
        // Собственный дом по-прежнему доступен.
        expect(await rows(`select id from public.households`)).toEqual([{ id: bobHome }])
      })
    })
  })
})

