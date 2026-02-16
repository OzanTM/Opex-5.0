# OpEx 5.0 - Guncel Yol Haritasi (2026)

Bu plan mevcut repo durumu (CI aktif, temel moduller calisiyor) uzerinden
"stabil urun" ve "canliya gecis" hedefini sirali sekilde tanimlar.

---

## Faz 0 - Baseline (Tamamlandi)

- [x] Backend + frontend build/test geciyor
- [x] GitHub Actions CI kurulu ve yesil
- [x] Docker Compose gelistirme ortami calisiyor
- [x] Startup otomasyonu (`make start/stop/status`) hazir
- [x] Temel ekranlar ve API entegrasyonu aktif

---

## Faz 1 - Stabilizasyon
**Durum:** Tamamlandi  
**Sure:** 1-2 hafta  
**Hedef:** Kritik is akislarini testle guvence altina almak

### 1. E2E Kapsami (Playwright)
- [x] Login + password change akisi (zorunlu degisim adimi assertion ile netlesti)
- [x] User oneriyi olusturup komiteye gonderebiliyor
- [x] Committee manager review (approve/reject/revision)
- [x] Approver onay/red akisi (red sonrasi komiteye donus dahil)
- [x] Rol bazli route koruma dogrulamasi (USER -> /admin erisimi engelli)

### 2. Kalite Kapisi (CI)
- [x] Kritik E2E smoke senaryosunu CI'a ekle
- [x] Lokal CI-benzeri smoke akisi tek komutla calisiyor (`make e2e-smoke`)
- [x] PR merge oncesi "backend + frontend + e2e-smoke" zorunlu gecis (branch protection ile aktif)

### 3. Prompt Uyumlandirma (Akis + Export)
- [x] Rapor export endpointleri prompt ile hizalandi (`/export/excel`, `/export/pdf`)
- [x] Excel/PDF endpointleri dosya indirme (`Content-Disposition`) olarak aktif
- [x] Eski endpointler (`/export/suggestions`, `/export/projects`) deprecate edilerek korundu
- [x] Onay zinciri pozisyon bazli cok adimli modele gecirildi
- [x] Pozisyon bazli onay zinciri icin E2E matrix tamamlandi (operator/uzman/sef)
- [x] Export endpointleri icin backend contract testleri eklendi

### 4. Guvenlik ve Bagimlilik
- [x] Frontend dependency guncellemeleri (ozellikle Next.js guvenlik yamasi)
- [x] Update sonrasi regression kontrolu (build + test + e2e smoke)

**Faz 1 Cikis Kriteri:**
- Tum kritik rollerde minimum 1 uctan uca senaryo yesil
- CI fail oraninda belirgin dusus
- "Yukleniyor'da kalma" benzeri kritik UI bug tekrar etmiyor
- Prompttaki onay hiyerarsisi kodda aktif ve testle dogrulanmis
- Prompttaki export beklentisi (excel/pdf dosya) endpoint seviyesinde karsilanmis

---

## Faz 2 - Dokumantasyon ve Release Hazirligi
**Durum:** Tamamlandi  
**Sure:** 1 hafta

### 1. Teknik Dokumantasyon
- [x] Swagger/OpenAPI endpoint dokumani (`/api-docs`, `/api-docs.json`)
- [x] Hata kodlari ve ornek response dokumani (`docs/api-hata-kodlari.md`)
- [x] RC release notes taslagi olusturuldu (`RELEASE_NOTES_RC1.md`)

### 2. Operasyon Dokumani
- [x] Deployment runbook (staging/prod) (`docs/deployment-runbook.md`)
- [x] Rollback adimlari (`docs/rollback-runbook.md`)
- [x] Backup/restore adimlari (`docs/backup-restore.md`)
- [x] Release checklist taslagi olusturuldu (`release_checklist.md`)

### 3. Kullanici Dokumani
- [x] Rol bazli kullanim kilavuzu (`docs/rol-bazli-kullanim-kilavuzu.md`)
- [x] Sik sorunlar ve cozumler (`startup.md`, `docs/rol-bazli-kullanim-kilavuzu.md`)

**Faz 2 Cikis Kriteri:**
- Yeni bir ekip uyesi dokumanla sistemi ayaga kaldirabiliyor
- API kullanimi icin ekibe net referans dokuman var

---

## Faz 3 - Production Hardening
**Durum:** In Progress  
**Sure:** 1-2 hafta

### 1. Ortam ve Guvenlik
- [x] Production env + secret yonetimi dokumani ve env template'leri
- [x] Secret manager entegrasyon script tabani (AWS Secrets Manager -> env + env validation)
- [x] Secret manager'in production pipeline/sunucu ortamina uygulanmasi icin deploy scriptleri (`make prod-sync-secrets`, `make prod-deploy`)
- [x] Systemd unit template ve render scripti eklendi (`make render-systemd-units`)
- [ ] Secret manager deploy akisinin gercek production ortamda calistirilip dogrulanmasi
- [x] Domain + SSL icin nginx template + render/preflight scriptleri + runbook
- [ ] Domain + SSL'in production sunucuya uygulanmasi
- [x] CORS ve rate-limit production ayari

### 2. Veritabani ve Isletim
- [x] DB backup/restore runbook + script komutlari (`make backup-db`, `make restore-db`)
- [x] Backup cron otomasyon scriptleri eklendi (`make backup-cron-install/show/remove`)
- [x] Monitoring/alarm plan dokumani ve health-check komutu (`make ops-health-check`)
- [x] Monitoring stack ve alarm kurallari eklendi (`make monitoring-up/down/status/logs`)
- [x] Monitoring probe target render mekanizmasi eklendi (`make render-monitoring-config`, `make monitoring-check`)
- [x] Incident response mini runbook
- [ ] DB backup politikasi ve zamanlamasinin production ortama otomasyonu (RPO/RTO)
- [ ] Monitoring/alarm kurallarinin production ortama entegrasyonu

### 3. Performans
- [x] Kritik endpointlerde response time olcumu icin local perf-smoke otomasyonu (`make perf-smoke`)
- [x] Gerekli noktalarda cache tuning

**Faz 3 Cikis Kriteri:**
- Uygulama staging/prod ortaminda izlenebilir ve geri alinabilir halde

---

## Faz 4 - Canliya Gecis
**Durum:** Faz 3 sonrasi

- [ ] Release checklist tamamlandi
- [ ] Tag/Release notu olusturuldu
- [ ] Canli gecis yapildi
- [ ] Ilk 48 saat yakindan izleme tamamlandi

---

## Bir Sonraki Asama (Net Plan)

1. Faz 3 kapsaminda production env + secret yonetimi tasarimini netlestir.
2. DB backup politikasi/zamanlamasi ve monitoring alarmlarini ortama uygula.
