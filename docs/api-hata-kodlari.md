# OpEx 5.0 API Hata Kodlari ve Ornek Response

Bu dokuman, backend API tarafinda donen standart hata formatini ve uygulamada
kullanilan temel hata kodlarini ozetler.

## 1. Standart Hata Formati

Tum hata response'lari asagidaki genel yapiyi kullanir:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {}
  }
}
```

Notlar:
- `message`: istemciye gosterilebilecek ozet mesaj.
- `error.code`: programatik kontrol icin stabil kod.
- `error.details`: opsiyonel ek alan/dogrulama bilgisi.

## 2. Temel (Global) Hata Kodlari

| HTTP | code | Anlam |
|---|---|---|
| 400 | `BAD_REQUEST` | Gecersiz istek |
| 401 | `UNAUTHORIZED` | Kimlik dogrulama yok/gecersiz |
| 403 | `FORBIDDEN` | Yetki yetersiz |
| 404 | `NOT_FOUND` | Kaynak bulunamadi |
| 409 | `CONFLICT` | Is kurali cakismasi |
| 422 | `VALIDATION_ERROR` | Alan dogrulama hatasi |
| 429 | `TOO_MANY_REQUESTS` | Rate limit asildi |
| 500 | `INTERNAL_ERROR` | Beklenmeyen sunucu hatasi |

## 3. Alana Ozel Hata Kodlari

Asagidaki kodlar modullere ozel olarak doner:

### Auth
- `ACCOUNT_LOCKED` (423)
- `ACCOUNT_SUSPENDED` (403)
- `ACCOUNT_INACTIVE` (403)
- `LOGIN_ERROR` (500)
- `REFRESH_ERROR` (500)
- `LOGOUT_ERROR` (500)
- `PASSWORD_CHANGE_ERROR` (500)
- `PASSWORD_RESET_ERROR` (500)
- `PROFILE_ERROR` (500)

### Suggestions
- `CREATE_ERROR` (500)
- `SUBMIT_ERROR` (500)
- `GET_ERROR` (500)
- `UPDATE_ERROR` (500)
- `DELETE_ERROR` (500)
- `REVIEW_ERROR` (500)
- `APPROVE_ERROR` (500)
- `REJECT_ERROR` (500)

### Middleware / Permission
- `RATE_LIMIT_EXCEEDED` (429)
- `FORBIDDEN` (403)

## 4. Ornekler

### 4.1 Kimlik Yok (401)

```json
{
  "success": false,
  "message": "No token provided",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

### 4.2 Yetki Yok (403)

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 4.3 Dogrulama Hatasi (422)

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error",
    "details": {
      "field": "title",
      "issue": "Required"
    }
  }
}
```

### 4.4 Is Kurali Hatasi (400/409)

```json
{
  "success": false,
  "message": "This step has already been processed",
  "error": {
    "code": "BAD_REQUEST",
    "message": "This step has already been processed"
  }
}
```

## 5. Referanslar

- OpenAPI JSON: `GET /api-docs.json`
- Swagger UI: `GET /api-docs`
- OpenAPI kaynak dosyasi: `/Users/Ozan/Documents/opex-5.0/backend/src/docs/openapi.ts`
- Response helper: `/Users/Ozan/Documents/opex-5.0/backend/src/utils/response.ts`
