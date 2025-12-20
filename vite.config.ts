import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon.svg',
      ],
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Tra cứu lịch học',
        short_name: 'Lịch học',
        description: 'Tra cứu lịch học theo mã sinh viên',
        theme_color: '#0ea5e9',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          calendar: ['react-big-calendar', 'date-fns'],
          lucide: ['lucide-react'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-hot-toast'],
        }
      }
    }
  }
});
