-- «Покинуть дом» (решение 0022).
--
-- Участник сам уходит из дома, в который вступил по ссылке. Раньше уйти можно было,
-- только если владелец удалит, а private.leave_home вызывало лишь слияние аккаунтов.
--
-- Уходит владелец — владельцем становится участник, который в доме дольше всех
-- (private.leave_home, как в 0004 и 0011). Продукты, разделы и ссылки-приглашения
-- остаются в доме.
--
-- Последнему участнику уходить некуда: дом бы просто удалился вместе с продуктами.
-- Приложение эту строку ему не показывает, а функция отказывает.
--
-- Миграция только добавляет.

create function public.leave_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Требуется вход' using errcode = '28000';
  end if;

  -- Двое последних участников уходят одновременно: без блокировки каждый увидел бы
  -- другого и ушёл, а пустой дом остался бы в базе навсегда.
  perform 1 from public.households where id = p_household_id for update;

  if not exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id = v_user
  ) then
    raise exception 'Вы не участник этого дома' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id <> v_user
  ) then
    raise exception 'Последний участник не может покинуть дом' using errcode = 'P0001';
  end if;

  perform private.leave_home(p_household_id, v_user);
end;
$$;

revoke all on function public.leave_household(uuid) from public, anon;
grant execute on function public.leave_household(uuid) to authenticated;
