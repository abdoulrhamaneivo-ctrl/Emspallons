import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks pour optimiser le chargement
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-hot-toast'],
          'chart-vendor': ['recharts', 'react-countup'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          'qr-vendor': ['html5-qrcode', 'qrcode', 'qrcode.react'],
          'excel-vendor': ['xlsx'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
        // Améliorer la génération de noms de chunks pour éviter les conflits
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000, // Augmenter la limite pour éviter trop d'avertissements
    // Améliorer le traitement des erreurs de build
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'EMSP Transport Management',
        short_name: 'EMSP Allons',
        description: 'Plateforme de gestion de transport scolaire EMSP',
        theme_color: '#FDB913',
        background_color: '#2D5016',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/images/logo-transport.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/images/logo-transport.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24h
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
})

