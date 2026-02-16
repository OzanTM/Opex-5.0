# OpEx 5.0 Rol Bazli Kullanim Kilavuzu

Bu dokuman, sistemdeki temel rollerin gunluk kullanim akisini ozetler.

## 1. Ortak Baslangic

1. Frontend ac: `http://localhost:3000`
2. Kullanici girisi yap.
3. Ilk giriste sifre degistirme ekrani gelirse yeni sifre belirle.

## 2. USER (Calisan)

Ana hedef: Oneri olusturmak, guncellemek, komiteye gondermek.

Temel adimlar:
1. `Suggestions` sayfasina gir.
2. `New Suggestion` ile oneriyi doldur.
3. Taslak kaydet veya `Submit` ile komiteye gonder.
4. `My Suggestions` uzerinden durum takibi yap.

## 3. COMMITTEE_MANAGER / COMMITTEE_MEMBER

Ana hedef: Onerileri degerlendirmek.

Temel adimlar:
1. `Committee` ekraninda bekleyen onerileri ac.
2. Her bir oneri icin:
   - Approve
   - Reject
   - Revision request
3. Onaylanan oneride kategori + proje lideri/ekip atamasini yap.

## 4. APPROVER (Sef/Mudur/Fabrika Muduru/GMY)

Ana hedef: Kendisine dusen onay adimlarini islemek.

Temel adimlar:
1. `Approvals` ekraninda pending adimlari gor.
2. Her adim icin:
   - Approve
   - Reject
   - Return to committee (uygunsa)
3. Red veya iade durumunda not/reason gir.

## 5. PROJECT_LEADER

Ana hedef: Onaylanan oneriyi projeye cevirip ilerletmek.

Temel adimlar:
1. `Projects` ekraninda atanmis projeleri ac.
2. Ekip yonetimi:
   - Team member ekle/sil
3. Milestone yonetimi:
   - Milestone olustur/guncelle/sil
4. Ilerleme guncelle ve proje tamamla.

## 6. ADMIN

Ana hedef: Sistem yonetimi ve organizasyon yonetimi.

Temel adimlar:
1. Kullanici yonetimi:
   - Kullanici olustur/guncelle/sil
   - Sifre reset
   - Bulk import
2. Organizasyon:
   - Company / Department / Unit tanimlari
3. Sistem:
   - Settings
   - Audit logs
   - Role listesi ve admin istatistikleri

## 7. Raporlama ve Export (Tum Yetkili Roller)

- Dashboard ve rapor endpointleri:
  - `GET /api/v1/reports/dashboard`
- Export:
  - `GET /api/v1/reports/export/excel`
  - `GET /api/v1/reports/export/pdf`

## 8. Sik Sorunlar

- Giris yapamiyorum:
  - Employee ID / sifreyi kontrol et.
  - Hesap lock/suspend olabilir.
- Frontend yukleniyor ekrani:
  - Backend health endpointini kontrol et.
- Yetki hatasi:
  - Role bazli erisim nedeniyle endpoint kapali olabilir.
