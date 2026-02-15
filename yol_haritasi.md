# OpEx 5.0 - Sıralı Proje Yol Haritası

Bu belge, `oneri_sistemi_tam_proje_promptu.md` (Gereksinimler) ve `eksik.md` (Mevcut Durum - 15 Şubat 2026) dosyalarının karşılaştırmalı analizi sonucunda oluşturulmuştur. Projenin %95 tamamlanma durumundan %100 canlıya alınma durumuna geçişi için gerekli adımları içerir.

## Faz 1: Kalite Güvence ve Test (Quality Assurance & Testing)
**Durum:** Öncelikli (Hemen Başlanmalı)
**Hedef:** Mevcut %95'lik kısmın hatasız çalıştığının doğrulanması.

1.  **Backend Testleri**
    -   [ ] **API Endpoint Testleri:** Tüm endpoint'ler (Auth, Suggestions, Committee, vb.) için unit ve integration testlerinin yazılması. `eksik.md`'de belirtildiği üzere testler eksik.
    -   [ ] **Yetkilendirme (Auth) Testleri:** Rol bazlı erişim kontrollerinin (RBAC) doğrulanması. (Örn: İşçi, yönetici ekranına erişememeli).
    -   [ ] **Onay Akış Testleri:** Hiyerarşik onay mekanizmasının (İşçi -> Şef -> Müdür -> GMY) farklı senaryolarla test edilmesi.

2.  **Frontend Testleri**
    -   [ ] **Form Validasyon Testleri:** Öneri formundaki zorunlu alanlar, karakter limitleri ve dosya yükleme kısıtlamalarının kontrolü.
    - [ ] **E2E (Uçtan Uca) Testler:** Playwright altyapısı kuruldu ve Auth mekanizması API tabanlı hale getirildi. Senaryo testlerinin (Öneri oluşturma vb.) stabilizasyonu ve selector sorunlarının giderilmesi gerekiyor.
    - [ ] **Mobil Uyumluluk Testleri:** Farklı ekran boyutlarında (Mobil, Tablet, Desktop) responsive tasarımın kontrolü.

## Faz 2: Eksik Özelliklerin Tamamlanması ve Doğrulanması (Feature Gap Filling)
**Durum:** Testlerle Paralel Yürütülebilir
**Hedef:** Prompt dosyasında istenen ancak `eksik.md` listesinde net olmayan özelliklerin kesinleştirilmesi.

1.  **Email Kuyruk Sistemi (Queue System)**
    -   [ ] **RabbitMQ/Redis Queue Entegrasyonu:** `oneri_sistemi_tam_proje_promptu.md` içerisinde belirtilen yüksek hacimli (5000 kişi) mail gönderimleri için kuyruk yapısının kurulması. (Mevcut durumda `eksik.md` sadece SMTP/SendGrid entegrasyonundan bahsetmiş, ancak ölçeklenebilirlik için Queue şart).
    -   [ ] **Rate Limiting:** Email gönderim limitlerinin (dakikada 100 mail vb.) backend tarafında tanımlanması ve test edilmesi.

2.  **Dosya Depolama (File Storage)**
    -   [ ] **S3/MinIO Entegrasyonu:** Dosya yükleme sisteminin AWS S3 veya MinIO ile entegrasyonunun doğrulanması. (Prompt'ta 100GB depolama hedefi verilmiş, lokal depolama bu yükü kaldıramayabilir).

3.  **Performans İyileştirmeleri (Veritabanı)**
    -   [ ] **Materialized Views:** Raporlama ekranlarının hızlandırılması için `oneri_sistemi_tam_proje_promptu.md` içinde önerilen "materialized view" yapılarının veritabanında oluşturulması (Günlük/Aylık özet tablolar). `eksik.md`'de rapor API'si tamamlandı dense de, performans optimizasyonu eksik listesinde.

## Faz 3: Performans ve Optimizasyon (Optimization)
**Durum:** Fonksiyonel Testlerden Sonra
**Hedef:** 5000 kullanıcı yüküne hazırlık.

1.  **Caching (Önbellekleme)**
    -   [ ] **Redis Caching:** Sık erişilen verilerin (Öneri listeleri, kullanıcı profilleri, statik ayarlar) Redis üzerinde önbelleklenmesi. `eksik.md`'de bu madde açıkça "Performance Optimization" altında listelenmiş.
2.  **Lazy Loading & Code Splitting:** Frontend tarafında sayfa yükleme hızlarının optimize edilmesi (< 2 saniye hedefi).
3.  **Yük Testi (Load Testing):** JMeter veya k6 ile 500-1000 eşzamanlı kullanıcı simülasyonu ve sistemin tepki sürelerinin ölçülmesi.

## Faz 4: Altyapı ve Canlıya Geçiş (Infrastructure & Deployment)
**Durum:** Optimizasyon Sonrası

1.  **Konteynerizasyon**
    -   [ ] **Docker:** Backend, Frontend ve Worker servislerinin Dockerize edilmesi.
    -   [ ] **Docker Compose:** Local geliştirme ve test ortamı için orchestration dosyasının hazırlanması.
2.  **CI/CD Pipeline**
    -   [ ] **GitHub Actions/GitLab CI:** Otomatik test, build ve deployment süreçlerinin kurulması.
3.  **Prodüksiyon Ortamı Hazırlığı**
    -   [ ] **PostgreSQL (Prod):** Canlı veritabanı kurulumu, replikasyon ve yedekleme stratejilerinin ayarlanması.
    -   [ ] **Domain & SSL:** Uygulamanın güvenli (HTTPS) yayını.

## Faz 5: Dokümantasyon ve Eğitim (Documentation)
**Durum:** Canlıya Geçiş Öncesi

1.  **Teknik Dokümantasyon**
    -   [ ] **Swagger/OpenAPI:** API endpoint'lerinin dokümante edilmesi. (`eksik.md`'de eksik olarak belirtilmiş).
    -   [ ] **Kurulum Kılavuzu:** Sistem yöneticileri için kurulum ve bakım kılavuzu.
2.  **Kullanıcı Kılavuzları**
    -   [ ] **Kullanıcı El Kitabı:** Öneri verme adımları.
    -   [ ] **Yönetici/Komite Rehberi:** Onay ve değerlendirme süreçleri.

## Faz 6: Gelecek Vizyonu (Future Phase)
1.  **Mobil Uygulama (React Native):** Mevcut API'leri kullanarak mobil uygulamanın geliştirilmesi.
