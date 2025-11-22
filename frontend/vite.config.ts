import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './src/app'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/widgets': path.resolve(__dirname, './src/widgets'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    host: '0.0.0.0', // Necesario para Docker
    port: 3000,
    strictPort: true, // Falla si el puerto está ocupado
    proxy: {
      '/api': {
        target: 'http://backend:8000', // Usar nombre del servicio en Docker network
        changeOrigin: true,
      },
    },
  },
})
