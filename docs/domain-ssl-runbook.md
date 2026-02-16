# OpEx 5.0 Domain + SSL Runbook

Bu dokuman production domain ve SSL adimini standartlastirir.

## 1. Hedef Domain Modeli

- Frontend/App: `app.example.com`
- API: `api.example.com`

## 2. DNS Kayitlari

Her iki domain icin de sunucu IP'sine A kaydi (veya altyapiya gore CNAME) tanimla.

Ornek:
- `app.example.com -> <server-ip>`
- `api.example.com -> <server-ip>`

## 3. Nginx Konfig Uretimi

Repo icindeki template ile production config uret:

```bash
cd /Users/Ozan/Documents/opex-5.0
make render-nginx-config APP_DOMAIN=app.example.com API_DOMAIN=api.example.com
```

Uretilen dosya:
- `/Users/Ozan/Documents/opex-5.0/ops/nginx/opex.conf`

## 4. SSL Sertifikasi (Let's Encrypt)

Sunucuda certbot ile sertifika al:

```bash
sudo certbot certonly --nginx -d app.example.com -d api.example.com
```

Template su pathleri kullanir:
- `/etc/letsencrypt/live/<domain>/fullchain.pem`
- `/etc/letsencrypt/live/<domain>/privkey.pem`

## 5. Nginx Deploy

1. Uretilen `ops/nginx/opex.conf` dosyasini sunucuya kopyala.
2. Nginx site config olarak aktif et.
3. Konfig test ve reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Preflight Kontrol

DNS ve HTTPS erisimi kontrol et:

```bash
cd /Users/Ozan/Documents/opex-5.0
make domain-ssl-preflight APP_DOMAIN=app.example.com API_DOMAIN=api.example.com
```

Sadece DNS kontrolu (sertifika henuz yoksa):

```bash
make domain-ssl-preflight APP_DOMAIN=app.example.com API_DOMAIN=api.example.com SKIP_HTTPS=true
```

## 7. Backend/Frontend Env Uyumu

Backend:
- `FRONTEND_URL=https://app.example.com`
- `FRONTEND_ALLOWED_ORIGINS=https://app.example.com`
- `TRUST_PROXY=1`

Frontend:
- `NEXT_PUBLIC_APP_URL=https://app.example.com`
- `NEXT_PUBLIC_API_URL=https://api.example.com/api/v1`

## 8. Son Kontrol Listesi

- [ ] DNS kayitlari dogru cozuluyor
- [ ] SSL sertifika dosyalari mevcut
- [ ] Nginx `-t` geciyor
- [ ] `https://app.example.com` aciliyor
- [ ] `https://api.example.com/api/v1/health` 200 donuyor
