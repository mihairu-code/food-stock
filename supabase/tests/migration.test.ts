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
  create table auth.users (
    id uuid primary key,
    email text,
    is_anonymous boolean not null default true,
    created_at timestamptz default now(),
    last_sign_in_at timestamptz
  );
  -- Сессии входа и токены обновления — по ним оценивается последний визит (0010).
  -- Типы как в Supabase: refreshed_at без часового пояса, user_id токена — строка.
  create table auth.sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    refreshed_at timestamp
  );
  create table auth.refresh_tokens (
    id bigserial primary key,
    user_id varchar(255),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
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

  describe('наличие и список покупок', () => {
    const state = async (name: string) => {
      const [row] = await rows<{ is_available: boolean; to_buy: boolean }>(
        `select is_available, to_buy from public.products where name = $1`,
        [name],
      )
      return row
    }

    it('прежняя версия приложения меняет только наличие — отметка «в покупках» следует за ним', async () => {
      await as(ALICE, async () => {
        // «Молоко» закончилось в предыдущем тесте одним лишь is_available = false.
        expect(await state('Молоко')).toEqual({ is_available: false, to_buy: true })
        await db.exec(`update public.products set is_available = true where name = 'Молоко'`)
        expect(await state('Молоко')).toEqual({ is_available: true, to_buy: false })
      })
    })

    it('новая версия присылает обе отметки, и они независимы', async () => {
      await as(ALICE, async () => {
        // Есть дома, но хочется докупить.
        await db.exec(`update public.products set to_buy = true where name = 'Молоко'`)
        expect(await state('Молоко')).toEqual({ is_available: true, to_buy: true })
        // Закончилось, а из покупок убрали — покупать не будем.
        await db.exec(`update public.products set is_available = false, to_buy = false where name = 'Молоко'`)
        expect(await state('Молоко')).toEqual({ is_available: false, to_buy: false })
        // Куплено.
        await db.exec(`update public.products set is_available = true, to_buy = true where name = 'Молоко'`)
        await db.exec(`update public.products set is_available = true, to_buy = false where name = 'Молоко'`)
        expect(await state('Молоко')).toEqual({ is_available: true, to_buy: false })
        // Переименование и прочие правки отметок не трогают.
        await db.exec(`update public.products set to_buy = true where name = 'Молоко'`)
        await db.exec(`update public.products set icon = '🥛' where name = 'Молоко'`)
        expect(await state('Молоко')).toEqual({ is_available: true, to_buy: true })
        await db.exec(`update public.products set to_buy = false where name = 'Молоко'`)
      })
    })

    it('разовый продукт может закончиться и сам в покупки не попадает', async () => {
      await as(ALICE, async () => {
        await db.query(
          `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Клубника', 'one_off')`,
          [aliceHome, aliceFridge],
        )
        await db.exec(`update public.products set is_available = false where name = 'Клубника'`)
        expect(await state('Клубника')).toEqual({ is_available: false, to_buy: false })
        await db.exec(`update public.products set to_buy = true where name = 'Клубника'`)
        expect(await state('Клубника')).toEqual({ is_available: false, to_buy: true })
        await db.exec(`delete from public.products where name = 'Клубника'`)
      })
    })

    it('служебную функцию триггера нельзя вызвать через API', async () => {
      const [grant] = await rows<{ ok: boolean }>(
        `select has_function_privilege('authenticated', 'public.sync_to_buy()', 'execute') as ok`,
      )
      expect(grant.ok).toBe(false)
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

describe('аккаунт Google: слияние пользователя устройства с аккаунтом', () => {
  let counter = 0

  /** Новый пользователь: анонимный (устройство) или с почтой (аккаунт Google). */
  async function newUser(email?: string): Promise<TestUser> {
    const id = `10000000-0000-0000-0000-${String(++counter).padStart(12, '0')}`
    await db.query(`insert into auth.users (id, email, is_anonymous) values ($1, $2, $3)`, [id, email ?? null, !email])
    return { id, email }
  }

  /** Дом, в котором уже что-то завели. */
  async function homeWithData(owner: TestUser, name: string): Promise<string> {
    const home = await createHousehold(owner, name)
    await as(owner, async () => {
      const [section] = await rows<{ id: string }>(
        `insert into public.sections (household_id, name) values ($1, 'Холодильник') returning id`,
        [home],
      )
      await db.query(
        `insert into public.products (household_id, section_id, name, kind) values ($1, $2, 'Молоко', 'staple')`,
        [home, section.id],
      )
    })
    return home
  }

  const ticketFor = (user: TestUser) =>
    as(user, async () => (await rows<{ t: string }>(`select public.create_merge_ticket() as t`))[0].t)

  const preview = (account: TestUser, ticket: string) =>
    as(account, async () => {
      const [row] = await rows<{ p: { needs_choice: boolean; device: { name: string }[]; account: { name: string }[] } }>(
        `select public.preview_merge($1) as p`,
        [ticket],
      )
      return row.p
    })

  const merge = (account: TestUser, ticket: string, keep: string | null = null) =>
    as(account, async () => (await rows<{ id: string | null }>(`select public.complete_merge($1, $2) as id`, [ticket, keep]))[0].id)

  const userExists = async (user: TestUser) =>
    (await rows(`select 1 from auth.users where id = $1`, [user.id])).length === 1

  const homesOf = (user: TestUser) =>
    as(user, () => rows<{ name: string; role: string }>(
      `select h.name, m.role from public.households h join public.household_members m on m.household_id = h.id and m.user_id = $1 order by h.name`,
      [user.id],
    ))

  it('первый вход: всё, что было на устройстве, переходит к аккаунту', async () => {
    const device = await newUser()
    const account = await newUser('mike@example.com')
    const home = await homeWithData(device, 'Логово')
    const ticket = await ticketFor(device)

    expect(await preview(account, ticket)).toMatchObject({ needs_choice: false, device: [{ name: 'Логово' }], account: [] })
    expect(await merge(account, ticket)).toBe(home)

    expect(await homesOf(account)).toEqual([{ name: 'Логово', role: 'owner' }])
    expect(await as(account, () => rows(`select name from public.products where household_id = $1`, [home]))).toEqual([
      { name: 'Молоко' },
    ])
    // Авторство записей перешло к аккаунту, анонимный пользователь удалён вместе с билетом.
    expect(await rows(`select created_by from public.products where household_id = $1`, [home])).toEqual([
      { created_by: account.id },
    ])
    expect(await userExists(device)).toBe(false)
    expect(await rows(`select 1 from private.merge_tickets`)).toEqual([])
    expect(
      await rows(`select account_email from public.household_members where household_id = $1`, [home]),
    ).toEqual([{ account_email: 'mike@example.com' }])
  })

  it('второе устройство того же человека: дубль в доме исчезает', async () => {
    const browser = await newUser()
    const pwa = await newUser()
    const account = await newUser('anna@example.com')
    const home = await homeWithData(browser, 'Дом Анны')
    // PWA вошло в тот же дом по ссылке-приглашению как отдельный участник.
    const invite = await as(browser, async () => (await rows<{ t: string }>(`select public.create_invite($1) as t`, [home]))[0].t)
    await as(pwa, () => db.query(`select public.join_household($1, 'Анна')`, [invite]))
    expect(await rows(`select 1 from public.household_members where household_id = $1`, [home])).toHaveLength(2)

    await merge(account, await ticketFor(browser))
    expect(await rows(`select 1 from public.household_members where household_id = $1`, [home])).toHaveLength(2)

    const ticket = await ticketFor(pwa)
    expect(await preview(account, ticket)).toMatchObject({ needs_choice: false, device: [], account: [] })
    expect(await merge(account, ticket)).toBe(home)

    expect(await rows(`select user_id, role from public.household_members where household_id = $1`, [home])).toEqual([
      { user_id: account.id, role: 'owner' },
    ])
    expect(await userExists(pwa)).toBe(false)
  })

  it('участник с правами владельца на устройстве делает владельцем аккаунт', async () => {
    const owner = await newUser()
    const account = await newUser('owner@example.com')
    const other = await newUser()
    const home = await homeWithData(other, 'Чужой дом')
    // Аккаунт — рядовой участник, а устройство того же человека — владелец другого его дома нет:
    const invite = await as(other, async () => (await rows<{ t: string }>(`select public.create_invite($1) as t`, [home]))[0].t)
    await as(account, () => db.query(`select public.join_household($1)`, [invite]))
    const invite2 = await as(other, async () => (await rows<{ t: string }>(`select public.create_invite($1) as t`, [home]))[0].t)
    await as(owner, () => db.query(`select public.join_household($1)`, [invite2]))
    await db.query(`update public.household_members set role = 'owner' where household_id = $1 and user_id = $2`, [home, owner.id])

    await merge(account, await ticketFor(owner))
    expect(
      await rows(`select role from public.household_members where household_id = $1 and user_id = $2`, [home, account.id]),
    ).toEqual([{ role: 'owner' }])
  })

  describe('у устройства и у аккаунта разные дома с данными', () => {
    it('без выбора слияние не выполняется, данные целы', async () => {
      const device = await newUser()
      const account = await newUser('choice@example.com')
      await homeWithData(device, 'С устройства')
      await homeWithData(account, 'Из аккаунта')
      const ticket = await ticketFor(device)

      expect(await preview(account, ticket)).toMatchObject({
        needs_choice: true,
        device: [{ name: 'С устройства', sections: 1, products: 1, members: 1 }],
        account: [{ name: 'Из аккаунта', sections: 1, products: 1, members: 1 }],
      })
      await expect(merge(account, ticket)).rejects.toThrow(/Нужно выбрать/)
      await expect(merge(account, ticket, 'что-то')).rejects.toThrow(/Нужно выбрать/)
      expect(await userExists(device)).toBe(true)
      expect(await homesOf(device)).toEqual([{ name: 'С устройства', role: 'owner' }])
      expect(await homesOf(account)).toEqual([{ name: 'Из аккаунта', role: 'owner' }])
    })

    it('«оставить с устройства»: дом аккаунта удаляется', async () => {
      const device = await newUser()
      const account = await newUser('keep-device@example.com')
      const deviceHome = await homeWithData(device, 'С устройства')
      const accountHome = await homeWithData(account, 'Из аккаунта')

      expect(await merge(account, await ticketFor(device), 'device')).toBe(deviceHome)
      expect(await homesOf(account)).toEqual([{ name: 'С устройства', role: 'owner' }])
      expect(await rows(`select 1 from public.households where id = $1`, [accountHome])).toEqual([])
      expect(await rows(`select 1 from public.products where household_id = $1`, [accountHome])).toEqual([])
      expect(await userExists(device)).toBe(false)
    })

    it('«оставить из аккаунта»: дом устройства удаляется', async () => {
      const device = await newUser()
      const account = await newUser('keep-account@example.com')
      const deviceHome = await homeWithData(device, 'С устройства')
      const accountHome = await homeWithData(account, 'Из аккаунта')

      expect(await merge(account, await ticketFor(device), 'account')).toBe(accountHome)
      expect(await homesOf(account)).toEqual([{ name: 'Из аккаунта', role: 'owner' }])
      expect(await rows(`select 1 from public.households where id = $1`, [deviceHome])).toEqual([])
      expect(await userExists(device)).toBe(false)
    })

    it('дом, где есть другие люди, не удаляется: человек из него выходит, владельцем становится старейший участник', async () => {
      const device = await newUser()
      const account = await newUser('shared@example.com')
      const partner = await newUser()
      await homeWithData(device, 'С устройства')
      const shared = await homeWithData(account, 'Общий')
      const invite = await as(account, async () => (await rows<{ t: string }>(`select public.create_invite($1) as t`, [shared]))[0].t)
      await as(partner, () => db.query(`select public.join_household($1, 'Партнёр')`, [invite]))
      // Приглашение, созданное аккаунтом, не мешает считать дом общим.
      await merge(account, await ticketFor(device), 'device')

      expect(await homesOf(account)).toEqual([{ name: 'С устройства', role: 'owner' }])
      expect(await rows(`select user_id, role from public.household_members where household_id = $1`, [shared])).toEqual([
        { user_id: partner.id, role: 'owner' },
      ])
      expect(await rows(`select name from public.products where household_id = $1`, [shared])).toEqual([{ name: 'Молоко' }])
    })
  })

  it('пустые автоматически созданные дома не требуют выбора и не копятся', async () => {
    // Свежее устройство с пустым домом входит в аккаунт, у которого дом уже есть.
    const freshDevice = await newUser()
    const account = await newUser('empty@example.com')
    const emptyHome = await createHousehold(freshDevice, 'Наш дом')
    const realHome = await homeWithData(account, 'Настоящий')
    const ticket = await ticketFor(freshDevice)
    expect((await preview(account, ticket)).needs_choice).toBe(false)
    expect(await merge(account, ticket)).toBe(realHome)
    expect(await rows(`select 1 from public.households where id = $1`, [emptyHome])).toEqual([])
    expect(await homesOf(account)).toEqual([{ name: 'Настоящий', role: 'owner' }])

    // Наоборот: у аккаунта пустой дом, а на устройстве настоящий.
    const device = await newUser()
    const newAccount = await newUser('fresh-account@example.com')
    const accountEmpty = await createHousehold(newAccount, 'Наш дом')
    const deviceHome = await homeWithData(device, 'С устройства')
    expect(await merge(newAccount, await ticketFor(device))).toBe(deviceHome)
    expect(await rows(`select 1 from public.households where id = $1`, [accountEmpty])).toEqual([])
    expect(await homesOf(newAccount)).toEqual([{ name: 'С устройства', role: 'owner' }])

    // Оба пустые: у аккаунта остаётся ровно один дом.
    const d3 = await newUser()
    const a3 = await newUser('both-empty@example.com')
    await createHousehold(d3, 'Наш дом')
    await createHousehold(a3, 'Наш дом')
    await merge(a3, await ticketFor(d3))
    expect(await homesOf(a3)).toHaveLength(1)

    // У аккаунта домов нет вовсе: пустой дом устройства переходит к нему.
    const d4 = await newUser()
    const a4 = await newUser('no-homes@example.com')
    const d4Home = await createHousehold(d4, 'Наш дом')
    expect(await merge(a4, await ticketFor(d4))).toBe(d4Home)
    expect(await homesOf(a4)).toEqual([{ name: 'Наш дом', role: 'owner' }])
  })

  it('билет нельзя использовать не по назначению', async () => {
    const device = await newUser()
    const anotherDevice = await newUser()
    const account = await newUser('guard@example.com')
    const stranger = await newUser('stranger@example.com')
    await homeWithData(device, 'Дом')
    const ticket = await ticketFor(device)

    // Анонимный пользователь не может влить в себя другого анонимного.
    await expect(merge(anotherDevice, ticket)).rejects.toThrow(/Нужен вход в аккаунт/)
    await expect(preview(anotherDevice, ticket)).rejects.toThrow(/Нужен вход в аккаунт/)
    // Без входа функции недоступны вовсе.
    await as(null, async () => {
      await expect(db.query(`select public.complete_merge($1)`, [ticket])).rejects.toThrow(/permission denied/)
      await expect(db.query(`select public.create_merge_ticket()`)).rejects.toThrow(/permission denied/)
    })
    // Выдуманный и просроченный билеты не работают.
    await expect(merge(account, '0123456789abcdef0123456789abcdef')).rejects.toThrow(/недействителен/)
    await db.exec(`update private.merge_tickets set expires_at = now() - interval '1 minute'`)
    await expect(merge(account, ticket)).rejects.toThrow(/истёк/)
    expect(await userExists(device)).toBe(true)

    // Билет аккаунта не позволяет другому аккаунту его поглотить.
    await homeWithData(stranger, 'Дом постороннего')
    const strangerTicket = await ticketFor(stranger)
    await expect(merge(account, strangerTicket)).rejects.toThrow(/только пользователя без аккаунта/)
    expect(await homesOf(stranger)).toEqual([{ name: 'Дом постороннего', role: 'owner' }])
    // Свой собственный билет — сливать нечего.
    expect(await merge(stranger, strangerTicket)).toBeNull()

    // Таблица билетов закрыта от клиента.
    await as(account, async () => {
      await expect(db.query(`select 1 from private.merge_tickets`)).rejects.toThrow(/permission denied/)
    })
  })

  it('sync_profile записывает устройство и почту, не затирая имя', async () => {
    const device = await newUser()
    const account = await newUser('profile@example.com')
    const home = await createHousehold(device, 'Профиль')
    const member = () =>
      rows(`select display_name, device, account_email from public.household_members where household_id = $1`, [home])

    await as(device, () => db.query(`select public.sync_profile('Safari · iPhone', '')`))
    expect(await member()).toEqual([{ display_name: 'Хозяин', device: 'Safari · iPhone', account_email: null }])

    await db.query(`update public.household_members set display_name = '' where household_id = $1`, [home])
    await merge(account, await ticketFor(device))
    await as(account, () => db.query(`select public.sync_profile('Приложение · iPhone', 'Михаил')`))
    expect(await member()).toEqual([
      { display_name: 'Михаил', device: 'Приложение · iPhone', account_email: 'profile@example.com' },
    ])
    // Имя, заданное человеком, имя из аккаунта не затирает.
    await as(account, () => db.query(`select public.sync_profile('Приложение · iPhone', 'Другое имя')`))
    expect((await member())[0]).toMatchObject({ display_name: 'Михаил' })
  })
})


describe('аватарка дома и фото участника', () => {
  const FRANK = { id: '00000000-0000-0000-0000-00000000000f' }
  const GRACE = { id: '00000000-0000-0000-0000-000000000010', email: 'grace@example.com' }
  const PHOTO = 'https://lh3.googleusercontent.com/a/photo-of-grace=s96-c'
  let home: string

  const avatarOf = async (userId: string) =>
    (await rows<{ avatar_url: string | null }>(`select avatar_url from public.household_members where user_id = $1`, [userId]))[0]
      .avatar_url

  beforeAll(async () => {
    await db.query(`insert into auth.users (id) values ($1)`, [FRANK.id])
    await db.query(`insert into auth.users (id, email, is_anonymous) values ($1, $2, false)`, [GRACE.id, GRACE.email])
    home = await createHousehold(FRANK, 'Дом Фрэнка')
    const [{ token }] = await as(FRANK, () => rows<{ token: string }>(`select public.create_invite($1) as token`, [home]))
    await as(GRACE, () => db.query(`select public.join_household($1, 'Грейс')`, [token]))
  })

  it('аватарку дома меняет владелец, участник — нет', async () => {
    expect(await as(FRANK, () => affected(`update public.households set icon = '🏡' where id = $1`, [home]))).toBe(1)
    expect(await as(GRACE, () => affected(`update public.households set icon = '🏰' where id = $1`, [home]))).toBe(0)
    expect(await as(GRACE, () => rows(`select name, icon from public.households where id = $1`, [home]))).toEqual([
      { name: 'Дом Фрэнка', icon: '🏡' },
    ])
  })

  it('слишком длинная аватарка не принимается', async () => {
    await expect(
      as(FRANK, () => db.query(`update public.households set icon = $2 where id = $1`, [home, 'x'.repeat(17)])),
    ).rejects.toThrow()
  })

  it('sync_profile записывает фото из аккаунта Google', async () => {
    await as({ ...GRACE, avatar: PHOTO }, () => db.query(`select public.sync_profile('Safari · iPhone', '')`))
    expect(await avatarOf(GRACE.id)).toBe(PHOTO)
    // Фото видят другие участники дома.
    expect(
      await as(FRANK, () => rows(`select avatar_url from public.household_members where user_id = $1`, [GRACE.id])),
    ).toEqual([{ avatar_url: PHOTO }])
  })

  it('картинка не с серверов Google не принимается', async () => {
    for (const url of [
      'https://evil.example.com/pixel.png',
      'http://lh3.googleusercontent.com/a/photo',
      'https://lh3.googleusercontent.com.evil.example/a/photo',
      'javascript:alert(1)',
    ]) {
      await as({ ...GRACE, avatar: url }, () => db.query(`select public.sync_profile('Safari · iPhone', '')`))
      expect(await avatarOf(GRACE.id)).toBeNull()
    }
  })

  it('у участника без аккаунта фото нет, остальные данные записываются как раньше', async () => {
    await as(FRANK, () => db.query(`select public.sync_profile('Chrome · Android', '')`))
    expect(
      await rows(`select device, account_email, avatar_url from public.household_members where user_id = $1`, [FRANK.id]),
    ).toEqual([{ device: 'Chrome · Android', account_email: null, avatar_url: null }])
  })

  it('участник не может записать себе фото в обход функции', async () => {
    await expect(
      as(GRACE, () => db.query(`update public.household_members set avatar_url = 'https://evil.example.com/x.png' where user_id = $1`, [GRACE.id])),
    ).rejects.toThrow()
  })
})

describe('порядок вручную: перетаскивание продуктов и разделов', () => {
  const DAVE = { id: '00000000-0000-0000-0000-00000000000d' }
  const ERIN = { id: '00000000-0000-0000-0000-00000000000e' }
  let home: string
  let fridge: string
  let pantry: string
  let strangerHome: string
  let strangerSection: string
  const ids: Record<string, string> = {}

  const addProduct = async (user: TestUser, householdId: string, sectionId: string, name: string) => {
    const [row] = await as(user, () =>
      rows<{ id: string }>(
        `insert into public.products (household_id, section_id, name, kind) values ($1, $2, $3, 'staple') returning id`,
        [householdId, sectionId, name],
      ),
    )
    ids[name] = row.id
  }

  /** Продукты раздела так, как их показывает приложение. */
  const shown = (sectionId: string) =>
    as(DAVE, async () =>
      (
        await rows<{ name: string }>(
          `select name from public.products where section_id = $1 order by sort_order nulls last, created_at`,
          [sectionId],
        )
      ).map((row) => row.name),
    )

  beforeAll(async () => {
    for (const user of [DAVE, ERIN]) await db.query(`insert into auth.users (id) values ($1)`, [user.id])
    home = await createHousehold(DAVE, 'Дом Дейва')
    fridge = await createSection(DAVE, home, 'Холодильник')
    pantry = await createSection(DAVE, home, 'Шкаф')
    strangerHome = await createHousehold(ERIN, 'Дом Эрин')
    strangerSection = await createSection(ERIN, strangerHome, 'Чужой раздел')
    for (const name of ['Молоко', 'Сыр', 'Яйца']) await addProduct(DAVE, home, fridge, name)
    await addProduct(DAVE, home, pantry, 'Рис')
    await addProduct(ERIN, strangerHome, strangerSection, 'Чужое')
  })

  it('продукт, который не переставляли, места не имеет и стоит по времени добавления', async () => {
    const places = await as(DAVE, () => rows(`select sort_order from public.products where section_id = $1`, [fridge]))
    expect(places).toEqual([{ sort_order: null }, { sort_order: null }, { sort_order: null }])
    expect(await shown(fridge)).toEqual(['Молоко', 'Сыр', 'Яйца'])
  })

  it('reorder_products переставляет продукты раздела и не трогает updated_at', async () => {
    const stamp = () =>
      as(DAVE, async () => (await rows<{ updated_at: Date }>(`select updated_at from public.products where id = $1`, [ids['Яйца']]))[0].updated_at)
    const before = await stamp()

    await as(DAVE, () =>
      db.query(`select public.reorder_products($1, $2)`, [fridge, [ids['Яйца'], ids['Молоко'], ids['Сыр']]]),
    )

    expect(await shown(fridge)).toEqual(['Яйца', 'Молоко', 'Сыр'])
    // По updated_at упорядочен список покупок: перестановка не должна его перемешивать.
    expect((await stamp()).getTime()).toBe(before.getTime())
  })

  it('продукт, добавленный после перестановки, встаёт в конец раздела', async () => {
    await addProduct(DAVE, home, fridge, 'Масло')
    expect(await shown(fridge)).toEqual(['Яйца', 'Молоко', 'Сыр', 'Масло'])
  })

  it('продукт из другого раздела, оказавшийся в списке, переносится в этот раздел', async () => {
    await as(DAVE, () =>
      db.query(`select public.reorder_products($1, $2)`, [pantry, [ids['Сыр'], ids['Рис']]]),
    )
    expect(await shown(pantry)).toEqual(['Сыр', 'Рис'])
    expect(await shown(fridge)).toEqual(['Яйца', 'Молоко', 'Масло'])
  })

  it('отметки продукта по-прежнему обновляют updated_at', async () => {
    const [before] = await as(DAVE, () => rows<{ updated_at: Date }>(`select updated_at from public.products where id = $1`, [ids['Рис']]))
    await new Promise((resolve) => setTimeout(resolve, 5))
    await as(DAVE, () => db.query(`update public.products set to_buy = true where id = $1`, [ids['Рис']]))
    const [after] = await as(DAVE, () => rows<{ updated_at: Date }>(`select updated_at from public.products where id = $1`, [ids['Рис']]))
    expect(after.updated_at.getTime()).toBeGreaterThan(before.updated_at.getTime())
  })

  it('правка названия, иконки и вида не трогает updated_at, а значит и место в покупках', async () => {
    const updatedAt = async () =>
      (await as(DAVE, () => rows<{ updated_at: Date }>(`select updated_at from public.products where id = $1`, [ids['Сыр']])))[0]
        .updated_at
    const before = await updatedAt()
    await db.exec(`select pg_sleep(0.01)`)
    await as(DAVE, () =>
      db.query(`update public.products set name = 'Сыр твёрдый', icon = '🧀', kind = 'one_off' where id = $1`, [ids['Сыр']]),
    )
    const [edited] = await as(DAVE, () => rows(`select name, icon, kind from public.products where id = $1`, [ids['Сыр']]))
    expect(edited).toEqual({ name: 'Сыр твёрдый', icon: '🧀', kind: 'one_off' })
    expect((await updatedAt()).getTime()).toBe(before.getTime())
    await as(DAVE, () => db.query(`update public.products set name = 'Сыр', kind = 'staple' where id = $1`, [ids['Сыр']]))
  })

  it('ручную позицию переименовывает участник дома, посторонний — нет', async () => {
    const [item] = await as(DAVE, () =>
      rows<{ id: string }>(`insert into public.shopping_items (household_id, name) values ($1, 'Хлеб') returning id`, [home]),
    )
    expect(await as(DAVE, () => affected(`update public.shopping_items set name = 'Хлеб ржаной', icon = '🍞' where id = $1`, [item.id]))).toBe(1)
    expect(await as(ERIN, () => affected(`update public.shopping_items set name = 'Взлом' where id = $1`, [item.id]))).toBe(0)
    const [saved] = await as(DAVE, () => rows(`select name, icon from public.shopping_items where id = $1`, [item.id]))
    expect(saved).toEqual({ name: 'Хлеб ржаной', icon: '🍞' })
    await as(DAVE, () => db.query(`delete from public.shopping_items where id = $1`, [item.id]))
  })

  it('посторонний не переставит чужие продукты и не утащит их к себе', async () => {
    await as(ERIN, () =>
      db.query(`select public.reorder_products($1, $2)`, [fridge, [ids['Масло'], ids['Молоко'], ids['Яйца']]]),
    )
    await as(ERIN, () => db.query(`select public.reorder_products($1, $2)`, [strangerSection, [ids['Молоко']]]))
    expect(await shown(fridge)).toEqual(['Яйца', 'Молоко', 'Масло'])
  })

  it('свой продукт нельзя перенести в раздел чужого дома', async () => {
    await expect(
      as(DAVE, () => db.query(`select public.reorder_products($1, $2)`, [strangerSection, [ids['Молоко']]])),
    ).rejects.toThrow()
    expect(await shown(fridge)).toEqual(['Яйца', 'Молоко', 'Масло'])
  })

  it('reorder_sections меняет порядок разделов только своего дома', async () => {
    const order = () =>
      as(DAVE, async () =>
        (await rows<{ name: string }>(`select name from public.sections where household_id = $1 order by sort_order, created_at`, [home])).map(
          (row) => row.name,
        ),
      )
    expect(await order()).toEqual(['Холодильник', 'Шкаф'])

    await as(DAVE, () => db.query(`select public.reorder_sections($1)`, [[pantry, fridge]]))
    expect(await order()).toEqual(['Шкаф', 'Холодильник'])

    await as(ERIN, () => db.query(`select public.reorder_sections($1)`, [[fridge, pantry]]))
    expect(await order()).toEqual(['Шкаф', 'Холодильник'])
  })

  describe('список покупок', () => {
    /** Список покупок так, как его показывает приложение: продукты с отметкой и ручные позиции вместе. */
    const shopping = () =>
      as(DAVE, async () =>
        (
          await rows<{ name: string }>(
            `select name from (
               select name, shopping_order as place, updated_at as added_at from public.products
                 where household_id = $1 and to_buy
               union all
               select name, sort_order, created_at from public.shopping_items where household_id = $1
             ) list order by place nulls last, added_at`,
            [home],
          )
        ).map((row) => row.name),
      )
    const toBuy = (name: string, value: boolean) =>
      as(DAVE, () => db.query(`update public.products set to_buy = $2 where id = $1`, [ids[name], value]))
    const pause = () => new Promise((resolve) => setTimeout(resolve, 5))

    beforeAll(async () => {
      // «Рис» уже в покупках (см. выше); добавляем ещё продукт и ручную позицию.
      await pause()
      await toBuy('Молоко', true)
      await pause()
      const [item] = await as(DAVE, () =>
        rows<{ id: string }>(`insert into public.shopping_items (household_id, name) values ($1, 'Батарейки') returning id`, [home]),
      )
      ids['Батарейки'] = item.id
    })

    it('пока список не переставляли, он идёт в порядке добавления', async () => {
      expect(await shopping()).toEqual(['Рис', 'Молоко', 'Батарейки'])
    })

    it('reorder_shopping переставляет продукты и ручные позиции вперемешку и не трогает updated_at', async () => {
      const stamp = () =>
        as(DAVE, async () => (await rows<{ updated_at: Date }>(`select updated_at from public.products where id = $1`, [ids['Рис']]))[0].updated_at)
      const before = await stamp()

      await as(DAVE, () =>
        db.query(`select public.reorder_shopping($1)`, [[ids['Батарейки'], ids['Рис'], ids['Молоко']]]),
      )

      expect(await shopping()).toEqual(['Батарейки', 'Рис', 'Молоко'])
      expect((await stamp()).getTime()).toBe(before.getTime())
    })

    it('новая строка встаёт в конец переставленного списка', async () => {
      await toBuy('Яйца', true)
      expect(await shopping()).toEqual(['Батарейки', 'Рис', 'Молоко', 'Яйца'])
    })

    it('продукт, положенный в покупки заново, прежнее место не занимает', async () => {
      await toBuy('Рис', false)
      await pause()
      await toBuy('Рис', true)
      expect(await shopping()).toEqual(['Батарейки', 'Молоко', 'Яйца', 'Рис'])
    })

    it('прежняя версия приложения: закончившийся продукт сам попадает в конец списка', async () => {
      await as(DAVE, () => db.query(`update public.products set is_available = true, to_buy = false where id = $1`, [ids['Молоко']]))
      await pause()
      // Старое приложение меняет только наличие.
      await as(DAVE, () => db.query(`update public.products set is_available = false where id = $1`, [ids['Молоко']]))
      expect(await shopping()).toEqual(['Батарейки', 'Яйца', 'Рис', 'Молоко'])
    })

    it('посторонний чужой список не переставит', async () => {
      await as(ERIN, () =>
        db.query(`select public.reorder_shopping($1)`, [[ids['Молоко'], ids['Рис'], ids['Яйца'], ids['Батарейки']]]),
      )
      expect(await shopping()).toEqual(['Батарейки', 'Яйца', 'Рис', 'Молоко'])
    })

    it('без входа функция недоступна', async () => {
      await expect(as(null, () => db.query(`select public.reorder_shopping($1)`, [[ids['Рис']]]))).rejects.toThrow()
    })
  })

  it('без входа функции порядка недоступны', async () => {
    await expect(as(null, () => db.query(`select public.reorder_sections($1)`, [[fridge]]))).rejects.toThrow()
    await expect(as(null, () => db.query(`select public.reorder_products($1, $2)`, [fridge, [ids['Молоко']]]))).rejects.toThrow()
  })
})

describe('обновление существующей базы', () => {
  it('0005: всё, что было в покупках, остаётся в них; разовые продукты не затронуты', async () => {
    const old = new PGlite()
    await old.exec(SUPABASE_STUB)
    const migrations = new URL('../migrations/', import.meta.url)
    const files = readdirSync(migrations).sort()
    const apply = async (file: string) => old.exec(readFileSync(new URL(file, migrations), 'utf8'))

    // База в том виде, в каком её оставила предыдущая версия приложения.
    for (const file of files.filter((name) => name < '0005')) await apply(file)
    await old.exec(`
      insert into public.households (id, name) values ('00000000-0000-0000-0000-0000000000f1', 'Дом');
      insert into public.sections (id, household_id, name)
        values ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', 'Холодильник');
      insert into public.products (household_id, section_id, name, kind, is_available) values
        ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', 'Молоко', 'staple', false),
        ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', 'Сыр', 'staple', true),
        ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', 'Клубника', 'one_off', true);
    `)

    // До 0012: она делает разовые продукты обычными, а здесь проверяется сама 0005.
    for (const file of files.filter((name) => name >= '0005' && name < '0012')) await apply(file)

    const { rows: products } = await old.query(
      `select name, kind, is_available, to_buy from public.products order by name`,
    )
    expect(products).toEqual([
      { name: 'Клубника', kind: 'one_off', is_available: true, to_buy: false },
      { name: 'Молоко', kind: 'staple', is_available: false, to_buy: true },
      { name: 'Сыр', kind: 'staple', is_available: true, to_buy: false },
    ])
    await old.close()
  })

  it('0012: разовые продукты становятся обычными, отметки и место в покупках прежние', async () => {
    const old = new PGlite()
    await old.exec(SUPABASE_STUB)
    const migrations = new URL('../migrations/', import.meta.url)
    const files = readdirSync(migrations).sort()
    const apply = async (file: string) => old.exec(readFileSync(new URL(file, migrations), 'utf8'))

    for (const file of files.filter((name) => name < '0012')) await apply(file)
    await old.exec(`
      insert into public.households (id, name) values ('00000000-0000-0000-0000-0000000000f1', 'Дом');
      insert into public.sections (id, household_id, name)
        values ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', 'Холодильник');
      insert into public.products (household_id, section_id, name, kind, is_available, to_buy, updated_at) values
        ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', 'Клубника', 'one_off', true, false, '2026-11-01'),
        ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', 'Торт', 'one_off', false, false, '2026-11-02'),
        ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', 'Чай', 'one_off', false, true, '2026-11-03'),
        ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', 'Молоко', 'staple', false, true, '2026-11-04');
    `)

    for (const file of files.filter((name) => name >= '0012')) await apply(file)

    const { rows: products } = await old.query(
      `select name, kind, is_available, to_buy, updated_at::date::text as updated from public.products order by updated_at`,
    )
    expect(products).toEqual([
      { name: 'Клубника', kind: 'staple', is_available: true, to_buy: false, updated: '2026-11-01' },
      { name: 'Торт', kind: 'staple', is_available: false, to_buy: false, updated: '2026-11-02' },
      { name: 'Чай', kind: 'staple', is_available: false, to_buy: true, updated: '2026-11-03' },
      { name: 'Молоко', kind: 'staple', is_available: false, to_buy: true, updated: '2026-11-04' },
    ])
    await old.close()
  })

  it('0010: последний визит прежних пользователей — по их сессиям, а не «сегодня»', async () => {
    const old = new PGlite()
    await old.exec(SUPABASE_STUB)
    const migrations = new URL('../migrations/', import.meta.url)
    const files = readdirSync(migrations).sort()
    const apply = async (file: string) => old.exec(readFileSync(new URL(file, migrations), 'utf8'))
    for (const file of files.filter((name) => name < '0010')) await apply(file)

    const [quiet, active, tokenOnly, bare] = ['01', '02', '03', '04'].map(
      (n) => `00000000-0000-0000-0000-0000000010${n}`,
    )
    await old.exec(`
      insert into auth.users (id, created_at, last_sign_in_at) values
        ('${quiet}', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
        ('${active}', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
        ('${tokenOnly}', '2025-01-01T00:00:00Z', null),
        ('${bare}', '2025-03-01T00:00:00Z', null);
      -- Не заходил 300 дней: сессия последний раз продлевалась тогда же.
      insert into auth.sessions (user_id, created_at, updated_at, refreshed_at)
        values ('${quiet}', '2025-01-01T00:00:00Z', '2025-01-20T00:00:00Z', '2025-01-20 00:00:00');
      -- Открывает приложение каждый день: сессия продлевалась недавно (время в UTC без пояса).
      insert into auth.sessions (user_id, created_at, updated_at, refreshed_at)
        values ('${active}', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z', '2026-11-15 08:00:00');
      insert into auth.refresh_tokens (user_id, created_at, updated_at)
        values ('${tokenOnly}', '2025-01-01T00:00:00Z', '2025-06-01T00:00:00Z');
    `)

    await apply('0010_user_activity.sql')

    const { rows: seen } = await old.query<{ user_id: string; last_seen_at: Date }>(
      `select user_id, last_seen_at from private.user_activity order by user_id`,
    )
    expect(seen.map((row) => [row.user_id, row.last_seen_at.toISOString()])).toEqual([
      [quiet, '2025-01-20T00:00:00.000Z'],
      [active, '2026-11-15T08:00:00.000Z'],
      [tokenOnly, '2025-06-01T00:00:00.000Z'],
      [bare, '2025-03-01T00:00:00.000Z'],
    ])
    await old.close()
  })
})

describe('отметка визита', () => {
  const HENRY = { id: '00000000-0000-0000-0000-000000000080' }
  const seenAt = async () =>
    (await rows<{ at: Date }>(`select last_seen_at as at from private.user_activity where user_id = $1`, [HENRY.id]))[0]
      ?.at

  beforeAll(async () => {
    await db.query(`insert into auth.users (id) values ($1)`, [HENRY.id])
  })

  it('визит записывается от имени самого пользователя', async () => {
    await db.query(`delete from private.user_activity where user_id = $1`, [HENRY.id])
    await as(HENRY, () => rows(`select public.mark_visit()`))
    expect(await seenAt()).toBeInstanceOf(Date)
  })

  it('чаще часа запись не переписывается, а через час — обновляется', async () => {
    await db.query(`update private.user_activity set last_seen_at = now() - interval '10 minutes' where user_id = $1`, [
      HENRY.id,
    ])
    const recent = await seenAt()
    await as(HENRY, () => rows(`select public.mark_visit()`))
    expect(await seenAt()).toEqual(recent)

    await db.query(`update private.user_activity set last_seen_at = now() - interval '3 days' where user_id = $1`, [
      HENRY.id,
    ])
    await as(HENRY, () => rows(`select public.mark_visit()`))
    expect(Date.now() - (await seenAt())!.getTime()).toBeLessThan(60_000)
  })

  it('без входа отметить визит нельзя, а таблицу визитов не прочитать никому снаружи', async () => {
    await expect(as(null, () => rows(`select public.mark_visit()`))).rejects.toThrow()
    await expect(as(HENRY, () => rows(`select * from private.user_activity`))).rejects.toThrow()
  })
})

describe('удаление анонимных пользователей, которые не заходили больше года', () => {
  const id = (n: number) => `00000000-0000-0000-0000-0000000009${String(n).padStart(2, '0')}`
  /** Один в своём доме, не заходил два года. */
  const LONER = id(1)
  /** Владелец общего дома, не заходил два года; второй участник активен. */
  const OLD_OWNER = id(2)
  const ACTIVE_MEMBER = id(3)
  /** Аккаунт Google, не заходил два года. */
  const GOOGLE = id(4)
  /** Старая версия приложения: визит не отмечает, но сессия продлевалась вчера. */
  const OLD_APP = id(5)
  /** Не заходил 11 месяцев. */
  const ALMOST = id(6)
  /** Второй участник дома, в котором уже никого активного. */
  const LONER_GUEST = id(7)

  let lonerHome: string
  let sharedHome: string
  let sharedProduct: string

  async function addUser(userId: string, seenAgo: string, anonymous = true) {
    await db.query(
      `insert into auth.users (id, email, is_anonymous, created_at, last_sign_in_at)
       values ($1, $2, $3, now() - interval '3 years', now() - interval '3 years')`,
      [userId, anonymous ? null : `${userId.slice(-4)}@gmail.com`, anonymous],
    )
    await db.query(`insert into private.user_activity (user_id, last_seen_at) values ($1, now() - $2::interval)`, [
      userId,
      seenAgo,
    ])
  }

  const exists = async (table: string, column: string, value: string) =>
    (await rows(`select 1 from ${table} where ${column} = $1`, [value])).length > 0

  beforeAll(async () => {
    await addUser(LONER, '2 years')
    await addUser(LONER_GUEST, '2 years')
    await addUser(OLD_OWNER, '2 years')
    await addUser(ACTIVE_MEMBER, '1 day')
    await addUser(GOOGLE, '2 years', false)
    await addUser(OLD_APP, '2 years')
    await addUser(ALMOST, '11 months')
    await db.query(
      `insert into auth.sessions (user_id, created_at, updated_at, refreshed_at)
       values ($1, now() - interval '2 years', now() - interval '2 years', (now() - interval '1 day') at time zone 'UTC')`,
      [OLD_APP],
    )

    lonerHome = await createHousehold({ id: LONER }, 'Заброшенный дом')
    await createSection({ id: LONER }, lonerHome, 'Холодильник')
    await db.query(`insert into public.household_members (household_id, user_id, role) values ($1, $2, 'member')`, [
      lonerHome,
      LONER_GUEST,
    ])

    sharedHome = await createHousehold({ id: OLD_OWNER }, 'Общий дом')
    const fridge = await createSection({ id: OLD_OWNER }, sharedHome, 'Холодильник')
    await db.query(
      `insert into public.household_members (household_id, user_id, role, created_at) values ($1, $2, 'member', now())`,
      [sharedHome, ACTIVE_MEMBER],
    )
    const [product] = await rows<{ id: string }>(
      `insert into public.products (household_id, section_id, name, kind, created_by)
       values ($1, $2, 'Молоко', 'staple', $3) returning id`,
      [sharedHome, fridge, OLD_OWNER],
    )
    sharedProduct = product.id

    for (const userId of [GOOGLE, OLD_APP, ALMOST]) await createHousehold({ id: userId }, 'Дом')
  })

  it('удаляются только заброшенные анонимные: число удалённых — в ответе', async () => {
    const [{ removed }] = await rows<{ removed: number }>(`select private.forget_inactive_anonymous() as removed`)
    expect(removed).toBe(3)

    for (const gone of [LONER, LONER_GUEST, OLD_OWNER]) expect(await exists('auth.users', 'id', gone)).toBe(false)
    for (const kept of [ACTIVE_MEMBER, GOOGLE, OLD_APP, ALMOST]) expect(await exists('auth.users', 'id', kept)).toBe(true)
  })

  it('опустевший дом удаляется вместе с разделами', async () => {
    expect(await exists('public.households', 'id', lonerHome)).toBe(false)
    expect(await exists('public.sections', 'household_id', lonerHome)).toBe(false)
  })

  it('из общего дома уходит только он: владельцем становится оставшийся, продукты на месте', async () => {
    expect(await exists('public.households', 'id', sharedHome)).toBe(true)
    const members = await rows(`select user_id, role from public.household_members where household_id = $1`, [
      sharedHome,
    ])
    expect(members).toEqual([{ user_id: ACTIVE_MEMBER, role: 'owner' }])
    const [milk] = await rows(`select name, created_by from public.products where id = $1`, [sharedProduct])
    expect(milk).toEqual({ name: 'Молоко', created_by: null })
  })

  it('отметки визитов удалённых уходят вместе с ними', async () => {
    expect(await exists('private.user_activity', 'user_id', LONER)).toBe(false)
  })

  it('удалить тех, кто заходил меньше года назад, нельзя даже вручную', async () => {
    await expect(rows(`select private.forget_inactive_anonymous(interval '30 days')`)).rejects.toThrow()
  })

  it('пользователь приложения вызвать удаление не может', async () => {
    await expect(as({ id: ACTIVE_MEMBER }, () => rows(`select private.forget_inactive_anonymous()`))).rejects.toThrow()
  })
})
