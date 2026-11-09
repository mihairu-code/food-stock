/** Ключи кэша. Всё, что относится к дому, начинается с ['hh', id] — так его можно перечитать разом. */
export const qk = {
  user: ['user'] as const,
  memberships: ['memberships'] as const,
  home: (hid: string) => ['hh', hid] as const,
  sections: (hid: string) => ['hh', hid, 'sections'] as const,
  products: (hid: string) => ['hh', hid, 'products'] as const,
  shoppingItems: (hid: string) => ['hh', hid, 'shopping-items'] as const,
  members: (hid: string) => ['hh', hid, 'members'] as const,
  invites: (hid: string) => ['hh', hid, 'invites'] as const,
}
