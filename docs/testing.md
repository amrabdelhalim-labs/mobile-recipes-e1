# دليل الاختبار - mobile-recipes-e1

هذا الدليل يشرح كيفية اختبار التطبيق محلياً باستخدام طلبات HTTP فعلية.

---

## المتطلبات الأساسية

### 1. تثبيت الأدوات

```bash
# تثبيت PostgreSQL
# قم بتحميل PostgreSQL من: https://www.postgresql.org/download/

# تثبيت Node.js v22.x
# قم بتحميل Node.js من: https://nodejs.org/

# تثبيت أداة لإرسال الطلبات (اختر واحدة):
# - Postman: https://www.postman.com/downloads/
# - Insomnia: https://insomnia.rest/download
# - Thunder Client (امتداد VS Code)
# - أو استخدم curl من Terminal
```

### 2. إعداد قاعدة البيانات

```bash
# تسجيل الدخول إلى PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات للتطوير
CREATE DATABASE mobile_recipes_dev;

# إنشاء مستخدم (اختياري)
CREATE USER recipes_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mobile_recipes_dev TO recipes_admin;

# الخروج
\q
```

### 3. إعداد البيئة

```bash
# الانتقال إلى مجلد الخادم
cd server

# نسخ ملف البيئة
cp .env.example .env

# تحرير الملف وتعديل القيم:
# - DB_HOST=localhost
# - DB_NAME=mobile_recipes_dev
# - DB_USER=postgres
# - DB_PASSWORD=your_password
# - JWT_SECRET=your_32_char_secret_here
# - STORAGE_TYPE=local (للاختبار المحلي)
```

### 4. تثبيت الاعتماديات

```bash
# في مجلد server/
npm install

# التحقق من عدم وجود ثغرات أمنية
npm audit

# إصلاح الثغرات إن وجدت
npm audit fix
```

---

## بدء الخادم

```bash
# في مجلد server/
npm run dev

# يجب أن ترى رسالة:
# Server is running on port 3000
# Database connected successfully
```

---

## اختبار الوظائف

### 1. اختبار الصحة (Health Check)

```bash
# باستخدام curl
curl http://localhost:3000/health

# النتيجة المتوقعة:
{
  "status": "OK",
  "message": "Server is running",
  "environment": "development",
  "timestamp": "2026-02-22T10:30:00.000Z"
}
```

---

## اختبار المستخدمين

### 1. تسجيل مستخدم جديد

**الطلب:**
```http
POST http://localhost:3000/account/register
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmed@test.com",
  "password": "Test@123456"
}
```

**النتيجة المتوقعة:**
```json
{
  "message": "تم إنشاء الحساب بنجاح"
}
```

### 2. تسجيل الدخول

**الطلب:**
```http
POST http://localhost:3000/account/login
Content-Type: application/json

{
  "email": "ahmed@test.com",
  "password": "Test@123456"
}
```

**النتيجة المتوقعة:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ مهم:** احفظ الـ token لاستخدامه في الطلبات القادمة!

### 3. جلب الملف الشخصي

**الطلب:**
```http
GET http://localhost:3000/account/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

**النتيجة المتوقعة:**
```json
{
  "user": {
    "id": 1,
    "name": "أحمد محمد",
    "email": "ahmed@test.com",
    "ImageUrl": "/images/default-profile.svg",
    "createdAt": "2026-02-22T10:30:00.000Z",
    "updatedAt": "2026-02-22T10:30:00.000Z"
  }
}
```

### 4. تحديث صورة الملف الشخصي

**الطلب:**
```http
PUT http://localhost:3000/account/profile/image
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

• file: اختر صورة (JPG, PNG, WEBP < 5MB)
```

**النتيجة المتوقعة:**
```json
{
  "message": "تم تحديث صورة الملف الشخصي بنجاح",
  "user": {
    "id": 1,
    "name": "أحمد محمد",
    "ImageUrl": "/images/1708599000000-profile.jpg"
  }
}
```

**✅ التحقق:** افتح المتصفح وزر الرابط:
```
http://localhost:3000/images/1708599000000-profile.jpg
```

---

## اختبار المنشورات

### 1. إنشاء منشور بصور

**الطلب:**
```http
POST http://localhost:3000/posts/create
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

• title: كيكة الشوكولاتة
• content: وصفة سهلة ولذيذة لكيكة الشوكولاتة
• steps: ["امزج الطحين", "أضف البيض", "اخبز لمدة 30 دقيقة"]
• prepTime: 15
• cookTime: 30
• servings: 8
• images: اختر 2-3 صور
```

**ملاحظات:**
- يمكن إرسال steps كـ JSON array أو كـ string
- الصور اختيارية لكن يُنصح بإضافة صورة واحدة على الأقل

**النتيجة المتوقعة:**
```json
{
  "message": "تم إنشاء المنشور بنجاح",
  "post": {
    "id": 1,
    "title": "كيكة الشوكولاتة",
    "content": "وصفة سهلة...",
    "Post_Images": [
      {
        "id": 1,
        "imageUrl": "/images/1708599100000-0.jpg"
      },
      {
        "id": 2,
        "imageUrl": "/images/1708599100000-1.jpg"
      }
    ]
  }
}
```

### 2. جلب جميع المنشورات

**الطلب:**
```http
GET http://localhost:3000/posts?page=1&limit=10
```

**النتيجة المتوقعة:**
```json
{
  "posts": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalPosts": 1,
    "limit": 10
  }
}
```

### 3. تحديث منشور (حذف صور وإضافة جديدة)

**الطلب:**
```http
PUT http://localhost:3000/posts/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

• title: كيكة الشوكولاتة المحدثة
• deletedImages: [1] (IDs of images to delete)
• images: اختر صورة جديدة
```

**النتيجة المتوقعة:**
```json
{
  "message": "تم تحديث المنشور بنجاح",
  "post": {
    "id": 1,
    "title": "كيكة الشوكولاتة المحدثة",
    "Post_Images": [
      {
        "id": 2,
        "imageUrl": "/images/1708599100000-1.jpg"
      },
      {
        "id": 3,
        "imageUrl": "/images/1708599200000-0.jpg"
      }
    ]
  }
}
```

**✅ التحقق:**
- تأكد من حذف الصورة القديمة من `server/public/images/`
- تأكد من إضافة الصورة الجديدة

### 4. حذف منشور

**الطلب:**
```http
DELETE http://localhost:3000/posts/1
Authorization: Bearer YOUR_TOKEN_HERE
```

**النتيجة المتوقعة:**
```json
{
  "message": "تم حذف المنشور بنجاح"
}
```

**✅ التحقق:**
- تأكد من حذف جميع صور المنشور من `server/public/images/`
- تأكد من حذف المنشور من قاعدة البيانات

---

## اختبار التعليقات

### 1. إضافة تعليق

**الطلب:**
```http
POST http://localhost:3000/comments/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "text": "وصفة رائعة، شكراً للمشاركة!"
}
```

### 2. تحديث تعليق

**الطلب:**
```http
PUT http://localhost:3000/comments/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "text": "وصفة رائعة جداً!"
}
```

### 3. حذف تعليق

**الطلب:**
```http
DELETE http://localhost:3000/comments/1
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## اختبار الإعجابات

### 1. إضافة/إلغاء إعجاب

**الطلب:**
```http
POST http://localhost:3000/likes/1
Authorization: Bearer YOUR_TOKEN_HERE
```

**النتيجة المتوقعة:**
```json
{
  "message": "تم تسجيل الإعجاب",
  "isLiked": true,
  "likesCount": 1
}
```

### 2. جلب قائمة المعجبين

**الطلب:**
```http
GET http://localhost:3000/likes/1?page=1&limit=20
```

---

## اختبار معالجة الأخطاء

### 1. رفع ملف غير صورة

**الطلب:**
```http
POST http://localhost:3000/posts/create
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

• images: ملف PDF أو TXT
```

**النتيجة المتوقعة:**
```json
{
  "message": "يجب أن تكون الملفات من نوع صورة فقط!"
}
```

### 2. رفع صورة أكبر من 5MB

**النتيجة المتوقعة:**
```json
{
  "message": "File too large"
}
```

### 3. الوصول بدون token

**الطلب:**
```http
GET http://localhost:3000/account/profile
(بدون Authorization header)
```

**النتيجة المتوقعة:**
```json
{
  "message": "غير مصرح"
}
```

### 4. محاولة حذف منشور مستخدم آخر

**الطلب:**
```http
DELETE http://localhost:3000/posts/2
Authorization: Bearer USER1_TOKEN
(منشور يخص user2)
```

**النتيجة المتوقعة:**
```json
{
  "message": "غير مسموح بحذف هذا المنشور"
}
```

---

## اختبار Storage Service

### الاختبار مع Local Storage (افتراضي)

1. تأكد من `STORAGE_TYPE=local` في `.env`
2. قم بإنشاء منشور بصور
3. تحقق من وجود الصور في `server/public/images/`
4. احذف المنشور
5. تحقق من حذف الصور من المجلد

### الاختبار مع Cloudinary (اختياري)

1. سجل حساب مجاني في [Cloudinary](https://cloudinary.com/)
2. احصل على: Cloud Name, API Key, API Secret
3. حدّث `.env`:
```env
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mobile-recipes-dev
```
4. أعد تشغيل الخادم
5. قم بإنشاء منشور بصور
6. تحقق من رفع الصور إلى Cloudinary Dashboard
7. احذف المنشور وتحقق من حذف الصور من Cloudinary

---

## التنظيف بعد الاختبار

### 1. حذف بيانات الاختبار

```bash
# حذف جميع الصور المحلية
rm -rf server/public/images/*

# إعادة تعيين قاعدة البيانات
psql -U postgres -d mobile_recipes_dev

# حذف جميع البيانات
TRUNCATE TABLE "Users", "Posts", "Post_Images", "Comments", "Likes" CASCADE;

# أو إعادة إنشاء القاعدة من جديد
DROP DATABASE mobile_recipes_dev;
CREATE DATABASE mobile_recipes_dev;
```

### 2. حذف الحساب بالكامل (Cascade Delete)

**الطلب:**
```http
DELETE http://localhost:3000/account/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

**النتيجة:**
- حذف المستخدم
- حذف جميع المنشورات
- حذف جميع التعليقات
- حذف جميع الإعجابات
- حذف جميع الصور (من storage)

**✅ التحقق:**
- تحقق من حذف جميع الصور من `server/public/images/`
- تحقق من حذف السجلات من قاعدة البيانات

---

## مجموعة Postman

يمكنك استيراد المجموعة التالية إلى Postman:

```json
{
  "info": {
    "name": "mobile-recipes-e1 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Account",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{BASE_URL}}/account/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"Test@123\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{BASE_URL}}/account/login"
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:3000"
    },
    {
      "key": "TOKEN",
      "value": ""
    }
  ]
}
```

---

## نصائح للاختبار

### 1. استخدام المتغيرات

في Postman/Insomnia، احفظ الـ token في متغير:
```javascript
// في Tests tab بعد Login request
pm.environment.set("TOKEN", pm.response.json().token);
```

ثم استخدمه في الطلبات:
```
Authorization: Bearer {{TOKEN}}
```

### 2. اختبار تلقائي

يمكنك إضافة scripts للتحقق التلقائي:
```javascript
// في Tests tab
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has message", function () {
    pm.expect(pm.response.json()).to.have.property('message');
});
```

### 3. تنظيم البيانات

- استخدم أسماء واضحة للمستخدمين التجريبيين
- أضف prefix مثل `test_` للبيانات التجريبية
- احذف البيانات بعد الانتهاء

### 4. سجلات الخادم

راقب logs في Terminal أثناء الاختبار:
```bash
# سترى output مثل:
POST /account/register 201 - 145.234 ms
POST /account/login 200 - 98.456 ms
User registered: أحمد محمد ahmed@test.com
Upload images using Storage Service
Cleanup uploaded images on error
```

---

## حل المشكلات الشائعة

### مشكلة: Connection refused

**السبب:** الخادم غير مشغل  
**الحل:**
```bash
cd server
npm run dev
```

### مشكلة: Database connection failed

**السبب:** PostgreSQL غير مشغل أو إعدادات خاطئة  
**الحل:**
```bash
# Windows
services.msc → PostgreSQL → Start

# تحقق من .env
DB_HOST=localhost
DB_NAME=mobile_recipes_dev
DB_USER=postgres
DB_PASSWORD=your_correct_password
```

### مشكلة: Token expired

**السبب:** مر 30 يوم على إصدار الـ token  
**الحل:** سجل دخول مجدداً للحصول على token جديد

### مشكلة: File upload fails

**الأسباب المحتملة:**
1. الملف ليس صورة → تحقق من الامتداد
2. الملف أكبر من 5MB → ضغط الصورة
3. مشكلة في permissions → تحقق من صلاحيات مجلد `server/public/images/`

```bash
# حل مشكلة الصلاحيات
cd server/public
mkdir -p images
chmod 755 images
```

---

## قائمة التحقق الكاملة

- [ ] تثبيت PostgreSQL وإنشاء قاعدة بيانات
- [ ] تثبيت Node.js v22.x
- [ ] نسخ .env.example إلى .env وتعديل القيم
- [ ] تشغيل `npm install` في server/
- [ ] تشغيل الخادم بنجاح
- [ ] اختبار health endpoint
- [ ] تسجيل مستخدم جديد
- [ ] تسجيل الدخول والحصول على token
- [ ] رفع صورة ملف شخصي
- [ ] التحقق من وجود الصورة في storage
- [ ] إنشاء منشور بصور متعددة
- [ ] التحقق من رفع جميع الصور
- [ ] تحديث منشور (حذف وإضافة صور)
- [ ] التحقق من حذف الصور القديمة
- [ ] حذف منشور والتحقق من حذف صوره
- [ ] إضافة تعليق
- [ ] إضافة إعجاب
- [ ] اختبار الأخطاء (ملف غير صورة، بدون token)
- [ ] حذف الحساب والتحقق من cascade delete
- [ ] حذف جميع البيانات التجريبية

---

## الخطوات التالية

بعد نجاح جميع الاختبارات:

1. ✅ مراجعة الكود والتأكد من جودته
2. ✅ إضافة tests آلية (Jest/Mocha)
3. ✅ تحديث التوثيق بأي ملاحظات
4. ✅ Commit التغييرات
5. ✅ Push إلى GitHub
6. ✅ مراقبة GitHub Actions workflow

---

**جاهز للاختبار! 🚀**
