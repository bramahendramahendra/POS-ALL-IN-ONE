# FASE 35 — Production Ready: Final Config & Deployment Prep

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 34 sudah selesai: semua skenario integration test berhasil.
Fase terakhir — mempersiapkan aplikasi untuk production deployment.

## Tugas Fase Ini

### 1. Update `.env.production`
```bash
VITE_API_URL=https://api.domain-anda.com/api
VITE_APP_NAME=POS System
VITE_PLATFORM=web
```
Ganti `api.domain-anda.com` dengan domain backend production yang sebenarnya.

### 2. Buat `nginx.conf` untuk web-v2
File konfigurasi Nginx untuk serve React SPA:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/pos-web/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — semua route dikembalikan ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API ke backend
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Penting: `try_files $uri $uri/ /index.html`**
Ini wajib ada agar React Router bisa handle refresh di semua route.
Tanpa ini, refresh di `/dashboard` akan dapat 404 dari Nginx.

### 3. Buat Script Build & Deploy di `package.json`
```json
{
  "scripts": {
    "dev":     "vite",
    "build":   "tsc -b && vite build",
    "preview": "vite preview",
    "lint":    "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format":  "prettier --write src/",
    "type-check": "tsc --noEmit"
  }
}
```

### 4. Buat `public/robots.txt`
```
User-agent: *
Disallow: /
```
POS System tidak perlu diindex mesin pencari.

### 5. Update `index.html`
```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="POS System — Sistem Kasir" />
    <meta name="robots" content="noindex, nofollow" />
    <title>POS System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

### 6. Final Build Test
```bash
npm run type-check   # 0 errors
npm run lint         # 0 errors
npm run build        # build sukses

# Test preview production build
npm run preview
# Buka http://localhost:4173
# Cek semua halaman bisa diakses
# Cek refresh di /dashboard tidak 404 (di preview mode sudah handle ini)
```

### 7. Review Ukuran Bundle
Setelah `npm run build`, lihat output size:
```
dist/assets/vendor-[hash].js      ~150KB (React, Router)
dist/assets/query-[hash].js       ~50KB  (TanStack Query)
dist/assets/ui-[hash].js          ~80KB  (Radix UI)
dist/assets/form-[hash].js        ~40KB  (RHF + Zod)
dist/assets/charts-[hash].js      ~150KB (Recharts)
dist/assets/index-[hash].js       ~?KB   (app code)
```

Jika `index.js` > 500KB, pertimbangkan tambahan lazy loading.
Jika ada bundle > 1MB, investigasi dan split lebih lanjut.

### 8. Buat `DEPLOYMENT.md` di folder `web-v2/`
Dokumentasi cara deploy:
```markdown
# Deployment Guide — web-v2

## Prerequisites
- Node.js 18+
- Nginx

## Build
npm install
npm run build
# Output: dist/

## Deploy
cp -r dist/ /var/www/pos-web/
# Copy nginx.conf ke /etc/nginx/sites-available/pos-web
# Enable site dan reload nginx

## Environment
Pastikan .env.production sudah diisi dengan URL backend production.
```

## Checklist Production Ready

- [ ] `.env.production` sudah diisi dengan URL yang benar
- [ ] `nginx.conf` sudah ada dengan SPA fallback
- [ ] `npm run build` sukses tanpa error
- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] Preview build bisa diakses di localhost:4173
- [ ] Refresh di semua route tidak 404
- [ ] Bundle size wajar (tidak ada bundle > 1MB)
- [ ] `robots.txt` ada (noindex)
- [ ] `DEPLOYMENT.md` tersedia

## Hasil yang Diharapkan
Setelah fase ini selesai:
- Folder `web-v2/dist/` siap di-copy ke server
- Nginx config siap di-deploy
- Dokumentasi deployment tersedia
- **Seluruh 36 fase (FASE 0–35) telah selesai**
- Frontend POS System siap production 🎉
