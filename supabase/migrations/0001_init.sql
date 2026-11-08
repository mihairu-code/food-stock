-- Домашние запасы — схема MVP: таблицы, RLS, RPC и Realtime.
-- Выполнить один раз: Supabase → SQL Editor, либо `supabase db push`.
--
-- Правило доступа одно: пользователь видит и меняет только данные домов,
-- в которых он состоит (household_members). Состав дома меняет владелец.

-- ---------------------------------------------------------------------------
-- Таблицы
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  -- Копия email на момент вступления: auth.users клиенту недоступна.
  email text not null,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_id_idx on public.household_members (user_id);

-- Приглашение адресовано email-адресу, а не секретному коду:
-- принять его может только вошедший пользователь с этим адресом.
create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and position('@' in email) > 1),
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, email)
);
create index household_invites_email_idx on public.household_invites (email);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  icon text check (icon is null or char_length(icon) <= 16),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  -- Нужен составному внешнему ключу products: раздел и продукт всегда в одном доме.
  unique (id, household_id)
);
create index sections_household_id_idx on public.sections (household_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  section_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  icon text check (icon is null or char_length(icon) <= 16),
  kind text not null check (kind in ('staple', 'one_off')),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- Удаление раздела каскадно удаляет его продукты, а значит и их строки
  -- в вычисляемом списке покупок.
  foreign key (section_id, household_id)
    references public.sections (id, household_id) on delete cascade,
  -- Разовый продукт существует, только пока он есть дома.
  constraint one_off_is_always_available check (kind = 'staple' or is_available)
);
create index products_household_id_idx on public.products (household_id);
create index products_section_id_idx on public.products (section_id);

-- Только позиции, добавленные вручную. Закончившиеся базовые продукты сюда
-- не копируются: список покупок = products(kind = 'staple' and not is_available)
-- плюс shopping_items.
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  icon text check (icon is null or char_length(icon) <= 16),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);
create index shopping_items_household_id_idx on public.shopping_items (household_id);

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Проверки членства для политик RLS
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER, чтобы политика household_members не ссылалась сама на себя.
-- Схема private не публикуется через Data API.

create schema if not exists private;

create function private.is_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
  );
$$;

create function private.is_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

create function private.my_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(nullif(auth.jwt() ->> 'email', ''));
$$;

revoke all on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.sections enable row level security;
alter table public.products enable row level security;
alter table public.shopping_items enable row level security;

revoke all on public.households, public.household_members, public.household_invites,
  public.sections, public.products, public.shopping_items from anon;

grant select, update on public.households to authenticated;
grant select, delete on public.household_members to authenticated;
grant select, insert, delete on public.household_invites to authenticated;
grant select, insert, update, delete on public.sections, public.products, public.shopping_items
  to authenticated;

-- Дом: создаётся только через create_household(); переименовывает владелец.
create policy "members read household" on public.households
  for select to authenticated
  using (private.is_member(id));

create policy "owner renames household" on public.households
  for update to authenticated
  using (private.is_owner(id))
  with check (private.is_owner(id));

-- Состав дома: вступают только через create_household() / accept_invite().
create policy "members read members" on public.household_members
  for select to authenticated
  using (private.is_member(household_id));

create policy "owner removes members" on public.household_members
  for delete to authenticated
  using (private.is_owner(household_id) and role <> 'owner');

-- Приглашения: участники дома видят отправленные, адресат — свои.
create policy "members and invitee read invites" on public.household_invites
  for select to authenticated
  using (private.is_member(household_id) or email = private.my_email());

create policy "owner creates invites" on public.household_invites
  for insert to authenticated
  with check (private.is_owner(household_id) and invited_by = (select auth.uid()));

create policy "owner revokes, invitee declines" on public.household_invites
  for delete to authenticated
  using (private.is_owner(household_id) or email = private.my_email());

-- Бытовые данные: все участники дома редактируют одинаково.
create policy "members manage sections" on public.sections
  for all to authenticated
  using (private.is_member(household_id))
  with check (private.is_member(household_id));

create policy "members manage products" on public.products
  for all to authenticated
  using (private.is_member(household_id))
  with check (private.is_member(household_id));

create policy "members manage shopping items" on public.shopping_items
  for all to authenticated
  using (private.is_member(household_id))
  with check (private.is_member(household_id));

-- ---------------------------------------------------------------------------
-- RPC
-- ---------------------------------------------------------------------------

-- Создать дом и стать его владельцем.
create function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'Требуется вход' using errcode = '28000';
  end if;

  insert into public.households (name)
  values (btrim(p_name))
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role, email)
  values (v_household_id, v_user_id, 'owner', coalesce(private.my_email(), ''));

  return v_household_id;
end;
$$;

-- Приглашения, адресованные текущему пользователю (с названием дома,
-- которое он ещё не может прочитать через RLS).
create function public.list_my_invites()
returns table (
  id uuid,
  household_id uuid,
  household_name text,
  invited_by_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.household_id, h.name, m.email
  from public.household_invites i
  join public.households h on h.id = i.household_id
  left join public.household_members m
    on m.household_id = i.household_id and m.user_id = i.invited_by
  where i.email = private.my_email()
  order by i.created_at;
$$;

-- Принять приглашение: проверить адресата, добавить в дом, удалить приглашение.
create function public.accept_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := private.my_email();
  v_household_id uuid;
begin
  if v_user_id is null or v_email is null then
    raise exception 'Требуется вход' using errcode = '28000';
  end if;

  delete from public.household_invites
  where id = p_invite_id and email = v_email
  returning household_id into v_household_id;

  if v_household_id is null then
    raise exception 'Приглашение не найдено' using errcode = 'P0002';
  end if;

  insert into public.household_members (household_id, user_id, role, email)
  values (v_household_id, v_user_id, 'member', v_email)
  on conflict (household_id, user_id) do nothing;

  return v_household_id;
end;
$$;

-- Покупка вручную добавленной позиции: одной транзакцией убрать её из покупок
-- и создать продукт в выбранном разделе. SECURITY INVOKER — действуют политики RLS
-- вызывающего; раздел из чужого дома отсечёт составной внешний ключ products.
create function public.purchase_shopping_item(
  p_item_id uuid,
  p_section_id uuid,
  p_make_staple boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item public.shopping_items;
  v_product_id uuid;
begin
  delete from public.shopping_items
  where id = p_item_id
  returning * into v_item;

  if v_item.id is null then
    raise exception 'Позиция покупок не найдена' using errcode = 'P0002';
  end if;

  insert into public.products (household_id, section_id, name, icon, kind, is_available)
  values (
    v_item.household_id,
    p_section_id,
    v_item.name,
    v_item.icon,
    case when p_make_staple then 'staple' else 'one_off' end,
    true
  )
  returning id into v_product_id;

  return v_product_id;
end;
$$;

revoke all on function public.create_household(text) from public, anon;
revoke all on function public.list_my_invites() from public, anon;
revoke all on function public.accept_invite(uuid) from public, anon;
revoke all on function public.purchase_shopping_item(uuid, uuid, boolean) from public, anon;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.list_my_invites() to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;
grant execute on function public.purchase_shopping_item(uuid, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (Postgres Changes)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table
  public.households,
  public.household_members,
  public.household_invites,
  public.sections,
  public.products,
  public.shopping_items;
