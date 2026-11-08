-- Supabase по умолчанию выдаёт роли authenticated все права на новые таблицы public,
-- поэтому точечные grant из 0001 ничего не сужали: лишние операции отсекал только RLS.
-- Здесь права сначала отзываются целиком, затем выдаются только нужные —
-- второй слой защиты под политиками RLS.

revoke all on public.households, public.household_members, public.household_invites,
  public.sections, public.products, public.shopping_items from anon, authenticated;

grant select, update on public.households to authenticated;
grant select, delete on public.household_members to authenticated;
grant select, insert, delete on public.household_invites to authenticated;
grant select, insert, update, delete on public.sections, public.products, public.shopping_items
  to authenticated;
