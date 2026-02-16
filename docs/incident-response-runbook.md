# OpEx 5.0 Incident Response Mini Runbook

Bu dokuman canli ortamda kritik sorun aninda izlenecek hizli aksiyon adimlarini tanimlar.

## 1. Incident Seviyeleri

- P1: Sistem kullanilamiyor veya kritik akislar tamamen durdu.
- P2: Kritik akislar yavas/hatali ama kisitli kullanim var.
- P3: Duser oncelikli hata veya tekil etki.

## 2. Ilk 10 Dakika

1. Incident sahibi atansin.
2. Etki alani belirlenir:
   - Login
   - Oneri/onay akislari
   - Export
   - Sadece UI / sadece API
3. Hizli teknik kontrol:
   - `make ops-health-check`
   - loglar: `.logs/backend.log`, `.logs/frontend.log`
4. Gerekirse gecici onlem:
   - sorunlu ozellik kapatma
   - trafik azaltma

## 3. Eskalasyon ve Iletisim

- P1/P2 durumunda ilgili teknik sorumlulara aninda haber verilir.
- Durum guncellemeleri 15-30 dk periyotla paylasilir.

## 4. Karar Agaci

- Son release kaynakliysa:
  - rollback degerlendir (`docs/rollback-runbook.md`)
- Veri tutarsizligi varsa:
  - backup/restore opsiyonu degerlendir (`docs/backup-restore.md`)
- Altyapi kaynakliysa:
  - db/redis/network katmani izole edilip cozum uygulanir

## 5. Incident Sonrasi

1. Kök neden analizi (RCA) dokumani.
2. Kalici aksiyon maddeleri (owner + tarih).
3. Test/monitoring kapsamina yeni kontrol ekleme.
