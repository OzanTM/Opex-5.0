# OpEx 5.0 - Release Notes (v1.0.0-rc.1)

Tarih: 16 Subat 2026

## Ozet

Bu release adayi, prompt ile hizali akislari ve kalite kapisi guvencesini hedefler.
Kritik odak: onay hiyerarsisi, export endpoint uyumu, otomatik test kapsamı.

## Eklenenler ve Iyilestirmeler

- Prompt uyumlu report export endpointleri:
  - `GET /api/v1/reports/export/excel`
  - `GET /api/v1/reports/export/pdf`
- Export dosya indirme destegi:
  - Excel (`.xlsx`)
  - PDF (`.pdf`)
- Legacy endpointler geri uyumlulukla korundu:
  - `GET /api/v1/reports/export/suggestions`
  - `GET /api/v1/reports/export/projects`
  - Deprecation/Sunset/Link headerlari eklendi.
- Pozisyon bazli cok adimli onay zinciri aktive edildi:
  - Operator/Teknisyen: Sef -> Mudur -> Fabrika Muduru -> GMY
  - Sef: Mudur -> Fabrika Muduru -> GMY
  - Uzman ve diger roller: Mudur -> Fabrika Muduru -> GMY
- E2E matrix testleri eklendi:
  - Operator submitter zinciri
  - Uzman submitter zinciri
  - Sef submitter zinciri
- Backend export contract testleri eklendi:
  - Excel/PDF response ve header dogrulamalari
  - Legacy endpoint deprecation header dogrulamalari

## Test Durumu

- Backend build: gecti
- Backend unit/integration testleri: gecti
- Playwright E2E smoke (approval matrix dahil): gecti

## Bilinen Konular

- `backend` tarafinda `npm audit` sonucunda `nodemailer` bagimliliginda high seviye uyari devam ediyor.
- Duzeltme major version gecisi gerektiriyor; Faz 2/3 hardening asamasinda planlanmalidir.

## Sonraki Adimlar

1. Branch protection'i GitHub tarafinda aktif et.
2. `make release-check` ile release kapisini tekrar dogrula.
3. RC tag olustur (`v1.0.0-rc.1`) ve push et.
4. Faz 2 dokumantasyon paketine gec (OpenAPI, runbook, kullanici kilavuzu).
