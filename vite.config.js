import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // ← Вот это самое важное — проксирование /api на бэкенд
  server: {
    proxy: {
      // Все запросы, начинающиеся с /api, перенаправляются на http://localhost:8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, '/api') // обычно не нужно
      },
    },
  },

  // Опционально: решает проблему с global is not defined (если она есть)
  define: {
    global: 'window',
    'globalThis': 'window',
  },

  // Опционально: если используешь алиасы
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});