-- Порядок в списке покупок: его строки можно перетаскивать.
--
-- Список собирается из двух таблиц — продукты с отметкой to_buy и позиции, добавленные
-- вручную, — поэтому место хранится в обеих. Миграция только добавляет: версии приложения,
-- не знающие о порядке, продолжают работать и видят список по времени добавления.

-- Место в списке покупок. null — строку не переставляли: она стоит после переставленных,
-- в порядке добавления в список.
alter table public.products
  add column shopping_order integer;

alter table public.shopping_items
  add column sort_order integer;

-- updated_at продукта — «когда изменилась отметка»: по нему список покупок упорядочен
-- там, где его не переставляли. Меняют его только сам продукт и его отметки; место
-- в разделе, раздел и место в покупках — нет.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.name, new.icon, new.kind, new.is_available, new.to_buy)
     is distinct from (old.name, old.icon, old.kind, old.is_available, old.to_buy)
  then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- Продукт, который положили в покупки заново, встаёт в конец списка: прежнее место
-- ему не возвращается. Правило про наличие — прежнее (см. 0005).
create or replace function public.sync_to_buy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind = 'staple'
    and new.is_available is distinct from old.is_available
    and new.to_buy is not distinct from old.to_buy
  then
    new.to_buy := not new.is_available;
  end if;
  if new.to_buy is distinct from old.to_buy then
    new.shopping_order := null;
  end if;
  return new;
end;
$$;

-- Список покупок в новом порядке: идентификаторы продуктов и ручных позиций вперемешку,
-- сверху вниз. SECURITY INVOKER — действуют политики RLS вызывающего.
create function public.reorder_shopping(p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  with places as (
    select t.id, t.place from unnest(p_ids) with ordinality as t (id, place)
  ),
  placed_products as (
    update public.products p
    set shopping_order = places.place
    from places
    where p.id = places.id and p.shopping_order is distinct from places.place
    returning 1
  )
  update public.shopping_items i
  set sort_order = places.place
  from places
  where i.id = places.id and i.sort_order is distinct from places.place;
$$;

revoke all on function public.reorder_shopping(uuid[]) from public, anon;
grant execute on function public.reorder_shopping(uuid[]) to authenticated;
