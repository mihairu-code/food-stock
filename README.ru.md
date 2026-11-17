# food-stock

Общий список продуктов дома и покупок — PWA для телефона. На русском, английском,
японском и вьетнамском. [In English](README.md)

У продукта две независимые отметки: есть ли он дома (точка на иконке) и лежит ли
в покупках (кнопка «+ / −»). *Постоянный* продукт, закончившись, сам попадает в покупки
и после покупки возвращается в свой раздел.
Разделы свои — «Холодильник», «Шкаф», «Вкусняшки». Несколько человек ведут один дом
и сразу видят изменения друг друга.

Стек: React 19 + TypeScript + Vite, React Router, TanStack Query, Supabase
(Postgres + Auth + Realtime), dnd-kit, `vite-plugin-pwa`.

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
3. Authentication → Sign In / Providers → включите **Allow anonymous sign-ins**.
4. Скопируйте `.env.example` в `.env.local` и заполните `VITE_SUPABASE_URL`
   и `VITE_SUPABASE_ANON_KEY` (только публичный ключ, не service-role).

Почта не нужна: регистрации нет. Пользователь и дом создаются при первом запуске,
остальных зовут одноразовой ссылкой.

### Вход через Google (необязательно)

Пока провайдер Google в Supabase выключен, приложение ведёт себя так, будто его нет.

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services →
   OAuth consent screen**: External, название и почта поддержки, затем **Publish app**.
2. **Credentials → Create credentials → OAuth client ID**, Web application. Authorized
   redirect URI: `https://<проект>.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Sign In / Providers → **Google**: включить, вставить
   Client ID и secret.
4. Supabase → Authentication → URL Configuration: **Site URL** — адрес приложения;
   в **Redirect URLs** добавьте `http://localhost:5173/**` для разработки.

Как устроено слияние с анонимным пользователем устройства — в
[решении 0005](docs/ru/decisions/0005-google-account-merge.md).

## Обновления

Выкладка заменяет только файлы приложения, данные остаются в Supabase. Какое-то время
старая и новая версии работают с одной базой, поэтому миграции только добавляют,
а ленивой подгрузки нет. Правила — в [решении 0004](docs/ru/decisions/0004-safe-updates.md).

## Как устроено

```
src/
  app/        запуск, маршруты, провайдеры (вход, слияние, выбор дома), каркас, SheetHost
  pages/      дом, покупки, настройки, разделы, приветствие (с установкой), выбор при слиянии
  widgets/    шапка, вкладки
  features/   формы в шторках: продукт, позиция покупок, покупка, раздел, дом, имя,
              вступление, приглашение; действия с аккаунтом
  entities/   продукт, раздел, ручная покупка, список покупок, участник, приглашение, дом:
              запросы и мутации, правила, мелкие элементы
  shared/     api (контракт хранилища, локальное и Supabase, кэш), i18n,
              lib (мелкие самостоятельные модули), ui (общие элементы, шторки)
supabase/
  migrations/ схема, политики RLS, RPC
  tests/      миграции и RLS на PGlite
```

Слои — по Feature-Sliced Design: слой импортирует только нижние, слайсы одного слоя друг
друга не знают, снаружи в слайс заходят только через его `index.ts`
([решение 0011](docs/ru/decisions/0011-feature-sliced-design.md)). Это проверяет тест.

Подробнее — в [docs/ru](docs/ru): [описание продукта](docs/ru/product-brief.md),
[решения](docs/ru/decisions), [версии](docs/ru/releases),
[дневник разработки](docs/ru/diary.md) и [заметки про iPhone](docs/ru/ios-notes.md) —
что Safari и приложение с экрана «Домой» делают со шторками и клавиатурой. Как вносить
изменения — в [CONTRIBUTING](CONTRIBUTING.ru.md).

## Лицензия

[MIT](LICENSE)
