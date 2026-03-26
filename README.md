# وصفاتي — تطبيق الوصفات الاجتماعي

تطبيق جوال اجتماعي متكامل لمشاركة وصفات الطعام. يتيح للمستخدمين نشر الوصفات مع الصور التعليق وتسجيل الإعجاب. مبني بـ **Ionic/React + TypeScript** للواجهة الأمامية و**Node.js/Express/PostgreSQL** للخلفية مع بنية تخزين ملفات مرنة تدعم Local وCloudinary وAWS S3.

> **الاسم العربي:** وصفاتي | **الاسم الإنجليزي:** My Recipes | **الترخيص:** MIT

---

## ✨ الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🔐 **المصادقة** | مصادقة JWT مع تجزئة كلمة المرور بـ bcrypt |
| 📝 **المنشورات** | إنشاء وصفات بحد أقصى 10 صور تعديل حذف تصفح |
| 💬 **التعليقات** | إضافة وتعديل وحذف التعليقات على المنشورات |
| ❤️ **الإعجابات** | تبديل الإعجاب عرض المنشورات المعجب بها |
| 👤 **الملف الشخصي** | تحديث الاسم رفع/إعادة تعيين صورة الملف الشخصي حذف الحساب |
| 📱 **تطبيق جوال** | دعم iOS وAndroid عبر Capacitor |
| 🌐 **PWA** | تطبيق ويب تقدمي للنشر على الويب |
| 🗄️ **تخزين مرن** | بنية قابلة للتوصيل: Local أو Cloudinary أو S3 |
| 🚀 **جاهز للإنتاج** | CORS معالجة الأخطاء أفضل ممارسات الأمان |
| ⚡ **نشر تلقائي** | GitHub Actions ← Heroku + GitHub Pages |

---

## 🏗️ المكدس التقني

### الخادم (`server/`)

| التقنية | الغرض | الإصدار |
|---------|-------|---------|
| Node.js | بيئة تشغيل JavaScript | 22.x |
| Express | إطار عمل الويب | 5.x |
| PostgreSQL | قاعدة البيانات العلائقية | الأحدث |
| Sequelize | ORM مع المزامنة التلقائية | 6.x |
| JWT | المصادقة عديمة الحالة | 9.x |
| bcrypt | تجزئة كلمات المرور | 6.x |
| multer | معالجة رفع الملفات | 2.x |
| express-validator | التحقق من صحة المدخلات | 7.x |
| dotenv | إعداد المتغيرات البيئية | 17.x |

### التطبيق (`app/`)

| التقنية | الغرض | الإصدار |
|---------|-------|---------|
| Ionic React | مكتبة مكونات الواجهة | 8.x |
| React | إطار عمل الواجهة | 18.x |
| TypeScript | سلامة الأنواع | 5.x |
| Capacitor | الجسر الأصيل | 8.x |
| Vite | أداة البناء | 5.x |
| Axios | عميل HTTP | 1.x |

---

## 📁 هيكل المشروع

```text
mobile-recipes-e1/
├── server/                      # Node.js REST API
│   ├── app.js                   # نقطة دخول Express
│   ├── services/
│   │   └── storage/             # بنية التخزين القابلة للتوصيل
│   │       ├── storage.service.js
│   │       ├── local.strategy.js
│   │       ├── cloudinary.strategy.js
│   │       └── s3.strategy.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   ├── validators/
│   ├── utilities/
│   ├── Procfile
│   ├── .env.example
│   └── package.json
│
└── app/                         # الواجهة الأمامية Ionic/React
    └── src/
        ├── App.tsx
        ├── pages/
        ├── context/AuthContext.tsx
        ├── config/
        │   ├── urls.ts
        │   └── axios.ts
        └── components/
```

---

## 🚀 البدء السريع

### المتطلبات المسبقة

- **Node.js** 22.x أو أحدث
- **PostgreSQL** 14 أو أحدث
- **npm** 9+
- *(اختياري)* Capacitor CLI: `npm install -g @capacitor/cli`

---

### 🔧 إعداد الخادم

```bash
cd server
npm install
cp .env.example .env
# عدل .env بمعلومات قاعدة البيانات
npm run dev
```

يعمل الخادم على `http://localhost:3000` افتراضيا.  
فحص الصحة: `http://localhost:3000/health`

**المزامنة التلقائية:** يشغل Sequelize `db.sync({ alter: true })` عند البدء.

---

### 📱 إعداد التطبيق

```bash
cd app
npm install
cp .env.example .env.local
# اضبط VITE_API_URL على عنوان URL للخادم
npm run dev
```

يعمل التطبيق على `http://localhost:5173`.

#### 🍎 البناء الأصيل (iOS/Android)

```bash
npm run build
npx cap sync
npx cap open ios       # أو android
```

---

## 🔐 متغيرات البيئة

### الخادم (`server/.env`)

| المتغير | مطلوب | الوصف |
|---------|-------|-------|
| `JWT_SECRET` | **نعم** | مفتاح توقيع JWT |
| `DATABASE_URL` | الإنتاج | سلسلة اتصال PostgreSQL |
| `DB_HOST` | التطوير | مضيف PostgreSQL (افتراضي: `localhost`) |
| `DB_PORT` | التطوير | منفذ PostgreSQL (افتراضي: `5432`) |
| `DB_NAME` | التطوير | اسم قاعدة البيانات (افتراضي: `myrecipes`) |
| `DB_USER` | التطوير | مستخدم قاعدة البيانات |
| `DB_PASS` | التطوير | كلمة مرور قاعدة البيانات |
| `STORAGE_TYPE` | لا | `local` \| `cloudinary` \| `s3` (افتراضي: `local`) |
| `CORS_ORIGINS` | لا | المصادر المسموح بها مفصولة بفواصل |
| `NODE_ENV` | لا | `development` \| `production` |
| `PORT` | لا | منفذ الخادم (افتراضي: `3000`) |

**لـ Cloudinary:**
```bash
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mobile-recipes
```

**لـ AWS S3:**
```bash
STORAGE_TYPE=s3
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_FOLDER=uploads/images
```

### التطبيق (`app/.env.local`)

| المتغير | مطلوب | الوصف |
|---------|-------|-------|
| `VITE_API_URL` | **نعم** | عنوان URL للخلفية |
| `VITE_BASE_URL` | لا | المسار الأساسي (يكتشف تلقائيا في CI) |

---

## 📡 مرجع API

جميع نقاط النهاية تتطلب `Authorization: Bearer <token>` ما عدا تسجيل الدخول والتسجيل.

### الحساب (`/account`)

| الطريقة | نقطة النهاية | الوصول | الوصف |
|---------|-------------|--------|-------|
| `POST` | `/register` | عام | إنشاء حساب جديد |
| `POST` | `/login` | عام | الحصول على رمز JWT |
| `GET` | `/profile` | مصادق | عرض الملف الشخصي |
| `PUT` | `/profile/info` | مصادق | تحديث الاسم/كلمة المرور |
| `PUT` | `/profile/image` | مصادق | رفع الصورة الشخصية |
| `PUT` | `/profile/image/reset` | مصادق | إعادة تعيين الصورة |
| `DELETE` | `/profile` | مصادق | حذف الحساب |

### المنشورات (`/posts`)

| الطريقة | نقطة النهاية | الوصول | الوصف |
|---------|-------------|--------|-------|
| `POST` | `/create` | مصادق | إنشاء منشور (بحد أقصى 10 صور) |
| `GET` | `/` | مصادق | جميع المنشورات (مقسمة) |
| `GET` | `/me` | مصادق | منشوراتي |
| `GET` | `/:id` | مصادق | منشور بمعرفه |
| `PUT` | `/:id` | مصادق | تحديث منشور |
| `DELETE` | `/:id` | مصادق | حذف منشور |

### التعليقات (`/comments`)

| الطريقة | نقطة النهاية | الوصول | الوصف |
|---------|-------------|--------|-------|
| `POST` | `/:postId` | مصادق | إضافة تعليق |
| `PUT` | `/:id` | مصادق | تحديث تعليق |
| `DELETE` | `/:id` | مصادق | حذف تعليق |
| `GET` | `/me` | مصادق | تعليقاتي |

### الإعجابات (`/likes`)

| الطريقة | نقطة النهاية | الوصول | الوصف |
|---------|-------------|--------|-------|
| `POST` | `/:postId` | مصادق | تبديل الإعجاب |
| `GET` | `/:postId` | مصادق | إعجابات منشور |
| `GET` | `/me` | مصادق | المنشورات المعجب بها |

---

## 🧪 تشغيل الاختبارات

```bash
npm run test:all   # جميع اختبارات الخادم
# من مجلد server/

# من مجلد app/
npm run test       # وضع المراقبة (التطوير)
npm run test:all   # Vitest + Cypress
```

---

## 🌐 النشر

راجع **[docs/deployment.md](docs/deployment.md)** للدليل الكامل.

### 🐳 النشر عبر Docker

تمت إضافة مسار Docker مركزي للخادم والتطبيق:

- `docker/server.Dockerfile` لصورة الخادم
- `docker/app.Dockerfile` + `docker/app-entrypoint.sh` لصورة التطبيق (يبني وقت التشغيل حسب البيئة)
- `scripts/docker/deliver.mjs` كسكربت موحد للبناء/الفحص/النشر
- `scripts/infra/validate-docker.mjs` لفحص ملفات ومؤشرات Docker (config-as-test)
- `docker-compose.yml` لتشغيل PostgreSQL + الخادم + الواجهة محلياً

أمثلة تشغيل محلي:

```bash
# تشغيل كامل عبر Compose (قاعدة بيانات + API على المضيف 3002 + واجهة على 4173)
docker compose up --build

# بناء وفحص فقط (لا يفشل افتراضيا عند وجود ثغرات)
node scripts/docker/deliver.mjs --mode build-only --service all

# فحص Docker تلقائي شامل + تنظيف تلقائي بعد الاختبار
node scripts/infra/validate-docker.mjs --smoke

# بناء + فحص صارم + نشر (يتطلب تسجيل دخول docker registry مسبقا)
node scripts/docker/deliver.mjs --mode publish --service server --registry ghcr.io/<owner> --tag latest
```

ملاحظات مهمة:

- وضع `build-only`: Trivy يعمل بصيغة تقرير (exit code افتراضي = 0).
- وضع `publish`: Trivy يعمل كـ gate افتراضي (exit code افتراضي = 1 لشدات `CRITICAL,HIGH`).
- يدعم السكربت توافق الأعلام القديمة والجديدة: `--trivy-vuln-type` و`--pkg-types`.
- يمكن ضبط سياسة الشدّات عبر متغيرات Actions: `TRIVY_SEVERITY` و`TRIVY_PKG_TYPES` أو مدخلات التشغيل اليدوي في `Docker Delivery`.

### النشر السريع على Heroku

```bash
heroku login
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
heroku config:set NODE_ENV=production JWT_SECRET=$(openssl rand -base64 32)
heroku config:set STORAGE_TYPE=cloudinary CORS_ORIGINS=https://yourapp.com
git push heroku main
```

### GitHub Pages (التطبيق)

1. اضبط `VITE_API_URL` في `Settings → Secrets → Actions`
2. ادفع إلى فرع `main` — ينشر GitHub Actions تلقائيا على فرع `web`
3. فعل Pages: `Settings → Pages → Deploy from branch → web`

---

## ⚙️ خط CI/CD

| الإجراء | عند الدفع إلى `main` |
|---------|---------------------|
| **الخادم** | تثبيت → اختبارات → نشر على فرع `server` → Heroku |
| **التطبيق** | تثبيت → بناء → نشر على فرع `web` → GitHub Pages |

---

## 🛡️ ميزات الأمان

- ✅ مصادقة JWT مع تجزئة bcrypt
- ✅ حماية CORS مع مصادر قابلة للإعداد
- ✅ التحقق من رفع الملفات (الحجم والنوع)
- ✅ التحقق من صحة المدخلات عبر express-validator
- ✅ حماية من SQL Injection عبر Sequelize ORM
- ✅ معالجة الأخطاء دون كشف التفاصيل الداخلية

---

## 📚 التوثيق

| الملف | الوصف |
|-------|-------|
| [`docs/api-endpoints.md`](docs/api-endpoints.md) | مرجع REST API الكامل |
| [`docs/database-abstraction.md`](docs/database-abstraction.md) | شرح نمط Repository |
| [`docs/testing.md`](docs/testing.md) | توثيق الاختبارات |
| [`docs/storage.md`](docs/storage.md) | إعداد استراتيجية التخزين |
| [`docs/deployment.md`](docs/deployment.md) | دليل النشر |
| [`docs/ai/`](docs/ai/) | توجيهات AI (المعمارية دليل الميزات) |
| [`docs/tutorials/`](docs/tutorials/) | الدروس التعليمية العربية |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | معايير الفروع والإيداعات والتاجات |

---

## 📅 تاريخ المشروع

| التاج | العنوان | التغييرات الرئيسية |
|-------|---------|-----------------|
| `v1.0.0` | المشروع مكتمل الميزات | الخادم + التطبيق مع CRUD كامل |
| `v1.1.0` | نمط Repository + التخزين | Repository Pattern Storage Strategy |
| `v1.2.0` | اختبارات الخادم | اختبارات شاملة |
| `v1.3.0` | الأمان والجودة | Prettier معايير المساهمة |
| `v1.4.0` | الاختبارات المتكاملة | اختبارات Vitest للتطبيق |
| `v1.5.0` | تحسينات أداء | تحسينات شاملة |
| `v1.5.1` | تصحيحات | إصلاح أخطاء ثانوية |
| `v1.5.2` | تصحيحات | إصلاح أخطاء إضافية |
| `v1.6.0` | آخر إصدار | تحسينات شاملة |

---

**وصفاتي — مبني بـ ❤️ بأحدث تقنيات الويب**
