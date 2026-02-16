# OpEx 5.0 Backup / Restore Runbook

Bu dokuman PostgreSQL odakli backup/restore operasyonunu tanimlar.

## 1. Backup Politika Onerisi

- Gunluk tam backup (gece saatlerinde)
- Kritik release oncesi manuel backup
- Saklama suresi: en az 7-14 gun

## 2. Manuel Backup (PostgreSQL)

Asagidaki komut, calisan PostgreSQL container'i icinden dump alir:

```bash
cd /Users/Ozan/Documents/opex-5.0
mkdir -p backups
docker compose exec -T postgres pg_dump -U opex_user -d opex_db > backups/opex_db_$(date +%Y%m%d_%H%M%S).sql
```

Ayni islem icin script:

```bash
cd /Users/Ozan/Documents/opex-5.0
make backup-db
```

## 3. Backup Dogrulama

- Dosya olustu mu kontrol et:

```bash
ls -lh backups/
```

- Rastgele bir backup dosyasini test ortamina restore ederek acilabilirligini dogrula.

## 4. Otomatik Backup Zamanlama (Cron)

Gunluk backup + retention politikasini cron ile aktif etmek icin:

```bash
cd /Users/Ozan/Documents/opex-5.0
make backup-cron-install HOUR=2 MINUTE=0 RETENTION_DAYS=14
```

Mevcut cron kaydini gormek icin:

```bash
cd /Users/Ozan/Documents/opex-5.0
make backup-cron-show
```

Cron kaydini kaldirmak icin:

```bash
cd /Users/Ozan/Documents/opex-5.0
make backup-cron-remove
```

Notlar:
- Cron komutu `scripts/db-backup-rotate.sh` cagirir.
- Her calismada yeni backup alir ve `RETENTION_DAYS` suresini gecen `opex_db_*.sql` dosyalarini temizler.
- Cron log dosyasi: `/Users/Ozan/Documents/opex-5.0/.logs/db-backup-cron.log`

## 5. Restore (Dikkat: Veri Uzerine Yazar)

1. Uygulamayi bakima al (yeni yazma islemlerini durdur).
2. Hedef DB temizle.
3. Dump dosyasini geri yukle.

Ornek:

```bash
cd /Users/Ozan/Documents/opex-5.0
cat backups/opex_db_YYYYMMDD_HHMMSS.sql | docker compose exec -T postgres psql -U opex_user -d opex_db
```

Script ile restore:

```bash
cd /Users/Ozan/Documents/opex-5.0
make restore-db BACKUP_FILE=backups/opex_db_YYYYMMDD_HHMMSS.sql
```

## 6. Restore Sonrasi Kontroller

- Backend health:
  - `http://localhost:3001/api/v1/health`
- Login testi
- Oneri listeleme ve temel rapor endpoint kontrolu
- Gerekirse `make seed` ile test verisi yukleme (yalnizca non-prod)

## 7. Guvenlik Notlari

- Backup dosyalari hassas veri icerebilir.
- Paylasim oncesi sifreli saklama (at-rest encryption) kullan.
- Sadece yetkili ekip erisebilmeli.
