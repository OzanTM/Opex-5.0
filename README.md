# OpEx 5.0 - Kurumsal Öneri Yönetim Sistemi

## 📋 Proje Özeti

OpEx 5.0, 5000+ çalışan kapasiteli kurumsal şirketler için tasarlanmış kapsamlı bir öneri yönetim sistemidir. Sistem, çalışanların önerilerini sistematik bir şekilde sunmasını, değerlendirilmesini ve uygulanmasını sağlar.

### 🎯 Temel Özellikler

- **Rol Bazlı Erişim Kontrolü**: 6 farklı kullanıcı rolü (Kullanıcı, Admin, Komite Sorumlusu, Komite Üyesi, Onaylayan, Proje Lideri)
- **Çok Aşamalı Onay Süreci**: Hiyerarşik onay akışı (Şef → Müdür → Fabrika Müdürü → GMY)
- **Email Bildirim Sistemi**: 8+ özelleştirilebilir email şablonu
- **Kapsamlı Raporlama**: Personel, departman ve şirket bazlı raporlar
- **Mobil Uyumlu Tasarım**: PWA desteği ile mobil öncelikli tasarım
- **Ölçeklenebilir Mimari**: 5000+ kullanıcı için optimize edilmiş

## 🏗️ Teknoloji Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ (Master-Slave Replication)
- **ORM**: Prisma
- **Cache**: Redis
- **Queue**: Bull (Redis tabanlı)
- **Auth**: JWT + bcrypt

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod

### DevOps
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Winston (logging)

## 📁 Proje Yapısı

```
opex-5.0/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Konfigürasyon
│   │   ├── controllers/       # API Controllers
│   │   ├── middleware/        # Express Middleware
│   │   ├── models/            # Prisma Models
│   │   ├── routes/            # API Routes
│   │   ├── services/          # Business Logic
│   │   ├── types/             # TypeScript Types
│   │   ├── utils/             # Utility Functions
│   │   └── index.ts           # Entry Point
│   ├── prisma/
│   │   └── schema.prisma      # Database Schema
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                   # Frontend App
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # React Components
│   │   ├── hooks/             # Custom Hooks
│   │   ├── lib/               # API Client & Utils
│   │   ├── store/             # Zustand Store
│   │   ├── styles/            # Global Styles
│   │   └── types/             # TypeScript Types
│   ├── package.json
│   └── Dockerfile
│
├── docker/                     # Docker Config
│   └── docker-compose.yml
│
└── docs/                       # Dokümantasyon
```

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (opsiyonel)

### Geliştirme Ortamı

1. **Repoyu klonlayın:**
```bash
git clone <repo-url>
cd opex-5.0
```

2. **Backend kurulumu:**
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

3. **Frontend kurulumu:**
```bash
cd frontend
npm install
npm run dev
```

4. **Docker ile kurulum:**
```bash
cd docker
docker-compose up -d
```

### Environment Variables

Backend `.env` dosyası:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/opex_db"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
SENDGRID_API_KEY=your-sendgrid-key
FRONTEND_URL=http://localhost:3000
```

## 📊 Database Şeması

### Ana Tablolar
- **users**: Kullanıcı bilgileri ve rolleri
- **companies**: Şirket yapısı
- **departments**: Müdürlükler
- **units**: Şeflikler
- **suggestions**: Öneriler
- **approval_workflows**: Onay akışları
- **approval_steps**: Onay adımları
- **projects**: Projeler
- **notifications**: Bildirimler
- **audit_logs**: Denetim kayıtları

## 🔐 Kullanıcı Rolleri

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| USER | Standart Çalışan | Öneri oluşturma, görüntüleme |
| ADMIN | Sistem Yöneticisi | Tam yetki |
| COMMITTEE_MANAGER | Komite Sorumlusu | Öneri değerlendirme, kategorize etme |
| COMMITTEE_MEMBER | Komite Üyesi | Öneri görüntüleme, görüş bildirme |
| APPROVER | Onaylayan (Müdür+) | Onay/ret yetkisi |
| PROJECT_LEADER | Proje Lideri | Proje yönetimi |

## 📧 Email Şablonları

1. **SUGGESTION_SUBMITTED**: Öneri alındı bildirimi
2. **SUGGESTION_COMMITTEE_APPROVED**: Komite onayı
3. **SUGGESTION_REVISION_REQUESTED**: Güncelleme talebi
4. **SUGGESTION_COMMITTEE_REJECTED**: Komite reddi
5. **SUGGESTION_APPROVER_REJECTED**: Müdür reddi
6. **SUGGESTION_FULLY_APPROVED**: Tam onay
7. **SUGGESTION_COMPLETED**: Proje tamamlandı
8. **APPROVAL_REMINDER**: Onay hatırlatma

## 🔌 API Endpoints

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/change-password
GET  /api/v1/auth/me
```

### Suggestions
```
GET    /api/v1/suggestions
GET    /api/v1/suggestions/my
GET    /api/v1/suggestions/:id
POST   /api/v1/suggestions
PUT    /api/v1/suggestions/:id
DELETE /api/v1/suggestions/:id
POST   /api/v1/suggestions/:id/submit
POST   /api/v1/suggestions/:id/committee-review
POST   /api/v1/suggestions/:id/approve
POST   /api/v1/suggestions/:id/reject
```

### Reports (Export)
```
GET /api/v1/reports/export/excel
GET /api/v1/reports/export/pdf
```

### API Documentation (Swagger)
```
GET /api-docs
GET /api-docs.json
```

Ek dokumanlar:
- `docs/api-hata-kodlari.md`
- `docs/deployment-runbook.md`
- `docs/rollback-runbook.md`
- `docs/backup-restore.md`
- `docs/domain-ssl-runbook.md`
- `docs/rol-bazli-kullanim-kilavuzu.md`
- `docs/production-env-secrets.md`
- `docs/monitoring-alert-plan.md`
- `docs/incident-response-runbook.md`

## 📈 Performans Hedefleri

- **API Response**: < 500ms
- **Sayfa Yükleme**: < 2 saniye
- **Eşzamanlı Kullanıcı**: 500-1000
- **Uptime**: %99.5

## 🧪 Test

```bash
# Backend testleri
cd backend
npm run test

# Frontend testleri
cd frontend
npm run test

# Performans smoke (p95/p99)
cd /Users/Ozan/Documents/opex-5.0
make perf-smoke
```

## 🤖 GitHub Actions CI

Bu projede `.github/workflows/ci.yml` ile otomatik CI tanımlıdır.

- `push` ve `pull_request` olaylarında çalışır.
- **Backend job**: PostgreSQL + Redis servislerini ayağa kaldırır, Prisma migrate/seed yapar, ardından `build` ve `test` çalıştırır.
- **Frontend job**: `build` ve `test` çalıştırır.

Amaç: Her commit/PR için kodun derlenebilir ve testlerinin geçer durumda kalmasını sağlamak.

## 📝 Geliştirme Aşamaları

### Faz 1: MVP (8-10 Hafta)
- [x] Proje yapısı oluşturma
- [x] Database tasarımı
- [x] Authentication sistemi
- [x] Öneri modülü
- [x] Temel onay akışı
- [x] Email bildirimleri
- [ ] Temel dashboard
- [ ] Test ve deployment

### Faz 2: Gelişmiş Özellikler (6-8 Hafta)
- [ ] Çoklu seviye onay
- [ ] Proje yönetimi
- [ ] Gelişmiş raporlama
- [ ] Admin paneli

### Faz 3: Mobil & Ek Özellikler (4-6 Hafta)
- [ ] PWA optimizasyonu
- [ ] Push notifications
- [ ] Offline mode
- [ ] React Native app hazırlığı

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 İletişim

OpEx 5.0 Ekibi - destek@opex5.com

---

**Not**: Bu proje şu anda geliştirme aşamasındadır. Production kullanımı için tüm özelliklerin tamamlanmasını bekleyiniz.
