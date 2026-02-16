# OpEx 5.0 Deployment Runbook (Staging/Production)

Bu runbook, staging veya production ortamina kontrollu cikis adimlarini tarif eder.

## 1. On Kosullar

- `main` branch korumasi aktif olmali.
- Son merge icin zorunlu checkler yesil olmali:
  - `Backend Build and Test`
  - `Frontend Build and Test`
  - `E2E Smoke (Chromium)`
- Release adayi etiketi hazir olmali (ornek: `v1.0.0-rc.1`).

## 2. Release Oncesi Lokal Dogrulama

```bash
cd /Users/Ozan/Documents/opex-5.0
make release-check
```

Beklenen sonuc: tum build/test/smoke adimlari yesil.

## 3. Versiyon ve Tag

```bash
cd /Users/Ozan/Documents/opex-5.0
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

Not: RC surecinde final surum yerine `v1.0.0-rc.x` kullan.

## 4. Environment Hazirligi

Asagidaki degiskenler ortamda tanimli olmali:

- Template referanslari:
  - `backend/.env.production.example`
  - `frontend/.env.production.example`

- Backend:
  - `NODE_ENV=production`
  - `PORT`
  - `API_PREFIX`
  - `DATABASE_URL`
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
  - `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
  - `FRONTEND_URL`
  - `EMAIL_PROVIDER`, `SENDGRID_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
  - `UPLOAD_PROVIDER`, `UPLOAD_DIR` (veya S3/MinIO ayarlari)
- Frontend:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_APP_URL`

Istersen AWS Secrets Manager'dan env dosyalarini otomatik uretebilirsin:

```bash
cd /Users/Ozan/Documents/opex-5.0
make secrets-aws-backend SECRET_ID=opex/prod/backend REGION=eu-west-1
make secrets-aws-frontend SECRET_ID=opex/prod/frontend REGION=eu-west-1
make validate-prod-env
```

Domain + SSL adimlari icin:
- `docs/domain-ssl-runbook.md`

Monitoring/alarm adimlari icin:
- `docs/monitoring-alert-plan.md`

## 5. Deployment Sirasinda Uygulanacak Adimlar

1. Yeni release tag'ine ait image/artefact olustur.
2. Domain + SSL config'ini hazirla ve sunucuda aktif et.
3. Uygulamayi staging ortaminda ayağa kaldir.
4. Staging smoke kontrol:
   - Backend health: `/api/v1/health`
   - Swagger: `/api-docs`
   - Frontend login akisi
5. Monitoring stack'te probe ve alarm kurallarini dogrula.
6. Staging dogrulandiysa production rollout yap.
7. Production sonrasi 15-30 dk hizli kontrol (smoke + log izleme).

## 6. Smoke Kontrol Listesi (Canli Sonrasi)

- `GET /api/v1/health` 200 donuyor.
- Frontend aciliyor (`/login` sayfasi).
- Test kullanicisi ile login/logout calisiyor.
- Oneri listeleme endpointi 200 donuyor.
- Report export endpointleri dosya indiriyor:
  - `GET /api/v1/reports/export/excel`
  - `GET /api/v1/reports/export/pdf`

## 7. Incident Durumunda

- Hata buyukse rollout durdur.
- Rollback icin:
  - `docs/rollback-runbook.md`
- Veri geri donus ihtiyaci varsa:
  - `docs/backup-restore.md`
