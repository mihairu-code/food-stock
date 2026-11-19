import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'
import { APP_ICONS, appIconFiles, DEFAULT_APP_ICON, type AppIcon } from './src/shared/lib/appIcons.ts'

/**
 * Соединение с сервером данных открывается, пока браузер ещё скачивает и разбирает
 * скрипт: первый запрос не тратит время на DNS и TLS.
 */
function preconnect(url: string | undefined): Plugin {
  return {
    name: 'preconnect-backend',
    transformIndexHtml: () =>
      url
        ? [{ tag: 'link', attrs: { rel: 'preconnect', href: new URL(url).origin, crossorigin: true }, injectTo: 'head-prepend' }]
        : [],
  }
}

/**
 * Манифест с выбранной иконкой. У всех вариантов один id: для телефона это одно и то же
 * приложение, и Android при следующей проверке манифеста может сменить иконку сам.
 */
function manifestWithIcon(icon: AppIcon): Partial<ManifestOptions> {
  const files = appIconFiles(icon)
  return {
    id: '/',
    name: 'Домашние запасы',
    short_name: 'Запасы',
    description: 'Общий список продуктов дома и покупок',
    lang: 'ru',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f6f2',
    theme_color: '#f7f6f2',
    icons: [
      { src: files.small, sizes: '192x192', type: 'image/png' },
      { src: files.large, sizes: '512x512', type: 'image/png' },
      { src: files.maskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

/** Манифесты остальных иконок; основной собирает vite-plugin-pwa. */
function iconManifests(): Plugin {
  return {
    name: 'app-icon-manifests',
    apply: 'build',
    generateBundle() {
      for (const icon of APP_ICONS) {
        if (icon === DEFAULT_APP_ICON) continue
        this.emitFile({
          type: 'asset',
          fileName: appIconFiles(icon).manifest,
          source: JSON.stringify(manifestWithIcon(icon)),
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      rolldownOptions: {
        output: {
          // Библиотеки меняются редко и лежат отдельным файлом: после выкладки новой
          // версии телефон перекачивает только код приложения. Все файлы подключены
          // в index.html сразу — это не ленивая подгрузка (см. README, «Обновления»).
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules\/(react|react-dom|react-router|scheduler)\//, priority: 2 },
              { name: 'supabase', test: /node_modules\/(@supabase|iceberg-js)\//, priority: 2 },
              { name: 'vendor', test: /node_modules/, priority: 1 },
            ],
          },
        },
      },
    },
    plugins: [
      react(),
      preconnect(env.VITE_SUPABASE_URL),
      iconManifests(),
      VitePWA({
        registerType: 'autoUpdate',
        // SVG иконок нужны плиткам в настройках и без сети; PNG — только при установке.
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.svg'],
        manifest: manifestWithIcon(DEFAULT_APP_ICON),
        workbox: {
          // Кешируется только оболочка приложения. Ответы Supabase в кеш не попадают,
          // поэтому приватные данные не переживают смену пользователя.
          navigateFallback: 'index.html',
        },
      }),
    ],
  }
})
