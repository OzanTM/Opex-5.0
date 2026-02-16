# OpEx 5.0 Rollback Runbook

Bu dokuman, deployment sonrasi kritik hata durumunda bir onceki stabil versiyona
geri donus adimlarini tanimlar.

## 1. Ne Zaman Rollback?

Asagidaki durumlardan biri varsa rollback tetikle:

- Health endpoint 5 dk icinde stabil degil.
- Login veya kritik is akislarinda (oneri, onay, export) bloklayici hata var.
- Error rate hizla yukseliyor ve anlik fix ile toparlanamiyor.

## 2. Hedef Versiyonu Belirle

- Son stabil tag'i sec (ornek: `v1.0.0-rc.1`).
- CI sonucu ve release notlarini kontrol et.

## 3. Uygulama Rollback Adimlari

1. Yeni rollout'u durdur.
2. Servisi son stabil artefact/image/tag ile yeniden deploy et.
3. Gerekirse sadece frontend veya sadece backend rollback yap:
   - UI kirmasi varsa frontend rollback
   - API/DB is akisi kirmasi varsa backend rollback
4. Health ve smoke kontrollerini tekrar kos:
   - `/api/v1/health`
   - Login + temel rol akisi
   - Export endpointleri

## 4. Veritabani Ile Ilgili Geri Donus

- Eger migration geri alinmasi gerekiyorsa otomatik yerine kontrollu SQL ile ilerle.
- Kritik durumlarda tam restore icin `docs/backup-restore.md` prosedurunu kullan.

## 5. Rollback Sonrasi Yapilacaklar

1. Olay kaydi ac (incident kaydi).
2. Kirma nedeni ve etki alani dokumante et.
3. Kalici duzeltme icin hotfix branch ac.
4. Hotfix tamamlaninca tekrar staging -> production akisini uygula.
