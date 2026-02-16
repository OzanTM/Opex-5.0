# OpEx 5.0 Monitoring ve Alarm Plani

Bu dokuman Faz 3 icin minimum izleme/alarm kapsamını tanimlar.

## 1. Hedef SLO'lar

- API availability: %99.5+
- p95 API response: < 500ms
- Kritik endpoint hata orani: < %1

## 2. Izlenecek Temel Metrikler

### Uygulama
- Health endpoint durumu (`/api/v1/health`)
- 5xx hata sayisi/orani
- Ortalama ve p95 response suresi
- Login basarisizlik orani

### Altyapi
- PostgreSQL baglanti hatalari
- Redis baglanti hatalari
- CPU / memory kullanimi (backend, frontend, db, redis)
- Disk doluluk (log + backup dizinleri)

### Is Akisi
- Pending approval sayisi
- Committee queue birikimi
- Export endpoint hata sayisi (`/reports/export/excel`, `/reports/export/pdf`)

## 3. Alarm Kurallari (Baslangic Seti)

- Health check 2 dk boyunca fail -> P1 alarm
- 5xx error rate > %3 (5 dk) -> P1 alarm
- p95 response > 1.5 sn (10 dk) -> P2 alarm
- DB baglanti hatasi ard arda 3 kez -> P1 alarm
- Redis baglanti hatasi ard arda 3 kez -> P2 alarm

## 4. Operasyonel Kontrol Komutu

Temel ayakta olma kontrolu:

```bash
cd /Users/Ozan/Documents/opex-5.0
make ops-health-check
```

## 5. Dashboard Onerisi

Tek panelde en az:
- API availability (1h / 24h)
- 5xx oran trendi
- p95 response
- DB/Redis status
- Son 20 kritik log kaydi

## 6. Alarm Sonrasi Aksiyon

1. Incident kaydi ac.
2. Etki alani belirle (frontend, backend, db, redis).
3. Gerekirse rollback calistir (`docs/rollback-runbook.md`).
4. Kök neden analizi ve kalici aksiyon cikart.
