import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
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
        // Кешируется только оболочка приложения. Ответы сервера в кеш не попадают,
        // поэтому приватные данные не переживают смену пользователя.
        navigateFallback: 'index.html',
      },
    }),
  ],
})
