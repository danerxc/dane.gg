import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => {
  const baseConfig = {
    plugins: [react()],
    base: '/admin',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
  // Development config
  if (command === 'serve') {
    return {
      ...baseConfig,
      server: {
        port: 3001,
        strictPort: true,
        host: '0.0.0.0',
        watch: {
          usePolling: true
        },
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true
          },
          '/auth': {
            target: 'http://localhost:3000',
            changeOrigin: true
          },
          '/assets': {
            target: 'http://localhost:3000',
            changeOrigin: true
          }
        }
      }
    }
  }

  return baseConfig
})