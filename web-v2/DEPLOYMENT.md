# Deployment Guide — web-v2

## Prerequisites
- Node.js 18+
- Nginx

## Environment Setup
Salin `.env.production` dan isi dengan URL backend production:
```
VITE_API_URL=https://api.your-domain.com/api
VITE_APP_NAME=POS System
VITE_PLATFORM=web
```

## Build
```bash
npm install
npm run type-check   # pastikan 0 TypeScript errors
npm run lint         # pastikan 0 ESLint errors
npm run build        # output ke dist/
```

## Deploy
```bash
# Copy hasil build ke server
cp -r dist/ /var/www/pos-web/

# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/pos-web
ln -s /etc/nginx/sites-available/pos-web /etc/nginx/sites-enabled/pos-web

# Test dan reload nginx
nginx -t
systemctl reload nginx
```

## Scripts
| Command | Keterangan |
|---------|------------|
| `npm run dev` | Development server (localhost:5173) |
| `npm run build` | Production build ke dist/ |
| `npm run preview` | Preview production build (localhost:4173) |
| `npm run lint` | Cek ESLint errors |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Format dengan Prettier |
| `npm run type-check` | TypeScript check tanpa emit |

## Checklist Pre-Deploy
- [ ] `.env.production` sudah diisi URL backend production
- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → sukses
- [ ] Test preview: `npm run preview` → buka http://localhost:4173
- [ ] Refresh di `/dashboard` tidak 404

## Notes
- Semua route React Router memerlukan SPA fallback di Nginx (`try_files $uri $uri/ /index.html`)
- Static assets di-cache 1 tahun (aman karena Vite menggunakan content hash)
- API di-proxy melalui Nginx ke backend di port 8080
