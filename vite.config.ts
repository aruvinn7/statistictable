/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon-192.png', 'icon-512.png'],
    manifest: {
      name: 'Statistictable — Referensi Statistik', short_name: 'Statistictable',
      description: 'Tabel statistik, nilai kritis, dan peluang dalam satu tempat.',
      start_url: '/', scope: '/', display: 'standalone', lang: 'id',
      theme_color: '#136207', background_color: '#fffdfd',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'], navigateFallback: '/index.html' },
  })],
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    testTimeout: 15000,
  },
})
