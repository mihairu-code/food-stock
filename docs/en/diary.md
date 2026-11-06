# Dev diary

Written for myself, as I go. What I did, what didn't work, why I went this way and not
that one.

---

## Nov 6, Fri

Starting. The idea has been around for a while: the eternal "do we have eggs?" call from
the store. We tried a shared note — a week later one person maintains it and nobody
else opens it. Tried a couple of shopping list apps — they're all about the list, not
about what's actually at home. And I need the second thing: open it, look at the
"Fridge" shelf, see what ran out.

Things to write down now, before I forget why:

- **Custom sections.** At first I wanted store-style categories, "Dairy / Veggies /
  Grains". But nobody thinks like that at home. People think "what's in the fridge",
  "what's in the cupboard over the stove", "the snacks we hide from ourselves". Let
  users make their own.
- **Two marks, not one.** "At home" and "need to buy" are different. There's still
  milk, but it'll be gone tomorrow — I want to add it to shopping without pretending
  it's out. So for a staple "out" puts it on the list automatically, but you should be
  able to add something that's still there too. That part won't fully make it into the
  MVP — I'll do the automatic half first and see.
- **Staple vs one-off.** A staple is what should always be there (milk, bread, coffee).
  A one-off was bought once (a cake, some spice for one recipe). When a one-off is
  gone we just remove it, it doesn't go to shopping.

Drew the screens on paper, then ran them through an AI tool to get proper mockups in
one style. The style is "paper": warm background, thin lines, serif headings. I don't
want yet another material design.

Picked the stack in half an hour, wrote it down in
[0001](decisions/0001-pwa-not-native.md) and [0002](decisions/0002-supabase-backend.md).
Short version: a PWA, because I'm a frontend dev and I don't need app stores; Supabase,
because my own Go backend is another week or two before the first screen. A pity about
Go, I wanted the practice. Later.

Plan: everything on local storage first, screens and logic. Supabase after that.
