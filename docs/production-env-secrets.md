# OpEx 5.0 Production Environment ve Secret Yonetimi

Bu dokuman Faz 3 kapsaminda production ortam degerlerini ve secret yonetim
yaklasimini standartlastirmak icin hazirlanmistir.

## 1. Hedef Prensipler

- Secret degerleri repoya yazilmaz.
- Tum production secret'lari merkezi bir secret manager'da tutulur.
- Erisim en az yetki prensibiyle verilir.
- Secret rotasyonu planli sekilde yapilir.

## 2. Dosya Referanslari

- Backend production template:
  - `/Users/Ozan/Documents/opex-5.0/backend/.env.production.example`
- Frontend production template:
  - `/Users/Ozan/Documents/opex-5.0/frontend/.env.production.example`

## 3. Secret Siniflandirmasi

### Kritik
- `JWT_SECRET`
- `DATABASE_URL` icindeki sifre
- `REDIS_PASSWORD`
- `SENDGRID_API_KEY`
- `AWS_SECRET_ACCESS_KEY`

### Konfig Degeri (secret olmayan)
- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `FRONTEND_URL`
- `FRONTEND_ALLOWED_ORIGINS`
- `TRUST_PROXY`
- `RATE_LIMIT_*`
- `NEXT_PUBLIC_*`

## 4. Onerilen Secret Manager Yaklasimi

Provider bagimsiz model:

1. Her ortam icin ayri namespace:
   - `opex/prod/*`
   - `opex/staging/*`
2. Deploy pipeline sadece gerekli key'leri inject eder.
3. Uygulama runtime'da plain text dosya yerine process env okur.

## 5. Rotasyon Politikasi

- `JWT_SECRET`: 90 gunde bir
- DB/Redis sifreleri: 90-180 gunde bir
- Ucuncu parti API key'leri: vendor policy + incident durumunda aninda

Rotasyon adimlari:
1. Yeni secret olustur.
2. Staging'de test et.
3. Production deploy et.
4. Eski secret'i iptal et.

## 6. Kontrol Listesi (Prod Oncesi)

- [ ] Tum placeholder degerler degistirildi
- [ ] `JWT_SECRET` guclu ve benzersiz
- [ ] Database/Redis dis erisim network policy ile sinirli
- [ ] Sadece gerekli ekip role'leri secret okuyabiliyor
- [ ] Incident durumunda secret revoke proseduru mevcut
