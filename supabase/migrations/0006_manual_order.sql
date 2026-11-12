-- Порядок вручную: продукты и разделы можно перетаскивать.
--
-- Миграция только добавляет: уже выложенные версии приложения продолжают работать.
-- Они не знают про sort_order у продуктов и не присылают его — такой продукт встаёт
-- в конец своего раздела по времени добавления, как и раньше.

-- Место продукта в разделе. null — продукты раздела ещё не переставляли (или продукт
-- добавлен после перестановки): он стоит после переставленных, по created_at.
alter table public.products
  add column sort_order integer;

-- updated_at продукта — это «когда изменилась отметка»: по нему упорядочен список покупок.
-- Перестановка и перенос в другой раздел его не трогают, иначе перетаскивание на главном
-- экране перемешивало бы покупки.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.name, new.icon, new.kind, new.is_available, new.to_buy)
     is not distinct from (old.name, old.icon, old.kind, old.is_available, old.to_buy)
     and (new.section_id, new.sort_order) is distinct from (old.section_id, old.sort_order)
  then
    return new;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Продукты раздела в новом порядке, сверху вниз. Продукт из другого раздела,
-- оказавшийся в списке, переносится в этот раздел. SECURITY INVOKER — действуют
-- политики RLS вызывающего; раздел из чужого дома отсечёт составной внешний ключ.
create function public.reorder_products(p_section_id uuid, p_product_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.products p
  set section_id = p_section_id,
      sort_order = t.place
  from unnest(p_product_ids) with ordinality as t (id, place)
  where p.id = t.id
    and (p.section_id is distinct from p_section_id or p.sort_order is distinct from t.place);
$$;

-- Разделы дома в новом порядке, сверху вниз.
create function public.reorder_sections(p_section_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.sections s
  set sort_order = t.place
  from unnest(p_section_ids) with ordinality as t (id, place)
  where s.id = t.id
    and s.sort_order is distinct from t.place;
$$;

revoke all on function public.reorder_products(uuid, uuid[]) from public, anon;
revoke all on function public.reorder_sections(uuid[]) from public, anon;
grant execute on function public.reorder_products(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_sections(uuid[]) to authenticated;
