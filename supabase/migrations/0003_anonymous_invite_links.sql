-- Вход без регистрации.
--
-- Пользователь — анонимный пользователь Supabase (signInAnonymously): у него есть
-- свой auth.uid(), поэтому политики RLS по домам остаются прежними. Меняется только
-- способ попасть в дом: вместо приглашения на email — одноразовая ссылка с токеном.

-- ---------------------------------------------------------------------------
-- Убираем всё, что было завязано на email
-- ---------------------------------------------------------------------------

drop function public.list_my_invites();
drop function public.accept_invite(uuid);
drop function public.create_household(text);
drop table public.household_invites; -- вместе с политиками и записью в публикации Realtime
drop function private.my_email();

alter table public.household_members drop column email;
alter table public.household_members
  add column display_name text not null default ''
  check (char_length(display_name) <= 40);

-- Участник может поменять только своё имя: право выдано на один столбец.
grant update (display_name) on public.household_members to authenticated;

create policy "member renames self" on public.household_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Ссылки-приглашения
-- ---------------------------------------------------------------------------
-- Ссылка — это ключ от дома, поэтому она одноразовая, живёт 7 дней, а в базе
-- хранится только хеш токена: прочитать готовую ссылку из таблицы нельзя.

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  token_hash text not null unique,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
create index household_invites_household_id_idx on public.household_invites (household_id);

alter table public.household_invites enable row level security;
revoke all on public.household_invites from anon, authenticated;
-- Хеш токена клиенту не отдаётся даже участникам дома.
grant select (id, household_id, created_by, created_at, expires_at)
  on public.household_invites to authenticated;
grant delete on public.household_invites to authenticated;

-- Создаются ссылки только через create_invite().
create policy "members read invites" on public.household_invites
  for select to authenticated
  using (private.is_member(household_id));

create policy "owner revokes invites" on public.household_invites
  for delete to authenticated
  using (private.is_owner(household_id));

create function private.hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(lower(btrim(p_token)), 'UTF8')), 'hex');
$$;

create function private.clean_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(btrim(coalesce(p_name, '')), 40);
$$;

revoke all on function private.hash_token(text), private.clean_name(text) from public;

-- ---------------------------------------------------------------------------
-- RPC
-- ---------------------------------------------------------------------------

-- Создать дом и стать его владельцем.
create function public.create_household(p_name text, p_display_name text default '')
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

  insert into public.household_members (household_id, user_id, role, display_name)
  values (v_household_id, v_user_id, 'owner', private.clean_name(p_display_name));

  return v_household_id;
end;
$$;

-- Создать одноразовую ссылку. Возвращает токен — единственный раз, когда он виден.
create function public.create_invite(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- UUID v4 — 122 случайных бита из криптографического генератора.
  v_token text := replace(gen_random_uuid()::text, '-', '');
begin
  if not private.is_owner(p_household_id) then
    raise exception 'Приглашать может только владелец дома' using errcode = '42501';
  end if;

  delete from public.household_invites
  where household_id = p_household_id and expires_at <= now();

  insert into public.household_invites (household_id, token_hash, created_by)
  values (p_household_id, private.hash_token(v_token), auth.uid());

  return v_token;
end;
$$;

-- Присоединиться к дому по токену из ссылки.
create function public.join_household(p_token text, p_display_name text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite_id uuid;
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'Требуется вход' using errcode = '28000';
  end if;

  select i.id, i.household_id
  into v_invite_id, v_household_id
  from public.household_invites i
  where i.token_hash = private.hash_token(p_token) and i.expires_at > now()
  for update;

  if v_invite_id is null then
    raise exception 'Ссылка недействительна, истекла или уже использована' using errcode = 'P0002';
  end if;

  -- Тот, кто уже в доме, ссылку не расходует.
  if private.is_member(v_household_id) then
    return v_household_id;
  end if;

  delete from public.household_invites where id = v_invite_id;

  insert into public.household_members (household_id, user_id, role, display_name)
  values (v_household_id, v_user_id, 'member', private.clean_name(p_display_name));

  -- При первом запуске приложение само создаёт пользователю дом. Если он так и остался
  -- пустым и в нём больше никого нет, после вступления в чужой дом он не нужен.
  delete from public.households h
  where h.id <> v_household_id
    and exists (
      select 1 from public.household_members m
      where m.household_id = h.id and m.user_id = v_user_id
    )
    and not exists (
      select 1 from public.household_members m
      where m.household_id = h.id and m.user_id <> v_user_id
    )
    and not exists (select 1 from public.sections s where s.household_id = h.id)
    and not exists (select 1 from public.shopping_items i where i.household_id = h.id)
    and not exists (select 1 from public.household_invites i where i.household_id = h.id);

  return v_household_id;
end;
$$;

revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.create_invite(uuid) from public, anon;
revoke all on function public.join_household(text, text) from public, anon;

grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.create_invite(uuid) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;

alter publication supabase_realtime add table public.household_invites;
