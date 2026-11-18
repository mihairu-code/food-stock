-- Когда пользователь в последний раз открывал приложение.
--
-- По этой дате потом удаляются анонимные пользователи, которые не заходили больше года:
-- вернуться к такому пользователю нельзя (он живёт только на своём устройстве), а его
-- дом и продукты остаются в базе навсегда. Само удаление — отдельной миграцией.
--
-- Миграция только добавляет: прежние версии приложения визит не отмечают, для них дату
-- можно оценить по сессиям входа (см. ниже).

-- Схема private недоступна через Data API: читать и писать сюда может только сама база.
create table private.user_activity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table private.user_activity enable row level security;

-- Пользователи, которые были до этой миграции, получают не «сегодня», а настоящую оценку
-- последнего визита. Открытое приложение продлевает вход примерно раз в час — это видно
-- по сессиям и токенам обновления; если их нет — по последнему входу и созданию.
-- refreshed_at хранится без часового пояса, в UTC.
insert into private.user_activity (user_id, last_seen_at)
select
  u.id,
  coalesce(
    greatest(
      u.created_at,
      u.last_sign_in_at,
      (select max(greatest(s.created_at, s.updated_at, s.refreshed_at at time zone 'UTC'))
       from auth.sessions s where s.user_id = u.id),
      (select max(greatest(t.created_at, t.updated_at))
       from auth.refresh_tokens t where t.user_id = u.id::text)
    ),
    now()
  )
from auth.users u
on conflict (user_id) do nothing;

-- Приложение отмечает визит при запуске и при возвращении к нему, не чаще раза в сутки
-- с одного устройства. Чаще часа запись не переписывается: с нескольких устройств
-- отметки приходят вразнобой, а точность до часа для «больше года» не нужна.
create function public.mark_visit()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.user_activity (user_id, last_seen_at)
  select auth.uid(), now()
  where auth.uid() is not null
  on conflict (user_id) do update
    set last_seen_at = excluded.last_seen_at
    where private.user_activity.last_seen_at < excluded.last_seen_at - interval '1 hour';
$$;

revoke all on function public.mark_visit() from public, anon;
grant execute on function public.mark_visit() to authenticated;
