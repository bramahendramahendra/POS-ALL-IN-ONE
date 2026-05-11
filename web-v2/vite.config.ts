import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('node_modules/react/')) return 'vendor'
          if (id.includes('@tanstack/react-query')) return 'query'
          if (id.includes('@radix-ui')) return 'ui'
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'form'
          if (id.includes('recharts')) return 'charts'
        },
      },
    },
  },
})
