-- Удаление заброшенных анонимных пользователей.
--
-- Анонимный пользователь живёт только на своём устройстве: потерял телефон, удалил
-- приложение или очистил данные браузера — вернуться к нему нельзя, а его дом и продукты
-- остаются в базе навсегда. Раз в сутки база удаляет анонимных пользователей, которые
-- не открывали приложение больше года. Аккаунты Google не трогаются: человек может
-- войти снова с любого устройства.
--
-- Из общего дома уходит только сам пользователь: если он был владельцем, владельцем
-- становится участник, который в доме дольше всех (private.leave_home). Дом удаляется,
-- только когда в нём никого не осталось. Продукты, которые он заводил, остаются в доме
-- без автора (created_by → null).
--
-- Миграция только добавляет.

-- Сколько не заходил пользователь — по самой поздней из отметок: визит в приложении (0010)
-- и, на случай старых версий приложения без отметки визита, сессии входа.
create function private.forget_inactive_anonymous(p_inactive interval default interval '1 year')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_home uuid;
  v_count integer := 0;
begin
  -- Защита от опечатки при ручном вызове: удалить того, кто был недавно, нельзя.
  if p_inactive < interval '1 year' then
    raise exception 'Удалять можно только тех, кто не заходил хотя бы год' using errcode = '22023';
  end if;

  for v_user in
    select u.id
    from auth.users u
    left join private.user_activity a on a.user_id = u.id
    where u.is_anonymous
      and greatest(
        a.last_seen_at,
        u.created_at,
        u.last_sign_in_at,
        (select max(greatest(s.created_at, s.updated_at, s.refreshed_at at time zone 'UTC'))
         from auth.sessions s where s.user_id = u.id),
        (select max(greatest(t.created_at, t.updated_at))
         from auth.refresh_tokens t where t.user_id = u.id::text)
      ) < now() - p_inactive
  loop
    for v_home in select m.household_id from public.household_members m where m.user_id = v_user loop
      perform private.leave_home(v_home, v_user);
    end loop;
    -- Сессии, визиты и билеты слияния удаляются вместе с пользователем (on delete cascade).
    delete from auth.users where id = v_user;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function private.forget_inactive_anonymous(interval) from public, anon, authenticated;

-- Расписание: каждый день в 03:17 UTC. pg_cron есть в Supabase, но не в тестовом
-- движке (PGlite) — там миграция только заводит функцию.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    grant usage on schema cron to postgres;
    grant all privileges on all tables in schema cron to postgres;
    -- С тем же именем задача заменяется, а не дублируется.
    perform cron.schedule(
      'forget-inactive-anonymous',
      '17 3 * * *',
      'select private.forget_inactive_anonymous()'
    );
  end if;
end;
$$;
