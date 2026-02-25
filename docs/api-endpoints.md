# واجهة API للخادم — وصفاتي

## نظرة عامة

خادم Express 5 يوفر واجهة REST API للتواصل مع تطبيق الموبايل.

**عنوان القاعدة:** `http://localhost:4000`

---

## المصادقة (`/account`)

### تسجيل مستخدم جديد

```
POST /account/register
Content-Type: application/json
```

**الجسم:**

```json
{
  "name": "اسم المستخدم",
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**الاستجابة (201):**

```json
{
  "data": {
    "id": 1,
    "name": "اسم المستخدم",
    "email": "user@example.com"
  }
}
```

---

### تسجيل الدخول

```
POST /account/login
Content-Type: application/json
```

**الجسم:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**الاستجابة (200):**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## المنشورات (`/posts`)

### عرض جميع المنشورات (عام)

```
GET /posts
```

**الاستجابة (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "وصفة الكبسة",
      "content": "تفاصيل الوصفة...",
      "userId": 1,
      "User": { "id": 1, "name": "اسم المستخدم" }
    }
  ]
}
```

---

### إنشاء منشور 🔒

```
POST /posts
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data
```

**الحقول:**

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `title` | نص | عنوان الوصفة |
| `content` | نص | محتوى الوصفة |
| `country` | نص | البلد |
| `region` | نص | المنطقة |
| `files` | ملفات | صور الوصفة (اختياري) |

**الاستجابة (201):** المنشور المنشأ

---

### تحديث منشور 🔒 (المالك فقط)

```
PUT /posts/:id
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**الجسم:**

```json
{
  "title": "عنوان محدّث",
  "content": "محتوى محدّث"
}
```

**الاستجابة (200):** المنشور المحدَّث

---

### حذف منشور 🔒 (المالك فقط)

```
DELETE /posts/:id
Authorization: Bearer JWT_TOKEN
```

**الاستجابة (204):** بدون محتوى

---

## التعليقات (`/posts/:postId/comments`)

### عرض تعليقات منشور

```
GET /posts/:postId/comments
```

**الاستجابة (200):**

```json
{
  "data": [
    {
      "id": 1,
      "text": "وصفة رائعة!",
      "userId": 2,
      "postId": 1,
      "User": { "name": "المستخدم" }
    }
  ]
}
```

---

### إضافة تعليق 🔒

```
POST /posts/:postId/comments
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**الجسم:**

```json
{
  "text": "هذه الوصفة مذهلة!"
}
```

**الاستجابة (201):** التعليق المنشأ

---

### تحديث تعليق 🔒 (المالك فقط)

```
PUT /comments/:id
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**الجسم:**

```json
{
  "text": "نص التعليق المحدَّث"
}
```

**الاستجابة (200):** التعليق المحدَّث

---

### حذف تعليق 🔒 (المالك فقط)

```
DELETE /comments/:id
Authorization: Bearer JWT_TOKEN
```

**الاستجابة (204):** بدون محتوى

---

## الإعجابات (`/posts/:postId/likes`)

### عدد الإعجابات

```
GET /posts/:postId/likes
```

**الاستجابة (200):**

```json
{
  "data": {
    "count": 5
  }
}
```

---

### تبديل الإعجاب 🔒

```
POST /posts/:postId/like
Authorization: Bearer JWT_TOKEN
```

**الاستجابة (200):**

```json
{
  "data": {
    "action": "liked",
    "count": 6
  }
}
```

> القيمة `action` تكون إما `"liked"` أو `"unliked"`.

---

## أكواد الأخطاء

| الكود | الوصف | متى يحدث |
|-------|-------|-----------|
| 200 | ناجح | GET/PUT ناجح |
| 201 | تم الإنشاء | POST لمورد جديد |
| 204 | بدون محتوى | DELETE ناجح |
| 400 | خطأ في المدخلات | فشل التحقق |
| 401 | غير مصرح | token مفقود أو غير صالح |
| 403 | محظور | لا تملك صلاحية |
| 404 | غير موجود | المورد غير موجود |
| 500 | خطأ الخادم | خطأ داخلي |

### هيكل رسائل الخطأ

**غير مصرح (401):**
```json
{
  "message": "No token provided or invalid token"
}
```

**خطأ في المدخلات (400):**
```json
{
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## الاختبار اليدوي

### بـ cURL

**1. تسجيل:**
```bash
curl -X POST http://localhost:4000/account/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'
```

**2. دخول:**
```bash
curl -X POST http://localhost:4000/account/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

**3. إنشاء منشور:**
```bash
curl -X POST http://localhost:4000/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"وصفتي","content":"تعليمات الوصفة"}'
```

**4. عرض المنشورات:**
```bash
curl http://localhost:4000/posts
```

---

## ملاحظات التنفيذ

- جميع البيانات بصيغة **JSON**
- المصادقة تستخدم **JWT Bearer tokens**
- المسارات المحمية 🔒 تتطلب `Authorization: Bearer TOKEN`
- جميع عمليات البيانات تستخدم **Repository Pattern** للتجريد
- الاختبارات الشاملة تغطي جميع نقاط النهاية في `tests/integration.test.js`
