# FASE 0 — Project Setup & Struktur Folder Kosong

## Konteks Project
Kamu sedang membangun frontend web untuk aplikasi **POS System** dari nol.
Folder tujuan: `web-v2/` di dalam root project `Project_POS/`.
Jangan ubah folder lain di luar `web-v2/`.

## Stack yang Digunakan
- React 18 + Vite + TypeScript
- Tailwind CSS v3
- shadcn/ui
- Zustand (state management)
- TanStack Query v5 (server state)
- Axios (HTTP client)
- React Router v6
- React Hook Form + Zod (form & validasi)
- Sonner (toast notification)
- Recharts (grafik)
- Lucide React (icons)
- Husky + lint-staged (pre-commit hook)

## Tugas Fase Ini

### 1. Inisialisasi Project Vite
Jalankan dari dalam folder `Project_POS/`:
```bash
npm create vite@latest web-v2 -- --template react-ts
cd web-v2
```

### 2. Install Semua Dependencies
```bash
# Core
npm install react-router-dom @tanstack/react-query axios zustand

# Form & Validasi
npm install react-hook-form zod @hookform/resolvers

# UI
npm install sonner recharts lucide-react

# Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui setup
npm install -D @types/node
npx shadcn@latest init

# Code Quality
npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-import
npm install -D prettier
npm install -D husky lint-staged
npx husky init
```

### 3. Konfigurasi `vite.config.ts`
```ts
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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          form: ['react-hook-form', 'zod', '@hookform/resolvers'],
          charts: ['recharts'],
        },
      },
    },
  },
})
```

### 4. Konfigurasi `tsconfig.app.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

### 5. Konfigurasi `tailwind.config.ts`
Setup Tailwind dengan custom color tokens yang sesuai design POS:
```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c3e50',
          foreground: '#ffffff',
        },
        sidebar: {
          DEFAULT: '#2c3e50',
          foreground: '#ffffff',
          muted: '#bdc3c7',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

### 6. Konfigurasi `.prettierrc`
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 7. Konfigurasi `eslint.config.ts`
Setup ESLint dengan rules: no-explicit-any (error), no-console (warn), import/order (error), react-hooks rules.

### 8. Konfigurasi `.env.development` dan `.env.production`
```bash
# .env.development
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=POS System
VITE_PLATFORM=web

# .env.production
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=POS System
VITE_PLATFORM=web
```

### 9. Setup Husky + lint-staged di `package.json`
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

### 10. Buat Struktur Folder Kosong
Buat semua folder berikut dengan file `.gitkeep` di dalamnya:
```
src/
├── app/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   └── hooks/
│   ├── sales/
│   │   ├── cashier/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── transactions/
│   │       └── components/
│   ├── inventory/
│   │   ├── products/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── suppliers/
│   │       └── components/
│   ├── finance/
│   │   ├── overview/
│   │   │   └── components/
│   │   └── receivables/
│   │       └── components/
│   ├── customers/
│   │   └── components/
│   ├── reporting/
│   │   ├── dashboard/
│   │   │   └── components/
│   │   └── reports/
│   │       └── components/
│   ├── shifts/
│   │   └── components/
│   ├── settings/
│   │   └── components/
│   └── sync/
│       ├── components/
│       └── hooks/
├── shared/
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── constants/
├── services/
└── styles/
```

### 11. Bersihkan File Bawaan Vite
Hapus file boilerplate dari Vite:
- Hapus isi `src/App.tsx` (biarkan kosong/placeholder)
- Hapus `src/App.css`
- Hapus `src/assets/react.svg`
- Kosongkan `src/index.css` (akan diisi di FASE 2)

## Hasil yang Diharapkan
- `npm run dev` → server berjalan di port 3000 tanpa error
- `npm run build` → build berhasil tanpa error TypeScript
- Struktur folder sudah siap untuk fase-fase berikutnya
- Semua dependencies terinstall
