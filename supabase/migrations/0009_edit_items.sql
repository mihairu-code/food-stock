-- Правка продукта и ручной позиции покупок: название, иконка, вид.
--
-- Миграция только добавляет и меняет тело триггерной функции: прежние версии приложения
-- продуктов не переименовывают и разницы не заметят.

-- updated_at продукта — «когда изменилась отметка»: по нему упорядочен список покупок
-- там, где его не переставляли. Раньше его меняли и название, иконка и вид продукта —
-- переименованный продукт уезжал в конец списка покупок. Теперь только отметки
-- «есть дома» и «в покупках».
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.is_available, new.to_buy) is distinct from (old.is_available, old.to_buy) then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- Индексы на внешние ключи (подсказка Supabase Advisors): без них удаление раздела
-- и удаление пользователя при слиянии аккаунтов просматривают таблицу целиком.
create index if not exists products_section_household_idx on public.products (section_id, household_id);
create index if not exists products_created_by_idx on public.products (created_by);
create index if not exists shopping_items_created_by_idx on public.shopping_items (created_by);
create index if not exists household_invites_created_by_idx on public.household_invites (created_by);
create index if not exists merge_tickets_user_id_idx on private.merge_tickets (user_id);
