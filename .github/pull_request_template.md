## Ozet

Bu PR'da ne degisti? Kisa ve net yaz.

## Kapsam

- [ ] Backend
- [ ] Frontend
- [ ] DevOps/Docs

## Test Kaniti

Calistirdigin komutlar ve sonuc:

```bash
make release-check
make perf-smoke
make ops-health-check
```

- [ ] Tum komutlar basarili
- [ ] Kritik akislarda manuel kontrol yapildi

## Risk ve Geri Donus

- Risk:
- Rollback plani:

## Release Aday Kontrol Listesi

- [ ] `make local-rc-check` basarili
- [ ] CI checkleri yesil:
  - [ ] Backend Build and Test
  - [ ] Frontend Build and Test
  - [ ] E2E Smoke (Chromium)
- [ ] Export endpointleri dogrulandi (`/reports/export/excel`, `/reports/export/pdf`)
- [ ] Onay zinciri (rol/pozisyon) dogrulandi

## Notlar

Gerekli ek bilgi/ekran goruntusu/link.
