# ÖNERİ SİSTEMİ (OpEx 5.0) - TAM PROJE GELİŞTİRME PROMPTU

## PROJE ÖZET BİLGİLERİ

**Proje Adı:** OpEx 5.0 - Kurumsal Öneri Yönetim Sistemi  
**Kullanıcı Kapasitesi:** 5000+ çalışan  
**Hedef Platform:** Web (birincil) + Mobil App (gelecek faz)  
**Sistem Tipi:** Öneri/Fikir Yönetim ve İş Süreci Otomasyonu

## GELİŞTİRME HEDEFLERİ

### Birincil Hedefler
1. 5000 kişilik şirkette tüm çalışanların (Mavi Yaka + Beyaz Yaka) öneri verebilmesi
2. Önerilerin sistematik değerlendirme ve onay sürecinden geçmesi
3. Otomatik email bildirim sistemi
4. Kapsamlı raporlama ve analitik
5. Rol bazlı erişim kontrolü
6. Mobil uyumlu responsive tasarım (gelecekte native app'e dönüşebilir)

### Performans Gereksinimleri (5000 Kişi için)
- **Eşzamanlı kullanıcı:** 500-1000 kişi
- **API response süresi:** < 500ms
- **Sayfa yükleme:** < 2 saniye
- **Uptime:** %99.5
- **Database:** Ölçeklenebilir yapı (sharding/clustering desteği)
- **File storage:** Minimum 100GB (doküman yüklemeleri için)

---

## SİSTEM MİMARİSİ (5000 KİŞİLİK ŞİRKET İÇİN)

### Teknoloji Stack Önerisi

#### Backend (Yüksek Performans için)
```
Seçenek 1 (Önerilen):
- Node.js 18+ + Express.js / Fastify
- PostgreSQL 15+ (Master-Slave Replication)
- Redis (Caching + Session Management)
- RabbitMQ / AWS SQS (Email Queue)
- AWS S3 / MinIO (File Storage)

Seçenek 2:
- Python 3.11+ + FastAPI
- PostgreSQL 15+ 
- Redis
- Celery (Background Tasks)
- AWS S3
```

#### Frontend (Mobil Uyumlu)
```
- React 18+ + TypeScript
- Next.js (SSR + SEO için)
- Tailwind CSS + shadcn/ui (Modern, responsive)
- React Query (API state management)
- Zustand (Global state)
- PWA (Progressive Web App) desteği
```

#### Mobil App Hazırlığı (Gelecek Faz)
```
- React Native (tek kod tabanı - iOS + Android)
- Expo (hızlı development)
- Push Notification (OneSignal / Firebase)
```

#### DevOps & Infrastructure
```
- Docker + Kubernetes (Horizontal Scaling)
- AWS / Azure / Google Cloud
- CI/CD: GitHub Actions / GitLab CI
- Monitoring: Prometheus + Grafana / DataDog
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
- Load Balancer: Nginx / AWS ALB
```

#### Email Service
```
- SendGrid / AWS SES (Toplu mail için)
- Email Template Engine (Handlebars / Mustache)
- Queue System (Email gönderimleri için)
```

---

## EMAİL BİLDİRİM SİSTEMİ (DETAYLI)

### Email Şablonları (Mail Templates)

#### 1. ÖNERİ İLK VERİLDİĞİNDE
**Alıcı:** Öneri Veren Çalışan  
**Konu:** Öneriniz Alındı - {{öneri_konusu}}

```
Merhaba {{çalışan_adı}},

Öneriniz bizlere ulaştı. Teşekkür ederiz.

Fikri veren: {{çalışan_adı_soyadı}}
Konu: {{öneri_konusu}}
Firma: {{firma_adı}}
Durum: Fikir Yönetim Komitesi onayında

Aksiyon: Önerilerinize değer veriyor ve ödüllendiriyoruz.

Önerileriniz Fikir Yönetim Komitesi tarafından değerlendirilerek müdür onayına düşmektedir.

Önerinizin durumunu OpEx 5.0 uygulamasında yer alan süreç adımları kısmından takip edebilirsiniz.

İlerleyen süreç adımlarında E-Posta ile bilgilendirileceksiniz.

[Öneriyi Görüntüle] (button/link)

OpEx 5.0 Ekibi
```

**Ek Bildirim:**
- Fikir Yönetim Komitesi Sistem Sorumlusuna da aynı anda mail gitmeli

---

#### 2. ÖNERİ FİKİR YÖNETİM KOMİTESİ TARAFINDAN ONAYLANDIĞINDA
**Alıcı:** İlgili Müdür (Şef/Müdür/Fabrika Müdürü - hiyerarşiye göre)  
**Konu:** Yeni Öneri Onayınızı Bekliyor - {{öneri_konusu}}

```
Merhaba {{yönetici_adı}},

Öncelikle öneriniz için teşekkür ederiz.

Öneriniz Fikir Yönetim Komitemiz tarafından değerlendirilerek onaylanmıştır.

Fikri veren: {{çalışan_adı_soyadı}}
Konu: {{öneri_konusu}}
Firma: {{firma_adı}}
Durum: İlgili Müdür Onayında

Aksiyon: Önerilerinize değer veriyor ve ödüllendiriyoruz.

Önerileriniz Fikir Yönetim Komitesi tarafından değerlendirilerek müdür onayına düşmüştür.

Önerinizin durumunu OpEx 5.0 uygulamasında yer alan süreç adımları kısmından takip edebilirsiniz.

İlerleyen süreç adımlarında E-Posta ile bilgilendirileceksiniz.

[Öneriyi İncele ve Onayla] (button/link)

OpEx 5.0 Ekibi
```

**Ek Bildirim:**
- Öneri sahibine de "Öneriniz müdür onayına gönderildi" maili gitmeli

---

#### 3. ÖNERİ GÜNCELLEMESİ TALEP EDİLDİĞİNDE
**Alıcı:** Öneri Veren Çalışan  
**Konu:** Öneriniz Güncelleme Bekliyor - {{öneri_konusu}}

```
Merhaba {{çalışan_adı}},

Öncelikle öneriniz için teşekkür ederiz.

Öneriniz Fikir Yönetim Komitesi tarafından değerlendirilmiş olup. Güncelleme talebi bulunmaktadır.

Fikri veren: {{çalışan_adı_soyadı}}
Konu: {{öneri_konusu}}
Firma: {{firma_adı}}
Durum: Güncelleme Beklenmekte

Aksiyon: 

Değerlendirme Açıklaması: {{güncelleme_açıklaması}}

Öneriniz için güncellemenizi en kısa sürede tamamlamanızı bekliyoruz.

Önerileriniz Fikir Yönetim Komitesi tarafından tekrar değerlendirilerek müdür onayına düşecektir.

Önerinizin durumunu OpEx 5.0 uygulamasında yer alan süreç adımları kısmından takip edebilirsiniz.

İlerleyen süreç adımlarında E-Posta ile bilgilendirileceksiniz.

[Öneriyi Güncelle] (button/link)

OpEx 5.0 Ekibi
```

---

#### 4. ÖNERİ KOMİTE TARAFINDAN REDDEDİLDİĞİNDE
**Alıcı:** Öneri Veren Çalışan  
**Konu:** Öneriniz Hakkında - {{öneri_konusu}}

```
Merhaba {{çalışan_adı}},

Öncelikle öneriniz için teşekkür ederiz.

Öneriniz Fikir Yönetim Komitesi tarafından değerlendirilmiş olup, reddedilmiştir.

Fikri veren: {{çalışan_adı_soyadı}}
Konu: {{öneri_konusu}}
Firma: {{firma_adı}}
Durum: Reddedildi

Aksiyon:

Değerlendirme Açıklaması: {{red_açıklaması}}

Yeni önerilerinizi bekliyoruz.

[Yeni Öneri Ver] (button/link)

OpEx 5.0 Ekibi
```

---

#### 5. ÖNERİ İLGİLİ MÜDÜR TARAFINDAN REDDEDİLDİĞİNDE
**Alıcı:** Öneri Veren Çalışan  
**Konu:** Öneriniz Hakkında - {{öneri_konusu}}

```
Merhaba {{çalışan_adı}},

Öncelikle öneriniz için teşekkür ederiz.

Öneriniz ilgili müdür tarafından değerlendirilmiş olup, reddedilmiştir.

Fikri veren: {{çalışan_adı_soyadı}}
Konu: {{öneri_konusu}}
Firma: {{firma_adı}}
Durum: Reddedildi, Fikir Yönetim Komitesi Onayında.

Aksiyon:

Değerlendirme Açıklaması: {{red_açıklaması}}

Ret sebebi Fikir Yönetim Komitesi tarafından tekrar değerlendirilecek olup, sonuç işletilecektir.

[Öneri Detayını Gör] (button/link)

OpEx 5.0 Ekibi
```

**Ek Bildirim:**
- Fikir Yönetim Komitesine de bildirim gitmeli (tekrar değerlendirme için)

---

#### 6. EK EMAIL ŞABLONLARı (Önerilen)

**6a. Öneri Tüm Onaylardan Geçtiğinde**
```
Merhaba {{çalışan_adı}},

Harika haber! Öneriniz tüm onay süreçlerini başarıyla tamamladı.

Konu: {{öneri_konusu}}
Durum: Uygulamaya Alındı
Proje Lideri: {{proje_lideri_adı}}

Öneriniz artık uygulama aşamasında. İlerleme hakkında bilgilendirileceksiniz.

Katkılarınız için teşekkür ederiz!

OpEx 5.0 Ekibi
```

**6b. Öneri Başarıyla Tamamlandığında**
```
Merhaba {{çalışan_adı}},

Tebrikler! Öneriniz başarıyla tamamlandı.

Konu: {{öneri_konusu}}
Tamamlanma Tarihi: {{tamamlanma_tarihi}}
Kazanç: {{kazanç_bilgisi}}

Şirketimize katkılarınız için teşekkür ederiz.

[Ödül/Takdir Bilgileri] (varsa)

OpEx 5.0 Ekibi
```

**6c. Hatırlatma Maili (Onay Bekleyen Yöneticiler İçin)**
```
Merhaba {{yönetici_adı}},

Onayınızı bekleyen {{bekleyen_öneri_sayısı}} adet öneri bulunmaktadır.

En eski bekleyen öneri: {{öneri_konusu}} ({{bekleme_süresi}} gündür bekliyor)

Lütfen önerileri değerlendirerek süreci ilerletiniz.

[Bekleyen Önerileri Görüntüle] (button/link)

OpEx 5.0 Ekibi
```

---

### Email Sistemi Teknik Detayları

#### Queue Sistemi
```javascript
// Email gönderimlerini queue'ya alma
const emailQueue = {
  add: async (emailData) => {
    await rabbitMQ.publish('email_queue', {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      data: emailData.data,
      priority: emailData.priority || 'normal', // high, normal, low
      retryCount: 0,
      maxRetries: 3
    });
  }
};

// Priority levels:
// high: Acil bildirimler (red, onay vb)
// normal: Standart bildirimler
// low: Hatırlatmalar, digest mailler
```

#### Email Template Engine
```javascript
// Handlebars kullanımı
const template = `
<html>
<body style="font-family: Arial, sans-serif;">
  <h2>Merhaba {{çalışan_adı}},</h2>
  <p>{{mesaj}}</p>
  
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
    <strong>Fikri veren:</strong> {{çalışan_adı_soyadı}}<br>
    <strong>Konu:</strong> {{öneri_konusu}}<br>
    <strong>Firma:</strong> {{firma_adı}}<br>
    <strong>Durum:</strong> <span style="color: {{durum_renk}}">{{durum}}</span>
  </div>
  
  {{#if aksiyon_button}}
  <a href="{{button_link}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
    {{button_text}}
  </a>
  {{/if}}
  
  <p style="margin-top: 30px; color: #666;">
    OpEx 5.0 Ekibi
  </p>
</body>
</html>
`;
```

#### Rate Limiting (5000 kişi için)
```javascript
// Email gönderim limitleri
const emailRateLimits = {
  perSecond: 10,  // Saniyede 10 mail
  perMinute: 100, // Dakikada 100 mail
  perHour: 1000,  // Saatte 1000 mail
  daily: 10000    // Günde 10000 mail
};

// Toplu bildirimler için batch processing
const sendBulkEmails = async (recipients) => {
  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await Promise.all(batch.map(sendEmail));
    await sleep(1000); // 1 saniye bekle
  }
};
```

---

## DETAYLI FONKSİYONEL GEREKSİNİMLER

### 1. KULLANICI YÖNETİMİ VE ROL SİSTEMİ

#### Rol Tanımları ve Yetkileri

**1. Kullanıcı (Çalışan) - 4500+ kişi**
- Öneri oluşturabilir, güncelleyebilir, silebilir (sadece kendi önerileri)
- Kendi önerilerinin durumunu görüntüleyebilir
- Geçmiş önerilerini görüntüleyebilir (Tarihçe)
- Doküman yükleyebilir

**2. Admin - 5-10 kişi**
- Tüm sistem ayarlarını yönetebilir
- Kullanıcı oluşturabilir, güncelleyebilir, silebilir
- Rol ataması yapabilir
- Şirket/Müdürlük/Şeflik yapısını yönetebilir
- Tüm raporlara erişebilir
- Sistem loglarını görüntüleyebilir
- Email şablonlarını düzenleyebilir

**3. Fikir Yönetim Komitesi Sistem Sorumlusu - 1-2 kişi**
- Bekleyen önerileri görüntüleyebilir
- Önerileri kategorilere ayırabilir (Makul Öneri, Kaizen, A3, Ar-Ge, vb.)
- Proje lideri ve proje ekibi atayabilir
- Öneri kabul/red/güncelleme kararı verebilir
- Benzer önerileri görüntüleyebilir

**4. Fikir Yönetim Komitesi Üyeleri - 5-10 kişi**
- Önerileri görüntüleyebilir ve değerlendirebilir
- Görüş bildirebilir (nihai karar Sistem Sorumlusunda)

**5. Onaycılar (Şef/Müdür/Fabrika Müdürü/GMY) - 100-200 kişi**
- Kendilerine düşen önerileri görüntüleyebilir
- Onay verebilir
- Red edebilir (açıklama zorunlu)
- Onay geçmişini görüntüleyebilir

**6. Proje Lideri - 50-100 kişi**
- Atandığı projeleri görüntüleyebilir
- Proje ilerlemesini güncelleyebilir
- Proje ekibiyle koordinasyon yapabilir
- Projeyi tamamlayabilir (kapatabilir)

#### Giriş Sistemi

**Login Ekranı:**
```
╔══════════════════════════════════════╗
║         OpEx 5.0 Logo               ║
║                                      ║
║  Kullanıcı Adı (Sicil No):          ║
║  [________________]                  ║
║                                      ║
║  Şifre:                              ║
║  [________________]                  ║
║                                      ║
║  [Şifremi Unuttum]                  ║
║                                      ║
║  [     GİRİŞ YAP     ]              ║
║                                      ║
╚══════════════════════════════════════╝
```

**İlk Giriş:**
- Tüm personel için varsayılan şifre oluşturulur
- İlk girişte şifre değiştirme zorunluluğu
- Şifre politikası: Min 8 karakter, 1 büyük, 1 küçük, 1 rakam

**Şifre Sıfırlama:**
- Email ile doğrulama kodu gönderimi
- Kod ile yeni şifre belirleme
- Veya admin tarafından manuel sıfırlama

---

### 2. DASHBOARD (Rol Bazlı Ana Ekranlar)

#### Çalışan Dashboard
```
┌────────────────────────────────────────────────────┐
│ OpEx 5.0          [Profil] [Çıkış]                │
├────────────────────────────────────────────────────┤
│                                                     │
│ Hoş Geldiniz, {{çalışan_adı}}                      │
│                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│ │ Toplam      │ │ Beklemede   │ │ Onaylanan   │  │
│ │ Öneri       │ │ Öneri       │ │ Öneri       │  │
│ │    5        │ │    2        │ │    3        │  │
│ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                     │
│ [ + YENİ ÖNERİ VER ]                               │
│                                                     │
│ Son Önerilerim:                                    │
│ ┌───────────────────────────────────────────────┐ │
│ │ Test Öneri 1     │ Beklemede    │ 15.01.2026 │ │
│ │ Test Öneri 2     │ Onaylandı    │ 10.01.2026 │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ [Tüm Önerilerim] [Raporlarım]                      │
└────────────────────────────────────────────────────┘
```

#### Yönetici Dashboard
```
┌────────────────────────────────────────────────────┐
│ OpEx 5.0 - Yönetici Paneli                         │
├────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│ │ Onay        │ │ Bu Ay       │ │ Bu Yıl      │  │
│ │ Bekleyen    │ │ Onaylanan   │ │ Toplam      │  │
│ │    15       │ │    45       │ │    320      │  │
│ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                     │
│ ⚠️ Acil Dikkat Gerektiren: 3 öneri 7+ gündür bekliyor │
│                                                     │
│ Onay Bekleyen Öneriler:                            │
│ [Listele] [Filtrele]                               │
│                                                     │
│ [Raporlar] [Performans] [Analitik]                 │
└────────────────────────────────────────────────────┘
```

#### Komite Dashboard
```
┌────────────────────────────────────────────────────┐
│ OpEx 5.0 - Fikir Yönetim Komitesi                  │
├────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│ │ Değerlendirme│ │ Bu Ay       │ │ Kategoriler │  │
│ │ Bekleyen    │ │ İşlenen     │ │             │  │
│ │    25       │ │    78       │ │ [Detay]     │  │
│ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                     │
│ Yeni Gelen Öneriler:                               │
│ [Kategori Atama] [Toplu İşlem]                     │
│                                                     │
│ Kategori Dağılımı:                                 │
│ [Grafik gösterimi]                                 │
└────────────────────────────────────────────────────┘
```

---

### 3. ÖNERİ VERME SÜRECİ (Detaylı Form Akışı)

#### Form Validasyonları
```javascript
const validationRules = {
  öneri_konusu: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: "Öneri konusu 10-200 karakter arasında olmalıdır"
  },
  mevcut_durum: {
    required: true,
    minLength: 50,
    maxLength: 2000,
    message: "Mevcut durum en az 50 karakter olmalıdır"
  },
  çözüm_önerisi: {
    required: true,
    minLength: 50,
    maxLength: 2000
  },
  tahmini_maliyet: {
    required: false,
    type: 'number',
    min: 0,
    max: 10000000
  },
  kazanç_kategorisi: {
    required: true,
    minSelected: 1,
    message: "En az bir kazanç kategorisi seçmelisiniz"
  }
};
```

#### Auto-Save (Taslak Kaydetme)
```javascript
// Her 30 saniyede bir otomatik kayıt
const autoSave = () => {
  setInterval(() => {
    if (formHasChanges) {
      saveDraft();
      showNotification("Taslak kaydedildi", "success");
    }
  }, 30000);
};

// Sayfa kapatılmadan önce uyarı
window.onbeforeunload = (e) => {
  if (formHasChanges && !formSubmitted) {
    e.returnValue = "Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?";
  }
};
```

#### Dosya Yükleme Sistemi
```javascript
const fileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  maxFiles: 10,
  storage: 'aws-s3', // veya 'local', 'azure-blob'
  virusScan: true // Virüs taraması aktif
};

// Çoklu dosya yükleme - Drag & Drop
const uploadArea = `
  <div class="upload-area" ondrop="handleDrop(event)" ondragover="handleDragOver(event)">
    <p>Dosyaları buraya sürükleyin veya tıklayın</p>
    <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
    
    <div class="file-list">
      <!-- Yüklenen dosyalar burada listelenecek -->
    </div>
  </div>
`;
```

---

### 4. ONAY SÜRECİ DETAYLARI

#### Onay Akış Matrisi

```
┌─────────────────────────────────────────────────────────────┐
│                    ONAY AKIŞ DİYAGRAMI                      │
└─────────────────────────────────────────────────────────────┘

Öneri Verildi
    ↓
Fikir Yönetim Komitesi Değerlendirme
    ↓
    ├─→ RED → Öneri Sahibine Mail → SON
    ├─→ GÜNCELLEME TALEP → Öneri Sahibine Mail → Güncelleme → Tekrar Komiteye
    └─→ KABUL
        ↓
        Kategori Belirleme (Makul, Kaizen, A3, vb.)
        ↓
        Proje Lideri + Ekip Atama
        ↓
        ┌─────────────────────────────────┐
        │   HİYERARŞİK ONAY SÜRECİ       │
        └─────────────────────────────────┘
        
        Öneri Veren Pozisyonuna Göre:
        
        ┌─ Operatör/Teknisyen ─┐
        │   ↓                   │
        │   Şef                 │
        │   ↓                   │
        │   Müdür              │
        │   ↓                   │
        │   Fabrika Müdürü     │
        │   ↓                   │
        │   GMY                │
        └───────────────────────┘
        
        ┌─ Mühendis/Uzman ─────┐
        │   ↓                   │
        │   Müdür              │
        │   ↓                   │
        │   Fabrika Müdürü     │
        │   ↓                   │
        │   GMY                │
        └───────────────────────┘
        
        ┌─ Şef ────────────────┐
        │   ↓                   │
        │   Müdür              │
        │   ↓                   │
        │   Fabrika Müdürü     │
        │   ↓                   │
        │   GMY                │
        └───────────────────────┘
        
        Her aşamada:
        - ONAYLA → Sonraki aşamaya
        - REDDET → Öneri Sahibine + Komiteye bildirim → Komite tekrar değerlendirir
        
        ↓
    Tüm Onaylar Tamamlandı
        ↓
    Proje Liderine Atandı
        ↓
    Uygulama Başladı
        ↓
    Proje İlerlemesi (%)
        ↓
    Proje Tamamlandı
        ↓
    SON (Başarılı)
```

#### SLA (Service Level Agreement) - Onay Süreleri
```javascript
const onayGecikmeUyarilari = {
  komite: {
    normalSure: 3, // gün
    uyari1: 5,     // gün - sarı
    uyari2: 7,     // gün - turuncu
    kritik: 10     // gün - kırmızı
  },
  yonetici: {
    normalSure: 2,
    uyari1: 4,
    uyari2: 6,
    kritik: 8
  }
};

// Otomatik hatırlatma sistemi
const hatirlatmaServisi = {
  gunlukKontrol: async () => {
    const bekleyenOnaylar = await getBekleyenOnaylar();
    
    bekleyenOnaylar.forEach(async (onay) => {
      const beklemeSuresi = Date.now() - onay.created_at;
      const beklemeSuresiGun = beklemeSuresi / (1000 * 60 * 60 * 24);
      
      if (beklemeSuresiGun >= 3) {
        await sendHatirlatmaMail(onay);
      }
      
      if (beklemeSuresiGun >= 7) {
        await sendEscalationMail(onay); // Üst yöneticiye bildirim
      }
    });
  }
};
```

---

### 5. RAPORLAMA SİSTEMİ (5000 Kişi için Optimize)

#### Rapor Performans Optimizasyonu
```javascript
// Büyük veri setleri için materialized views
const raporOptimizasyonu = {
  
  // Günlük otomatik hesaplama (gece 02:00)
  materializedViews: [
    'daily_suggestion_summary',
    'monthly_department_stats',
    'yearly_company_stats'
  ],
  
  // Cache stratejisi
  cacheStrategy: {
    raporlar: '1 hour', // Raporlar 1 saat cache'lenir
    dashboard: '5 minutes',
    liveData: 'no-cache'
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 50,
    maxPageSize: 100
  }
};
```

#### Rapor Türleri (Detaylı)

**1. Personel Bazlı Rapor**
```
Filtreleme:
- Personel Adı/Sicil No
- Tarih Aralığı
- Durum (Tümü, Beklemede, Onaylı, Red, vb.)
- Öneri Türü

Gösterilen Bilgiler:
- Toplam Öneri Sayısı
- Onaylanan Öneri Sayısı (%)
- Reddedilen Öneri Sayısı (%)
- Bekleyen Öneri Sayısı
- Tamamlanan Öneri Sayısı
- Toplam Tahmini Kazanç ($)
- Öneri Detay Listesi

Grafikler:
- Aylık öneri trend grafiği
- Kategori dağılım pasta grafiği
- Kazanç dağılımı
```

**2. Departman/Birim Bazlı Rapor**
```
Filtreleme:
- Şirket
- Müdürlük
- Şeflik
- Tarih Aralığı
- Öneri Durumu

Gösterilen Bilgiler:
- Toplam Öneri Sayısı
- Çalışan Başına Ortalama Öneri
- En Aktif 10 Çalışan
- Durum Dağılımı
- Kategori Dağılımı
- Toplam Tahmini Maliyet
- Toplam Tahmini Kazanç
- ROI Hesaplaması

Grafikler:
- Departman karşılaştırma bar chart
- Zaman serisi line chart
- Heat map (aktif bölgeler)
```

**3. Yönetici Performans Raporu**
```
Filtreleme:
- Yönetici Adı
- Tarih Aralığı

Gösterilen Bilgiler:
- Onay Verilen Öneri Sayısı
- Red Edilen Öneri Sayısı
- Ortalama Onay Süresi (gün)
- Bekleyen Öneri Sayısı
- En Uzun Bekleyen Öneri (gün)

KPI'lar:
- Onay Hızı Skoru
- Karar Kalitesi Skoru (red oranı)
```

**4. Genel Müdürlük/Holding Raporu**
```
Filtreleme:
- Yıl
- Çeyrek
- Ay
- Şirket/Tesis

Dashboard:
┌────────────────────────────────────────┐
│ Bu Ay                                  │
│ ├─ Toplam Öneri: 450                  │
│ ├─ Onaylanan: 320 (71%)               │
│ ├─ Bekleyen: 85 (19%)                 │
│ └─ Red: 45 (10%)                       │
│                                        │
│ Bu Yıl Toplamı                        │
│ ├─ Toplam Öneri: 3,245               │
│ ├─ Tahmini Kazanç: $2.5M/yıl         │
│ ├─ Tamamlanan Projeler: 1,890        │
│ └─ Gerçekleşen Kazanç: $1.8M/yıl     │
└────────────────────────────────────────┘

Grafikler:
- Yıllık trend
- Tesis bazlı karşılaştırma
- Kategori dağılımı
- Top 10 çalışan
- Top 10 öneri (kazanç bazında)
```

#### Export Fonksiyonları

**Excel Export**
```javascript
const excelExport = {
  format: 'xlsx',
  sheets: [
    'Özet',
    'Detaylı Liste',
    'Grafikler',
    'Pivot Tablolar'
  ],
  styling: true,
  charts: true,
  filters: true
};

// Örnek kullanım
exportToExcel({
  data: raporData,
  fileName: `Oneri_Raporu_${date}.xlsx`,
  template: 'standart_rapor'
});
```

**PDF Export**
```javascript
const pdfExport = {
  format: 'A4',
  orientation: 'portrait', // veya 'landscape'
  header: {
    logo: true,
    title: true,
    date: true
  },
  footer: {
    pageNumbers: true,
    generatedBy: true
  },
  charts: true,
  tableOfContents: true
};
```

---

### 6. MOBİL UYUMLULUK (PWA + Gelecek Native App)

#### PWA (Progressive Web App) Özellikleri

**Offline Çalışma**
```javascript
// Service Worker ile offline support
const offlineFeatures = {
  cachedPages: [
    '/dashboard',
    '/my-suggestions',
    '/create-suggestion'
  ],
  
  offlineActions: [
    'view_my_suggestions',
    'draft_new_suggestion', // Offline taslak oluşturma
    'view_notifications'
  ],
  
  syncWhenOnline: true // Online olunca sync
};
```

**Push Notifications**
```javascript
const pushNotifications = {
  newSuggestionApproval: true,
  suggestionRejected: true,
  reminderPendingApprovals: true,
  projectCompleted: true,
  
  // Bildirim ayarları
  allowedTimes: '08:00-18:00', // Çalışma saatleri
  doNotDisturb: 'weekends' // Hafta sonu bildirim yok
};
```

**Mobile-First UI**
```css
/* Responsive Breakpoints */
--mobile: 320px - 768px
--tablet: 769px - 1024px
--desktop: 1025px+

/* Mobile Optimizations */
- Büyük dokunmatik hedefler (min 44x44px)
- Swipe gestures (öneri detaylarında kaydırma)
- Bottom navigation (mobilde alt menü)
- Reduced animations (performans için)
- Optimized images (WebP format)
```

#### Gelecek Native App Hazırlığı

**React Native Migration Path**
```
Faz 1 (Mevcut): Web (React + PWA)
    ↓
Faz 2: Shared Components (React Native Web)
    ↓
Faz 3: Native App Development
    ├─→ iOS App (App Store)
    └─→ Android App (Play Store)
    
Kod Paylaşımı: %70-80
Platform-specific: %20-30
```

**Native App Özellik Planı**
```
v1.0 (MVP):
- Login
- Dashboard
- Öneri verme
- Öneri görüntüleme
- Push notifications
- Offline mode

v1.5:
- Kamera entegrasyonu (fotoğraf çekme)
- Ses kaydı (öneri açıklama)
- QR kod okuma (lokasyon bazlı öneri)
- Biometric login (Face ID, Fingerprint)

v2.0:
- AI destekli öneri önerileri
- Chatbot desteği
- AR görselleştirme
- Gamification
```

---

### 7. GÜVENLİK (5000 Kullanıcı için Enterprise Security)

#### Authentication & Authorization

**Multi-Factor Authentication (Opsiyonel)**
```javascript
const mfaConfig = {
  enabled: true,
  methods: [
    'email_otp',     // Email ile 6 haneli kod
    'sms_otp',       // SMS ile kod
    'authenticator'  // Google Authenticator
  ],
  requiredFor: ['admin', 'committee_manager'],
  optional: ['user', 'approver']
};
```

**Session Management**
```javascript
const sessionConfig = {
  sessionTimeout: 30 * 60 * 1000, // 30 dakika
  refreshToken: true,
  maxConcurrentSessions: 3, // Bir kullanıcı max 3 cihazdan giriş
  
  // Şüpheli aktivite tespiti
  securityRules: {
    maxFailedLogins: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 dakika
    suspiciousLocationCheck: true,
    deviceFingerprinting: true
  }
};
```

#### Data Security

**Encryption**
```javascript
const encryptionStandards = {
  atRest: 'AES-256', // Database encryption
  inTransit: 'TLS 1.3', // HTTPS
  sensitiveFields: [
    'user_password',
    'personal_data'
  ]
};
```

**Audit Logging**
```javascript
// Tüm kritik işlemler loglanır
const auditLog = {
  events: [
    'user_login',
    'user_logout',
    'suggestion_created',
    'suggestion_updated',
    'suggestion_deleted',
    'approval_given',
    'rejection_given',
    'role_changed',
    'admin_action'
  ],
  
  storage: 'elasticsearch', // Hızlı arama için
  retention: '7 years', // 7 yıl saklama
  
  logFormat: {
    timestamp: 'ISO 8601',
    userId: 'string',
    action: 'string',
    resource: 'string',
    ipAddress: 'string',
    userAgent: 'string',
    changes: 'json'
  }
};
```

**GDPR / KVKK Compliance**
```javascript
const dataPrivacy = {
  userDataExport: true, // Kullanıcı kendi verisini export edebilir
  rightToBeForgotten: true, // Kullanıcı hesap silme hakkı
  dataAnonymization: true, // İstatistiklerde kişisel veri anonimleştir
  
  consentManagement: {
    explicit: true,
    withdrawable: true,
    auditable: true
  }
};
```

---

### 8. VERİTABANI TASARIMI (Ölçeklenebilir)

#### Database Sharding Stratejisi (5000+ kullanıcı için)

```sql
-- Ana Database: Master (Write operations)
-- Replica Databases: Slave 1, Slave 2 (Read operations)

-- Sharding Key: company_id
-- Her şirket için ayrı shard (gerekirse)

-- Indexes (Performance için)
CREATE INDEX idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX idx_suggestions_status ON suggestions(status);
CREATE INDEX idx_suggestions_created_at ON suggestions(created_at);
CREATE INDEX idx_suggestions_company_dept ON suggestions(company_id, department_id);

CREATE INDEX idx_approval_workflow_suggestion ON approval_workflow(suggestion_id);
CREATE INDEX idx_approval_workflow_approver ON approval_workflow(approver_id);
CREATE INDEX idx_approval_workflow_status ON approval_workflow(status);

-- Full-text search indexes
CREATE FULLTEXT INDEX idx_suggestions_fulltext ON suggestions(title, current_situation, solution_proposal);
```

#### Connection Pooling
```javascript
const dbConfig = {
  pool: {
    min: 10,
    max: 100, // 5000 kullanıcı için
    acquireTimeout: 30000,
    idleTimeout: 10000
  },
  
  replication: {
    read: ['slave1', 'slave2'],
    write: 'master'
  }
};
```

#### Backup Strategy
```javascript
const backupStrategy = {
  full: {
    frequency: 'daily',
    time: '02:00',
    retention: '30 days'
  },
  
  incremental: {
    frequency: 'hourly',
    retention: '7 days'
  },
  
  pointInTimeRecovery: true, // Son 7 gün için
  
  storage: {
    primary: 'aws-s3',
    secondary: 'local-nas' // Disaster recovery
  }
};
```

---

### 9. PERFORMANS OPTİMİZASYONU

#### Caching Strategy
```javascript
const cacheLayers = {
  // L1: Browser Cache
  browser: {
    static: '1 year', // CSS, JS, images
    api: '5 minutes'
  },
  
  // L2: CDN Cache
  cdn: {
    static: '1 year',
    api: '1 hour'
  },
  
  // L3: Redis Cache
  redis: {
    session: '30 minutes',
    userData: '15 minutes',
    reports: '1 hour',
    lookupData: '24 hours' // Şirket, departman listesi vb
  },
  
  // L4: Database Query Cache
  database: {
    enabled: true,
    timeout: '5 minutes'
  }
};
```

#### Load Balancing
```
┌──────────────────────────────────────────┐
│         Load Balancer (Nginx)            │
│         SSL Termination                  │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌──────▼─────┐
│  App       │   │  App       │
│  Server 1  │   │  Server 2  │
│  (Node.js) │   │  (Node.js) │
└──────┬─────┘   └──────┬─────┘
       │                │
       └───────┬────────┘
               │
        ┌──────▼─────┐
        │  Database  │
        │  (Master)  │
        └──────┬─────┘
               │
        ┌──────┴─────────┐
        │                │
  ┌─────▼────┐    ┌─────▼────┐
  │ Database │    │ Database │
  │ (Slave1) │    │ (Slave2) │
  └──────────┘    └──────────┘
```

#### API Rate Limiting
```javascript
const rateLimits = {
  // User rate limits
  user: {
    perMinute: 60,
    perHour: 1000
  },
  
  // Admin rate limits
  admin: {
    perMinute: 120,
    perHour: 5000
  },
  
  // Public API (opsiyonel)
  public: {
    perMinute: 10,
    perHour: 100
  },
  
  // File upload limits
  fileUpload: {
    perDay: 50,
    totalSizePerDay: 100 * 1024 * 1024 // 100MB
  }
};
```

---

### 10. MONİTORİNG & ANALYTICS

#### System Monitoring
```javascript
const monitoringMetrics = {
  // Application Metrics
  application: [
    'request_count',
    'response_time',
    'error_rate',
    'active_users',
    'cpu_usage',
    'memory_usage'
  ],
  
  // Business Metrics
  business: [
    'daily_new_suggestions',
    'approval_rate',
    'average_approval_time',
    'top_performing_departments',
    'suggestion_completion_rate'
  ],
  
  // Alerts
  alerts: {
    errorRate: {
      threshold: 5, // % error rate
      action: 'email_devops'
    },
    responseTime: {
      threshold: 1000, // ms
      action: 'slack_notification'
    },
    diskSpace: {
      threshold: 80, // %
      action: 'email_admin'
    }
  }
};
```

#### Analytics Dashboard (Admin)
```
┌────────────────────────────────────────────────────┐
│             SYSTEM ANALYTICS                        │
├────────────────────────────────────────────────────┤
│                                                     │
│ Sistem Sağlığı:  ⚫ Online  │ Uptime: 99.8%        │
│                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│ │ Aktif       │ │ Bugün       │ │ Bu Ay       │  │
│ │ Kullanıcı   │ │ Öneri       │ │ Toplam      │  │
│ │   485       │ │    45       │ │   1,245     │  │
│ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                     │
│ API Performance:                                   │
│ ├─ Avg Response Time: 245ms                       │
│ ├─ Request/sec: 125                               │
│ └─ Error Rate: 0.2%                               │
│                                                     │
│ Database:                                          │
│ ├─ Connections: 45/100                            │
│ ├─ Query Time: 15ms avg                           │
│ └─ Slow Queries: 2                                │
│                                                     │
│ [Detaylı Metrikler] [Loglar] [Alarmlar]           │
└────────────────────────────────────────────────────┘
```

---

### 11. DEPLOYMENT & CI/CD

#### Deployment Mimarisi
```
Development → Staging → Production

Environments:
├─ Development (Local)
├─ Staging (Test Server)
│   ├─ Database: Test Data
│   ├─ Email: Mock emails
│   └─ Users: Limited test users
│
└─ Production
    ├─ Database: Master + 2 Replicas
    ├─ App Servers: 2+ instances
    ├─ Redis: Cluster mode
    ├─ S3: Production bucket
    └─ Monitoring: Full monitoring
```

#### CI/CD Pipeline
```yaml
# GitHub Actions / GitLab CI örnek
stages:
  - test
  - build
  - deploy

test:
  - npm run lint
  - npm run test:unit
  - npm run test:integration
  - Security scan (npm audit)

build:
  - Docker build
  - Push to registry
  
deploy_staging:
  - Deploy to staging
  - Run smoke tests
  - Manual approval required

deploy_production:
  - Blue-Green deployment
  - Health check
  - Rollback on failure
```

#### Database Migration Strategy
```javascript
// Zero-downtime migrations
const migrationStrategy = {
  type: 'rolling',
  steps: [
    '1. Add new column (nullable)',
    '2. Backfill data',
    '3. Make column non-nullable',
    '4. Update application code',
    '5. Remove old column'
  ],
  
  rollback: {
    automatic: true,
    condition: 'error_rate > 1%'
  }
};
```

---

### 12. TESTING STRATEJİSİ

#### Test Coverage
```javascript
const testingPlan = {
  unit: {
    coverage: 80, // %
    framework: 'Jest',
    focus: 'Business logic, utilities'
  },
  
  integration: {
    coverage: 60, // %
    framework: 'Jest + Supertest',
    focus: 'API endpoints'
  },
  
  e2e: {
    framework: 'Playwright / Cypress',
    scenarios: [
      'User login flow',
      'Create suggestion',
      'Approve suggestion',
      'Generate report'
    ]
  },
  
  performance: {
    tool: 'k6 / Artillery',
    scenarios: [
      'Load test: 1000 concurrent users',
      'Stress test: 2000 concurrent users',
      'Spike test: Sudden traffic increase'
    ]
  },
  
  security: {
    tools: [
      'OWASP ZAP',
      'SonarQube',
      'npm audit'
    ]
  }
};
```

---

### 13. GELİŞTİRME ADIMLARI (Detaylı Timeline)

#### Faz 1: MVP (8-10 Hafta)

**Hafta 1-2: Altyapı**
- [ ] Proje kurulumu
- [ ] Database tasarımı
- [ ] Authentication sistemi
- [ ] Temel API endpoints

**Hafta 3-4: Öneri Modülü**
- [ ] Öneri verme formu
- [ ] Form validasyonları
- [ ] Dosya yükleme
- [ ] Taslak kaydetme

**Hafta 5-6: Onay Sistemi**
- [ ] Komite değerlendirme ekranı
- [ ] Basit onay akışı (tek seviye)
- [ ] Email bildirimleri

**Hafta 7-8: Raporlama**
- [ ] Temel raporlar
- [ ] Dashboard
- [ ] Excel export

**Hafta 9-10: Test & Deployment**
- [ ] UAT (User Acceptance Testing)
- [ ] Bug fixing
- [ ] Production deployment

#### Faz 2: Gelişmiş Özellikler (6-8 Hafta)

**Hafta 11-12:**
- [ ] Çoklu seviye onay süreci
- [ ] Proje lideri modülü
- [ ] Gelişmiş email şablonları

**Hafta 13-14:**
- [ ] Gelişmiş raporlama
- [ ] Grafikler ve analitik
- [ ] PDF export

**Hafta 15-16:**
- [ ] Benzer öneri tespiti
- [ ] Tarihçe modülü
- [ ] Performance optimizasyonları

**Hafta 17-18:**
- [ ] Admin paneli
- [ ] Sistem ayarları
- [ ] Audit logging

#### Faz 3: Mobil & Ek Özellikler (4-6 Hafta)

**Hafta 19-20:**
- [ ] PWA özellikleri
- [ ] Push notifications
- [ ] Offline mode

**Hafta 21-22:**
- [ ] Mobil UI optimizasyonları
- [ ] React Native hazırlık

**Hafta 23-24:**
- [ ] Gamification
- [ ] AI önerileri (opsiyonel)

---

### 14. PROJE EKİBİ ÖNERİSİ

```
Minimum Ekip (MVP için):
├─ Backend Developer (2 kişi)
├─ Frontend Developer (2 kişi)
├─ UI/UX Designer (1 kişi, part-time)
├─ QA Engineer (1 kişi)
├─ DevOps Engineer (1 kişi, part-time)
└─ Project Manager (1 kişi)

Total: 6-7 kişi, 10-12 hafta

İdeal Ekip (Tüm fazlar):
├─ Backend Developer (3 kişi)
├─ Frontend Developer (3 kişi)
├─ Mobile Developer (1 kişi, Faz 3'te)
├─ UI/UX Designer (1 kişi)
├─ QA Engineer (2 kişi)
├─ DevOps Engineer (1 kişi)
├─ Product Owner (1 kişi)
└─ Project Manager (1 kişi)

Total: 10-12 kişi, 24 hafta
```

---

### 15. MALİYET TAHMİNİ (Yaklaşık)

```
Geliştirme Maliyeti:
├─ Yazılım Geliştirme (6 ay): $120,000 - $180,000
├─ UI/UX Tasarım: $15,000 - $25,000
├─ QA & Testing: $20,000 - $30,000
└─ Project Management: $15,000 - $20,000

Infrastructure (Yıllık):
├─ Cloud Hosting (AWS/Azure): $12,000 - $24,000/yıl
├─ Database: Dahil
├─ CDN & Storage: $3,000 - $6,000/yıl
├─ Email Service: $2,400 - $4,800/yıl
├─ Monitoring Tools: $3,600 - $6,000/yıl
└─ SSL & Domain: $500 - $1,000/yıl

Maintenance (Yıllık):
├─ Bug fixes & updates: $30,000 - $50,000/yıl
├─ Server maintenance: Dahil
└─ Feature additions: $20,000 - $40,000/yıl

TOPLAM İLK YIL: $220,000 - $350,000
Sonraki Yıllar: $70,000 - $120,000/yıl
```

---

### 16. BAŞARI KRİTERLERİ (KPI)

```javascript
const successMetrics = {
  adoption: {
    target: '80% kullanıcı aktivasyonu (ilk 6 ay)',
    measure: 'Aktif kullanıcı / Toplam çalışan'
  },
  
  engagement: {
    target: 'Çalışan başına yıllık 2+ öneri',
    measure: 'Toplam öneri / Toplam çalışan'
  },
  
  efficiency: {
    target: 'Ortalama onay süresi < 5 gün',
    measure: 'Öneri tarih - Tamamlanma tarih'
  },
  
  quality: {
    target: 'Onay oranı > 60%',
    measure: 'Onaylanan öneri / Toplam öneri'
  },
  
  impact: {
    target: 'Yıllık $500K+ kazanç',
    measure: 'Gerçekleşen kazançlar toplamı'
  },
  
  technical: {
    uptime: '>99.5%',
    responseTime: '<500ms',
    errorRate: '<0.5%'
  }
};
```

---

### 17. RİSKLER VE AZALTMA STRATEJİLERİ

```
Risk 1: Düşük kullanıcı adaptasyonu
Azaltma:
├─ Kapsamlı eğitim programı
├─ Kullanıcı dostu arayüz
├─ Gamification (ödül sistemi)
└─ Sürekli kullanıcı feedback toplama

Risk 2: Performans sorunları (5000 kullanıcı)
Azaltma:
├─ Horizontal scaling hazırlığı
├─ Caching katmanları
├─ Database optimization
└─ Load testing (prod öncesi)

Risk 3: Veri kaybı
Azaltma:
├─ Günlük otomatik backup
├─ Point-in-time recovery
├─ Geographic redundancy
└─ Disaster recovery planı

Risk 4: Güvenlik açıkları
Azaltma:
├─ Regular security audits
├─ Penetration testing
├─ OWASP best practices
└─ Security training for devs

Risk 5: Email delivery sorunları
Azaltma:
├─ Çoklu email provider (fallback)
├─ Queue sistemi
├─ Retry mekanizması
└─ In-app notifications (yedek)
```

---

### 18. SONUÇ VE ÖNERİLER

#### Kritik Başarı Faktörleri

1. **Kullanıcı Deneyimi (UX)**
   - Basit, sezgisel arayüz
   - Mobil uyumlu
   - Hızlı yanıt süreleri
   - Minimum adım sayısı

2. **Güvenilirlik**
   - %99.5+ uptime
   - Veri kaybı yok
   - Yedekleme stratejisi

3. **Ölçeklenebilirlik**
   - 5000 → 10,000 kullanıcıya büyüme hazırlığı
   - Horizontal scaling
   - Performans optimizasyonu

4. **Güvenlik**
   - Enterprise-grade security
   - KVKK/GDPR compliance
   - Audit logging

5. **Entegrasyon**
   - HR sistemi (çalışan verileri)
   - Email sistemi
   - Gelecekte: ERP, CRM

#### Öncelikli Geliştirme Sırası

```
Mutlaka Olmalı (MVP):
1. ✅ Login & Authentication
2. ✅ Öneri verme
3. ✅ Komite değerlendirme
4. ✅ Basit onay süreci
5. ✅ Email bildirimleri
6. ✅ Temel raporlar

İyi Olur (Faz 2):
7. ✅ Çoklu seviye onay
8. ✅ Proje yönetimi
9. ✅ Gelişmiş raporlama
10. ✅ Dashboard analytics

Gelecek (Faz 3):
11. ⭐ Mobil app
12. ⭐ AI önerileri
13. ⭐ Gamification
14. ⭐ Advanced analytics
```

---

## EKLER

### Ek A: API Endpoint Listesi (Tüm)

```
Authentication:
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

Users:
GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/change-password
GET    /api/users/notifications
PUT    /api/users/notifications/:id/read

Suggestions:
POST   /api/suggestions
GET    /api/suggestions
GET    /api/suggestions/:id
PUT    /api/suggestions/:id
DELETE /api/suggestions/:id
GET    /api/suggestions/my-suggestions
POST   /api/suggestions/:id/documents
DELETE /api/suggestions/:id/documents/:docId

Committee:
GET    /api/committee/pending
GET    /api/committee/evaluated
POST   /api/committee/evaluate/:id
PUT    /api/committee/assign-project/:id

Approvals:
GET    /api/approvals/pending
GET    /api/approvals/history
POST   /api/approvals/:id/approve
POST   /api/approvals/:id/reject

Projects:
GET    /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id/progress
PUT    /api/projects/:id/complete

Reports:
GET    /api/reports/general
GET    /api/reports/by-status
GET    /api/reports/by-department
GET    /api/reports/by-user
GET    /api/reports/dashboard
GET    /api/reports/export/excel
GET    /api/reports/export/pdf

Admin:
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/roles
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/logs
```

### Ek B: Email Şablon Değişkenleri

```handlebars
{{çalışan_adı}}              - İsim
{{çalışan_adı_soyadı}}       - İsim Soyisim
{{sicil_no}}                 - Sicil numarası
{{öneri_konusu}}             - Öneri başlığı
{{öneri_id}}                 - Öneri ID
{{firma_adı}}                - Şirket adı
{{müdürlük}}                 - Müdürlük
{{şeflik}}                   - Şeflik
{{durum}}                    - Mevcut durum
{{durum_renk}}               - Durum rengi (CSS)
{{oluşturma_tarihi}}         - Oluşturulma tarihi
{{güncelleme_tarihi}}        - Son güncelleme
{{onay_veren}}               - Onaylayan kişi
{{red_açıklaması}}           - Red sebebi
{{güncelleme_açıklaması}}    - Güncelleme talebi
{{proje_lideri_adı}}         - Atanan proje lideri
{{öneri_detay_link}}         - Detay sayfası linki
{{dashboard_link}}           - Dashboard linki
{{system_logo_url}}          - Logo URL
{{company_signature}}        - Şirket imzası
```

---

**SON NOTLAR:**

Bu prompt, 5000 kişilik bir şirkette kullanılacak enterprise-grade bir öneri yönetim sistemi için gerekli tüm detayları içermektedir. Sistem:

✅ Ölçeklenebilir (5000 → 10000+ kullanıcı)  
✅ Güvenli (Enterprise security)  
✅ Performanslı (<500ms response)  
✅ Mobil uyumlu (PWA + gelecekte native app)  
✅ Kapsamlı email sistemi (6+ şablon)  
✅ Detaylı raporlama  
✅ KVKK/GDPR uyumlu  

**Önerilen Yaklaşım:** MVP ile başlayın (10-12 hafta), kullanıcı feedback'i toplayın, iteratif geliştirin.

Başarılar dilerim! 🚀
