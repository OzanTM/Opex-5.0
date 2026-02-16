# OpEx 5.0 Release Checklist (RC)

Bu dosya release adayi ve canliya gecis oncesi kontrol listesidir.

## 1) Kalite Kapisi (Code + Test)

- [ ] `make release-check` basariyla tamamlandi
- [ ] Backend testleri yesil
- [ ] Frontend testleri yesil
- [ ] Playwright E2E smoke (approval matrix dahil) yesil

## 2) GitHub Koruma ve CI

- [ ] Branch protection aktif (`main`)
- [ ] Zorunlu checkler:
  - [ ] `Backend Build and Test`
  - [ ] `Frontend Build and Test`
  - [ ] `E2E Smoke (Chromium)`
- [ ] PR uzerinden merge akisi dogrulandi

## 3) Prompt Uyum Kontrolu

- [ ] Onay akisi prompttaki hiyerarsiye uygun calisiyor:
  - [ ] Operator -> Sef -> Mudur -> Fabrika Muduru -> GMY
  - [ ] Uzman -> Mudur -> Fabrika Muduru -> GMY
  - [ ] Sef -> Mudur -> Fabrika Muduru -> GMY
- [ ] Export endpointleri promptla uyumlu:
  - [ ] `GET /api/v1/reports/export/excel`
  - [ ] `GET /api/v1/reports/export/pdf`
- [ ] Legacy export endpointleri deprecate headerlari ile aktif

## 4) Operasyon Hazirligi (Pre-Prod)

- [ ] Production env degiskenleri netlesti
- [ ] Secret yonetimi metodu netlesti
- [ ] `make prod-sync-secrets ...` ile sunucuda secret sync dogrulandi
- [ ] `make render-systemd-units ...` ile unit dosyalari uretilip systemd kurulumu tamamlandi
- [ ] `make domain-ssl-preflight ...` basariyla gecti
- [ ] `make monitoring-up` sonrasi Prometheus/Grafana/Alertmanager erisimi dogrulandi
- [ ] Backup/restore proseduru denendi
- [ ] Monitoring/alert metrikleri tanimlandi
- [ ] `make ops-health-check` staging ortaminda basariyla calisti

## 5) Release Artefaktlari

- [ ] Release notes hazirlandi (`RELEASE_NOTES_RC1.md`)
- [ ] Versiyon/tag karari verildi (ornek: `v1.0.0-rc.1`)
- [ ] Git tag olusturuldu ve push edildi

## 6) Final Komutlar

```bash
cd /Users/Ozan/Documents/opex-5.0

# 1) Branch protection (token gerekli)
GITHUB_TOKEN=<token> make branch-protect

# 2) Tum release kontrolleri
make release-check

# 3) Release aday etiketi
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```
