# food-stock

Общий список продуктов дома и покупок — PWA для телефона. [In English](README.md)

У каждого продукта есть отметка: есть он дома или закончился. *Постоянный* продукт,
закончившись, сам попадает в покупки и после покупки возвращается в свой раздел.
Разделы свои — «Холодильник», «Шкаф», «Вкусняшки». Несколько человек ведут один дом
и сразу видят изменения друг друга.

Стек: React 19 + TypeScript + Vite, React Router, TanStack Query, Supabase
(Postgres + Auth + Realtime), `vite-plugin-pwa`.

## Запуск

```bash
npm install
npm run dev
```

Без настроек приложение стартует в **демо-режиме**: данные лежат в `localStorage`
браузера, вкладки одного браузера синхронизируются между собой. Этого достаточно, чтобы
пройти все сценарии.

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер |
| `npm test` | тесты: критерии приёмки MVP на локальном хранилище, миграции и RLS на встроенном Postgres |
| `npm run build` | проверка типов и сборка в `dist/` (с манифестом и service worker) |
| `npm run preview` | локальный просмотр сборки — здесь же проверяется установка PWA |
| `npm run lint` | oxlint |

## Подключение Supabase

1. Создайте проект на supabase.com.
2. Примените миграции из `supabase/migrations/` по порядку — в SQL Editor или через
   `supabase db push`.
3. Authentication → Email: добавьте код в шаблоны писем (*Magic link* и
   *Confirm signup*), например `<p>Ваш код: <strong>{{ .Token }}</strong></p>`.
4. Скопируйте `.env.example` в `.env.local` и заполните `VITE_SUPABASE_URL`
   и `VITE_SUPABASE_ANON_KEY` (только публичный ключ, не service-role).

Встроенная почта Supabase доставляет письма только участникам вашей организации
в Supabase и с небольшим лимитом в час. Для настоящих пользователей нужен свой SMTP.

## Как устроено

```
src/
  domain/     типы и чистая логика (список покупок, переходы состояния)
  data/       граница с хранилищем: интерфейс Backend и две реализации
  app/        кто вошёл, какой дом открыт
  screens/    Дом, Покупки, Настройки
  sheets/     нижние шторки с формами
  components/ мелкие общие элементы
supabase/
  migrations/ схема, политики RLS, RPC
  tests/      миграции и RLS на PGlite
```

Подробнее — в [docs/ru](docs/ru): [описание продукта](docs/ru/product-brief.md),
[решения](docs/ru/decisions), [версии](docs/ru/releases) и
[дневник разработки](docs/ru/diary.md).

## Лицензия

[MIT](LICENSE)
