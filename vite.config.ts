import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Домашние запасы',
          short_name: 'Запасы',
          description: 'Общий список продуктов дома и покупок',
          lang: 'ru',
          start_url: '/',
          display: 'standalone',
          background_color: '#f7f6f2',
          theme_color: '#f7f6f2',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Кешируется только оболочка приложения. Ответы Supabase в кеш не попадают,
          // поэтому приватные данные не переживают смену пользователя.
          navigateFallback: 'index.html',
        },
      }),
    ],
  }
})
