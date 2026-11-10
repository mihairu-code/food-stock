-- Аккаунт Google поверх входа без регистрации.
--
-- Человек — это аккаунт, а не устройство. Пока аккаунта нет, каждый браузер и каждое
-- приложение на экране «Домой» — отдельный анонимный пользователь. Когда человек входит
-- через Google, анонимный пользователь этого устройства вливается в аккаунт: его дома
-- переходят к аккаунту, а сам он удаляется. Так дубли одного человека исчезают сами.
--
-- Миграция только добавляет: уже выложенные версии приложения продолжают работать.

-- ---------------------------------------------------------------------------
-- Кто есть кто среди участников
-- ---------------------------------------------------------------------------

alter table public.household_members
  -- «Safari · iPhone», «Приложение · iPhone» — чтобы отличать устройства без аккаунта.
  add column device text not null default '' check (char_length(device) <= 60),
  -- Почта аккаунта Google; у анонимного участника пусто.
  add column account_email text;

-- Вызывается приложением при запуске: записывает устройство и почту во все дома пользователя.
create function public.sync_profile(p_device text, p_display_name text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := nullif(lower(auth.jwt() ->> 'email'), '');
  v_name text := private.clean_name(p_display_name);
begin
  if v_user_id is null then
    return;
  end if;

  update public.household_members m
  set device = left(btrim(coalesce(p_device, '')), 60),
      account_email = v_email,
      -- Имя из аккаунта подставляется, только если человек не задал своё.
      display_name = case when m.display_name = '' then v_name else m.display_name end
  where m.user_id = v_user_id
    and (
      m.device is distinct from left(btrim(coalesce(p_device, '')), 60)
      or m.account_email is distinct from v_email
      or (m.display_name = '' and v_name <> '')
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Слияние анонимного пользователя устройства с аккаунтом
-- ---------------------------------------------------------------------------
-- Перед уходом на страницу Google устройство получает одноразовый «билет». После входа
-- им доказывается, что анонимный пользователь принадлежал тому же человеку. В базе
-- хранится только хеш билета; схема private недоступна через Data API.

create table private.merge_tickets (
  token_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 day'
);

create function public.create_merge_ticket()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text := replace(gen_random_uuid()::text, '-', '');
begin
  if v_user_id is null then
    raise exception 'Требуется вход' using errcode = '28000';
  end if;

  delete from private.merge_tickets where user_id = v_user_id or expires_at <= now();
  insert into private.merge_tickets (token_hash, user_id) values (private.hash_token(v_token), v_user_id);
  return v_token;
end;
$$;

-- Пустой дом: в нём ничего не заводили. Такие дома приложение создаёт само при первом запуске.
create function private.home_is_empty(p_household_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select not exists (select 1 from public.sections s where s.household_id = p_household_id)
     and not exists (select 1 from public.shopping_items i where i.household_id = p_household_id)
     and not exists (select 1 from public.household_members m where m.household_id = p_household_id offset 1);
$$;

-- Дома пользователя, в которых нет второго пользователя, и в которых что-то есть.
create function private.own_homes(p_user_id uuid, p_other_id uuid)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select m.household_id
  from public.household_members m
  where m.user_id = p_user_id
    and not private.home_is_empty(m.household_id)
    and not exists (
      select 1 from public.household_members o
      where o.household_id = m.household_id and o.user_id = p_other_id
    );
$$;

-- Пользователь покидает дом. Опустевший дом удаляется; если ушёл владелец,
-- владельцем становится участник, который в доме дольше всех.
create function private.leave_home(p_household_id uuid, p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.household_members
  where household_id = p_household_id and user_id = p_user_id;

  if not exists (select 1 from public.household_members where household_id = p_household_id) then
    delete from public.households where id = p_household_id;
  elsif not exists (
    select 1 from public.household_members where household_id = p_household_id and role = 'owner'
  ) then
    update public.household_members m
    set role = 'owner'
    where m.household_id = p_household_id
      and m.user_id = (
        select o.user_id from public.household_members o
        where o.household_id = p_household_id
        order by o.created_at, o.user_id
        limit 1
      );
  end if;
end;
$$;

create function private.describe_homes(p_household_ids uuid[])
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', h.id,
    'name', h.name,
    'sections', (select count(*) from public.sections s where s.household_id = h.id),
    'products', (select count(*) from public.products p where p.household_id = h.id),
    'shopping_items', (select count(*) from public.shopping_items i where i.household_id = h.id),
    'members', (select count(*) from public.household_members m where m.household_id = h.id)
  ) order by h.created_at), '[]'::jsonb)
  from public.households h
  where h.id = any (p_household_ids);
$$;

-- Проверяет билет и возвращает анонимного пользователя устройства.
-- null — билет принадлежит самому вызывающему, сливать нечего.
create function private.ticket_device_user(p_token text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_account_id uuid := auth.uid();
  v_device_id uuid;
begin
  if v_account_id is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Нужен вход в аккаунт' using errcode = '28000';
  end if;

  select t.user_id into v_device_id
  from private.merge_tickets t
  where t.token_hash = private.hash_token(p_token) and t.expires_at > now();

  if v_device_id is null then
    raise exception 'Билет слияния недействителен или истёк' using errcode = 'P0002';
  end if;
  if v_device_id = v_account_id then
    return null;
  end if;
  -- Вливать в аккаунт можно только анонимного пользователя, но не чужой аккаунт.
  if not coalesce((select u.is_anonymous from auth.users u where u.id = v_device_id), false) then
    raise exception 'Слить можно только пользователя без аккаунта' using errcode = '42501';
  end if;
  return v_device_id;
end;
$$;

-- Что получится при слиянии. needs_choice — у устройства и у аккаунта есть разные
-- непустые дома, и человек должен выбрать, какой оставить.
create function public.preview_merge(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_account_id uuid := auth.uid();
  v_device_id uuid := private.ticket_device_user(p_token);
  v_device_homes uuid[];
  v_account_homes uuid[];
begin
  if v_device_id is null then
    return jsonb_build_object('needs_choice', false, 'device', '[]'::jsonb, 'account', '[]'::jsonb);
  end if;

  v_device_homes := array(select private.own_homes(v_device_id, v_account_id));
  v_account_homes := array(select private.own_homes(v_account_id, v_device_id));

  return jsonb_build_object(
    'needs_choice', cardinality(v_device_homes) > 0 and cardinality(v_account_homes) > 0,
    'device', private.describe_homes(v_device_homes),
    'account', private.describe_homes(v_account_homes)
  );
end;
$$;

-- Выполняет слияние и возвращает дом, который стоит открыть.
-- p_keep: 'device' — оставить дома этого устройства, 'account' — дома аккаунта.
-- Нужен, только когда preview_merge вернул needs_choice; иначе игнорируется.
create function public.complete_merge(p_token text, p_keep text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_id uuid := auth.uid();
  v_device_id uuid := private.ticket_device_user(p_token);
  v_device_homes uuid[];
  v_account_homes uuid[];
  v_home uuid;
  v_role text;
  v_result uuid;
begin
  if v_device_id is null then
    delete from private.merge_tickets where token_hash = private.hash_token(p_token);
    return null;
  end if;

  v_device_homes := array(select private.own_homes(v_device_id, v_account_id));
  v_account_homes := array(select private.own_homes(v_account_id, v_device_id));

  if cardinality(v_device_homes) > 0 and cardinality(v_account_homes) > 0 then
    if p_keep = 'device' then
      foreach v_home in array v_account_homes loop
        perform private.leave_home(v_home, v_account_id);
      end loop;
    elsif p_keep = 'account' then
      foreach v_home in array v_device_homes loop
        perform private.leave_home(v_home, v_device_id);
      end loop;
    else
      raise exception 'Нужно выбрать, какое пространство оставить' using errcode = '22023';
    end if;
  end if;

  -- Всё, что осталось у анонимного пользователя, переходит к аккаунту.
  for v_home, v_role in
    select m.household_id, m.role from public.household_members m where m.user_id = v_device_id
  loop
    if private.home_is_empty(v_home) and exists (
      select 1 from public.household_members m where m.user_id = v_account_id
    ) then
      -- Автоматически созданный пустой дом переносить незачем, если у аккаунта уже есть свой.
      perform private.leave_home(v_home, v_device_id);
    elsif exists (
      select 1 from public.household_members m where m.household_id = v_home and m.user_id = v_account_id
    ) then
      -- Оба уже в этом доме (один человек с двух устройств): остаётся одна запись.
      if v_role = 'owner' then
        update public.household_members set role = 'owner'
        where household_id = v_home and user_id = v_account_id;
      end if;
      delete from public.household_members where household_id = v_home and user_id = v_device_id;
    else
      update public.household_members
      set user_id = v_account_id, account_email = nullif(lower(auth.jwt() ->> 'email'), '')
      where household_id = v_home and user_id = v_device_id;
      v_result := coalesce(v_result, v_home);
    end if;
  end loop;

  -- У аккаунта появился настоящий дом — его собственный пустой больше не нужен.
  if exists (
    select 1 from public.household_members m
    where m.user_id = v_account_id and not private.home_is_empty(m.household_id)
  ) then
    for v_home in
      select m.household_id from public.household_members m
      where m.user_id = v_account_id and private.home_is_empty(m.household_id)
    loop
      perform private.leave_home(v_home, v_account_id);
    end loop;
  end if;

  update public.products set created_by = v_account_id where created_by = v_device_id;
  update public.shopping_items set created_by = v_account_id where created_by = v_device_id;
  update public.household_invites set created_by = v_account_id where created_by = v_device_id;

  -- Билеты удалятся каскадом вместе с пользователем.
  delete from auth.users where id = v_device_id;

  return coalesce(
    v_result,
    (select m.household_id from public.household_members m
     where m.user_id = v_account_id
     order by private.home_is_empty(m.household_id), m.created_at
     limit 1)
  );
end;
$$;

revoke all on function private.home_is_empty(uuid), private.own_homes(uuid, uuid),
  private.leave_home(uuid, uuid), private.describe_homes(uuid[]), private.ticket_device_user(text)
  from public;

revoke all on function public.sync_profile(text, text) from public, anon;
revoke all on function public.create_merge_ticket() from public, anon;
revoke all on function public.preview_merge(text) from public, anon;
revoke all on function public.complete_merge(text, text) from public, anon;

grant execute on function public.sync_profile(text, text) to authenticated;
grant execute on function public.create_merge_ticket() to authenticated;
grant execute on function public.preview_merge(text) to authenticated;
grant execute on function public.complete_merge(text, text) to authenticated;
