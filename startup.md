# Startup Guide (Local Development)

Bu dosya, projeyi daha sonra tekrar acarken adim adim ne yapman gerektigini anlatir.
Tum komutlari proje kok dizininde calistir:

```bash
cd /Users/Ozan/Documents/opex-5.0
```

## 1. Gereksinimler

Asagidaki araclar makinede kurulu olmali:

- Node.js (onerilen: 20+)
- npm
- Docker Desktop
- docker compose
- make

Kontrol:

```bash
node -v
npm -v
docker --version
docker compose version
make --version
```

## 2. Ilk Kurulum (tek seferlik)

Ilk kurulum icin tek komut:

```bash
make first-setup
```

Bu komut ne yapar:

1. Docker servislerini acar (`postgres`, `redis`, `minio`)
2. Backend ve frontend bagimliliklarini kurar (`npm ci`)
3. Veritabanini migration ile hazirlar
4. Seed verisi yukler (test kullanicilari)
5. Backend (`3001`) ve frontend (`3000`) dev serverlarini baslatir

## 3. Gunluk Kullanim (normal acilis)

Proje bir kez kurulduktan sonra genelde su yeterli:

```bash
make start
```

Durum kontrolu:

```bash
make status
```

Durdurma:

```bash
make stop
```

Yeniden baslatma:

```bash
make restart
```

## 4. Uygulama Adresleri

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:3001/api/v1/health`
- MinIO console: `http://localhost:9001`

## 5. Test Kullanici Bilgileri (seed sonrasi)

- Admin: `ADMIN001 / Admin123`
- User: `USER001 / Test1234`
- Committee Manager: `KOMITE001 / Komite1234`
- Approver: `MUDUR001 / Onay1234`

Not: Ilk giriste sifre degistirme akisi olabilir.

## 6. Veritabani Isleri

Sadece seed tekrar calistir:

```bash
make seed
```

Veritabanini sifirla (dikkat: tum veri silinir):

```bash
make db-reset
make seed
```

## 7. Test Komutlari

Tum testler:

```bash
make test
```

Sadece backend:

```bash
make backend-test
```

Sadece frontend:

```bash
make frontend-test
```

CI benzeri E2E smoke (DB reset + seed yapar):

```bash
make e2e-smoke
```

## 8. Docker Servis Yonetimi

Sadece altyapiyi ac:

```bash
make infra-up
```

Sadece altyapiyi kapat:

```bash
make infra-down
```

Altyapi loglari:

```bash
make infra-logs
```

## 9. Log Dosyalari

Script ile baslatildiginda loglar burada tutulur:

- `/Users/Ozan/Documents/opex-5.0/.logs/backend.log`
- `/Users/Ozan/Documents/opex-5.0/.logs/frontend.log`

Canli takip:

```bash
tail -f .logs/backend.log .logs/frontend.log
```

## 10. Sik Problemler ve Cozumler

### Problem: `Port 3000 already in use` veya `Port 3001 already in use`

Sebep: Portu baska bir process kullaniyor.

Cozum:

```bash
lsof -i :3000
lsof -i :3001
```

Gerekiyorsa ilgili processi kapat veya `make stop` ile bu projeye ait processleri durdur.

### Problem: `docker: command not found` veya docker servisleri acilmiyor

Cozum:

1. Docker Desktop acik oldugundan emin ol.
2. `docker compose ps` ile durum kontrol et.

### Problem: `prisma migrate` hatasi

Genelde local DB state bozulmustur. Guvenli fix:

```bash
make db-reset
make seed
```

### Problem: Frontend aciliyor ama API hatasi var

Kontrol:

1. Backend health: `http://localhost:3001/api/v1/health`
2. `backend/.env` icinde `DATABASE_URL` ve `REDIS_*` degerleri dogru mu?
3. Docker servisleri ayakta mi? (`docker compose ps`)

## 11. Kod Cektikten Sonra (git pull sonrasi) Onerilen Rutin

```bash
git pull
make bootstrap
make start
```

Eger migration eklendiyse:

```bash
make start
```

`make start` zaten migration deploy calistirir.

## 12. Temizlik

Sadece script PID/log klasorlerini temizler:

```bash
make clean
```

Not: Bu komut kodu veya veritabani verisini silmez.

## 13. Branch Protection (GitHub)

Plan geregi `main` branch icin PR + CI zorunlu olmasi onerilir.

Script dry-run (sadece payload gosterir):

```bash
bash scripts/setup-branch-protection.sh
```

Gercek uygulama (GitHub token gerekir):

```bash
GITHUB_TOKEN=senin_tokenin make branch-protect
```

Not:
- Token, repo uzerinde branch protection degistirebilecek yetkiye sahip olmali.
- Script su kontrolleri zorunlu yapiya ayarlar:
  - `Backend Build and Test`
  - `Frontend Build and Test`
  - `E2E Smoke (Chromium)`
