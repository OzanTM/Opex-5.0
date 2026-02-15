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

## Faz 1 - Stabilizasyon (Su anki sonraki asama)
**Durum:** In Progress (%90 tamamlandi)  
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
- [ ] PR merge oncesi "backend + frontend + e2e-smoke" zorunlu gecis

### 3. Guvenlik ve Bagimlilik
- [ ] Frontend dependency guncellemeleri (ozellikle Next.js guvenlik yamasi)
- [ ] Update sonrasi regression kontrolu (build + test + e2e smoke)

**Faz 1 Cikis Kriteri:**
- Tum kritik rollerde minimum 1 uctan uca senaryo yesil
- CI fail oraninda belirgin dusus
- "Yukleniyor'da kalma" benzeri kritik UI bug tekrar etmiyor

---

## Faz 2 - Dokumantasyon ve Release Hazirligi
**Durum:** Faz 1 sonrasi  
**Sure:** 1 hafta

### 1. Teknik Dokumantasyon
- [ ] Swagger/OpenAPI endpoint dokumani
- [ ] Hata kodlari ve ornek response dokumani

### 2. Operasyon Dokumani
- [ ] Deployment runbook (staging/prod)
- [ ] Rollback adimlari
- [ ] Backup/restore adimlari

### 3. Kullanici Dokumani
- [ ] Rol bazli kullanim kilavuzu
- [ ] Sik sorunlar ve cozumler

**Faz 2 Cikis Kriteri:**
- Yeni bir ekip uyesi dokumanla sistemi ayaga kaldirabiliyor
- API kullanimi icin ekibe net referans dokuman var

---

## Faz 3 - Production Hardening
**Durum:** Faz 2 sonrasi  
**Sure:** 1-2 hafta

### 1. Ortam ve Guvenlik
- [ ] Production env secret yonetimi
- [ ] Domain + SSL
- [ ] CORS ve rate-limit production ayari

### 2. Veritabani ve Isletim
- [ ] DB backup politikasi ve zamanlamasi
- [ ] Log/monitoring/alarm temel metrikleri
- [ ] Incident response mini runbook

### 3. Performans
- [ ] Kritik endpointlerde response time olcumu
- [ ] Gerekli noktalarda cache tuning

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

## Bu Hafta Ne Yapacagiz? (Net Plan)

1. Next.js guvenlik guncellemesini yap.
2. Update sonrasi tam regression calistir (backend/frontend + e2e-smoke).
3. Branch protection ile PR kapisini zorunlu hale getir.
4. Faz 1 cikis kriterlerini kapatip release-aday hazirla.
