-- Наличие дома и список покупок — разные вещи.
--
-- Раньше список покупок вычислялся: «постоянный продукт закончился» = «его надо купить».
-- Теперь у продукта есть отдельная отметка to_buy: продукт может быть дома и при этом
-- лежать в покупках (хочется докупить), а закончившийся — не лежать (покупать не будем).
--
-- Миграция только добавляет и ослабляет ограничения: уже выложенные версии приложения
-- продолжают работать.

alter table public.products
  add column to_buy boolean not null default false;

-- Всё, что было в покупках до миграции, в них и остаётся.
update public.products set to_buy = true where kind = 'staple' and not is_available;

-- Разовый продукт теперь тоже может закончиться: он остаётся в разделе отмеченным
-- «нет дома», пока его не удалят или не купят снова.
alter table public.products drop constraint one_off_is_always_available;

-- Правило по умолчанию, когда наличие меняют, не трогая to_buy: закончившийся постоянный
-- продукт сам попадает в покупки, а появившийся дома — уходит из них. Новое приложение
-- присылает оба поля сразу; прежние версии знают только is_available, и для них
-- это правило сохраняет привычное поведение.
create function public.sync_to_buy()
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
  return new;
end;
$$;

revoke all on function public.sync_to_buy() from public, anon, authenticated;

create trigger products_sync_to_buy
  before update on public.products
  for each row execute function public.sync_to_buy();
