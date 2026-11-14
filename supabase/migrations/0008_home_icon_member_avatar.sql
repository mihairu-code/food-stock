-- Аватарка дома и фото участника из аккаунта Google.
--
-- Миграция только добавляет: версии приложения, не знающие о новых столбцах,
-- продолжают работать.

-- Аватарка дома — эмодзи, как у разделов. Меняет её владелец: политика
-- «owner renames household» уже разрешает ему обновлять строку дома.
alter table public.households
  add column icon text check (icon is null or char_length(icon) <= 16);

-- Фото участника. Его видят другие участники дома, поэтому оно хранится рядом
-- с именем и почтой, а не только в аккаунте.
alter table public.household_members
  add column avatar_url text;

-- Вызывается приложением при запуске: записывает устройство, почту и фото во все дома
-- пользователя. Сигнатура прежняя — фото берётся из токена, а не из параметров, поэтому
-- его получают и версии приложения, которые о нём не знают.
create or replace function public.sync_profile(p_device text, p_display_name text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := nullif(lower(auth.jwt() ->> 'email'), '');
  v_name text := private.clean_name(p_display_name);
  v_avatar text := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'avatar_url',
    auth.jwt() -> 'user_metadata' ->> 'picture'
  );
begin
  if v_user_id is null then
    return;
  end if;

  -- Данные аккаунта человек может менять сам, а адрес картинки откроют браузеры других
  -- участников. Поэтому принимается только фото, которое лежит у Google.
  if v_avatar is null
    or char_length(v_avatar) > 500
    or v_avatar !~ '^https://[a-z0-9-]+\.googleusercontent\.com/'
  then
    v_avatar := null;
  end if;

  update public.household_members m
  set device = left(btrim(coalesce(p_device, '')), 60),
      account_email = v_email,
      avatar_url = v_avatar,
      -- Имя из аккаунта подставляется, только если человек не задал своё.
      display_name = case when m.display_name = '' then v_name else m.display_name end
  where m.user_id = v_user_id
    and (
      m.device is distinct from left(btrim(coalesce(p_device, '')), 60)
      or m.account_email is distinct from v_email
      or m.avatar_url is distinct from v_avatar
      or (m.display_name = '' and v_name <> '')
    );
end;
$$;
