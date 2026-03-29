# دليل النشر الإنتاجي

## 📋 قائمة التحقق قبل النشر

قبل النشر على الإنتاج، تأكد من:

- [ ] جميع متغيرات البيئة مضبوطة بشكل صحيح
- [ ] JWT_SECRET تم تغييره من القيمة الافتراضية
- [ ] أصول CORS مضبوطة بشكل صحيح
- [ ] نوع التخزين مُكوَّن (Cloudinary أو S3 موصى به)
- [ ] اتصال قاعدة البيانات مختبر
- [ ] جميع التبعيات موجودة في package.json
- [ ] .gitignore يستثني الملفات الحساسة
- [ ] معالجة الأخطاء شاملة
- [ ] SPA routing: `app/public/_redirects`, `app/public/404.html`, وسكريبت receiver في `app/index.html` موجودة (`node validate-workflow.mjs` يتحقق منها تلقائيًا)

## 🔐 أفضل ممارسات الأمان

### 1. متغيرات البيئة

**لا تقم أبداً بنشر البيانات الحساسة إلى Git!**

المتغيرات المطلوبة للإنتاج:
```bash
NODE_ENV=production
# يجب ضبطها
JWT_SECRET=your_secure_random_secret_here
DATABASE_URL=postgresql://user:pass@host:port/db

# موصى به بشدة
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# اختر نوع تخزين واحد
STORAGE_TYPE=cloudinary  # أو 's3'

# Cloudinary - الخيار أ: Heroku Addon (يُضبط CLOUDINARY_URL تلقائياً)
# CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# Cloudinary - الخيار ب: يدوياً (إذا لم تستخدم Addon)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_FOLDER=mobile-recipes  # اختياري
```

### 2. توليد JWT Secret قوي

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 3. إعدادات CORS

**الافتراضي (التطوير):** يقبل أصول localhost فقط
**الإنتاج:** يجب تحديد الأصول المسموح بها صراحةً

```bash
CORS_ORIGINS=https://yourdomain.com
# أصل واحد

# عدة أصول (مفصولة بفاصلة, بدون مسافات بعد الفاصلة)
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://mobile.yourdomain.com
```

### 4. تحديد معدل الطلبات (موصى به)

ثبّت express-rate-limit:
```bash
npm install express-rate-limit
```

أضف إلى `server/app.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // حد أقصى 100 طلب لكل IP
  message: 'عدد كبير جداً من الطلبات من هذا IP, يرجى المحاولة لاحقاً.'
});

app.use('/account/', limiter); // تطبيق على مسارات المصادقة
```

## 🐳 Docker Delivery (جديد)

تم اعتماد مسار Docker مستقل بجانب مسار النشر التقليدي:

- Workflow: `.github/workflows/docker-delivery.yml`
- سكربت مركزي: `scripts/docker/deliver.mjs`
- فحص بنية Docker: `scripts/infra/validate-docker.mjs`

### الأنماط المدعومة

- `build-only`: يبني الصور ويفحصها بـ Trivy كتقرير (غير حاجز افتراضيا).
- `publish`: يبني + يفحص + ينشر الصور، وفحص Trivy يكون حاجزا افتراضيا.

### أولوية متغيرات بيئة التطبيق داخل الحاوية

عند تشغيل صورة `app`:

1. قيمة وقت التشغيل (`docker run -e VITE_API_URL=...`)
2. القيمة المخبوزة وقت البناء (`ARG -> ENV`)
3. fallback ثابت داخل `docker/app-entrypoint.sh`

### أمثلة

```bash
# بناء وفحص فقط
node scripts/docker/deliver.mjs --mode build-only --service all

# نشر صورة الخادم إلى GHCR
docker login ghcr.io
node scripts/docker/deliver.mjs --mode publish --service server --registry ghcr.io/<owner> --tag latest

# نشر الخادم والواجهة معاً
node scripts/docker/deliver.mjs --mode publish --service all --registry ghcr.io/<owner> --tag latest
```

### أسماء الصور على GHCR وسحبها وتشغيلها

بعد نشر ناجح (`publish`) تُرفَع الصور بالأسماء التالية (استبدل `<OWNER>` بمالك المستودع على GitHub، أحرف صغيرة في عنوان الصورة):

| الصورة | الوصف |
|--------|--------|
| `ghcr.io/<OWNER>/mobile-recipes-e1-server:<tag>` | API (Express + Sequelize) |
| `ghcr.io/<OWNER>/mobile-recipes-e1-app:<tag>` | واجهة Vite + `preview` (entrypoint يعيد البناء عند التشغيل إن لزم) |

**سحب:**

```bash
docker pull ghcr.io/<OWNER>/mobile-recipes-e1-server:<tag>
docker pull ghcr.io/<OWNER>/mobile-recipes-e1-app:<tag>
```

**تشغيل الخادم (مثال مع PostgreSQL على شبكة Docker):**

مرّر متغيرات قاعدة البيانات و`JWT_SECRET` و`CORS_ORIGINS` و`STORAGE_TYPE` و`PORT` في وقت التشغيل (`-e` أو ملف بيئة). الافتراضيات داخل الصورة قابلة للاستبدال.

```bash
docker network create recipes-net
docker run -d --name recipes-pg --network recipes-net -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=myrecipes postgres:15-alpine

docker run -d --name recipes-api --network recipes-net -p 3002:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_HOST=recipes-pg \
  -e DB_PORT=5432 \
  -e DB_NAME=myrecipes \
  -e DB_USER=postgres \
  -e DB_PASS=secret \
  -e JWT_SECRET=replace_with_strong_secret \
  -e CORS_ORIGINS=http://localhost:4173 \
  -e STORAGE_TYPE=local \
  ghcr.io/<OWNER>/mobile-recipes-e1-server:<tag>
```

التحقق: `curl -fsS http://localhost:3002/health`

**تشغيل الواجهة:**

```bash
docker run -d -p 4173:4173 \
  -e VITE_API_URL=http://localhost:3002 \
  -e VITE_BASE_URL=/ \
  -e APP_PORT=4173 \
  ghcr.io/<OWNER>/mobile-recipes-e1-app:<tag>
```

`VITE_API_URL` يجب أن يصل إليه **المتصفح** (عنوان عام أو نفس المضيف والمنفذ الظاهر للمستخدم).

**PowerShell (Windows):** لا تستخدم `\` لاستمرار السطر؛ استخدم سطرًا واحدًا أو backtick `` ` ``.

### سياسة Trivy في CI

- الافتراضي في السكربت: فحص الشدّات `CRITICAL` و`HIGH`؛ في `build-only` لا يفشل التنفيذ افتراضيا، وفي `publish` يفشل عند وجود ثغرات ضمن تلك الشدّات.
- يمكن ضبط السياسة من المستودع عبر متغيرات Actions: `TRIVY_SEVERITY` و`TRIVY_PKG_TYPES`، أو من تشغيل workflow يدويًا (الحقول `trivy_severity` و`trivy_pkg_types`).

### تشغيل محلي بـ Compose

```bash
docker compose up --build
```

- الواجهة: `http://localhost:4173`
- الـ API (على المضيف): `http://localhost:3002` — المنفذ 3002 مُعرَّف في `docker-compose.yml` لتفادي التعارض مع خدمات أخرى على 3000
- قاعدة البيانات: PostgreSQL على منفذ المضيف `${POSTGRES_HOST_PORT:-5433}` (القيمة الافتراضية `5433` لتفادي التعارض؛ داخليًا تبقى `5432`)

لتجاوز `JWT_SECRET` في التطوير المحلي أنشئ ملف `.env` في جذر المشروع (انظر `docker/compose.env.example`).

### سياسة إعادة التشغيل (restart) والاعتماديات

- خدمتا **`server`** و**`app`** تستخدمان `restart: unless-stopped` حتى تعود الحاويات تلقائياً بعد إعادة تشغيل Docker أو الجهاز، دون تغيير المنافذ أو متغيرات البيئة.
- **`postgres`** يبقى بدون سياسة restart صريحة في الملف الحالي (يمكن إضافتها لاحقاً بنفس النمط إذا رغبت بمواءمة كاملة مع بقية المشاريع).
- ترتيب الجاهزية: السيرفر ينتظر `postgres` بحالة `service_healthy` (عبر `pg_isready`)؛ الواجهة تعتمد على السيرفر عبر `depends_on` بدون شرط صحة إضافي لأن بناء Vite يحدث عند بدء الحاوية.

فحص تلقائي مع احتياطات تنظيف (يشغّل Compose مؤقتا، يفحص الروابط، ثم ينفذ `down` تلقائيا حتى عند الفشل):

```bash
node scripts/infra/validate-docker.mjs --smoke
```

## 🚀 النشر على Heroku

### الإعداد الأولي

1. **تثبيت Heroku CLI:**
   ```bash
   # Windows (عبر winget)
   winget install Heroku.HerokuCLI
   
   # Mac
   brew install heroku/brew/heroku
   ```

2. **تسجيل الدخول إلى Heroku:**
   ```bash
   heroku login
   ```

3. **إنشاء تطبيق Heroku:**
   ```bash
   heroku create your-app-name
   ```

4. **إضافة PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   # أو للطبقة المجانية (محدودة)
   heroku addons:create heroku-postgresql:mini
   ```

### ضبط متغيرات البيئة

```bash
heroku config:set NODE_ENV=production
# مطلوبة
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# CORS (استبدل برابط موقعك الفعلي)
heroku config:set CORS_ORIGINS=https://yourapp.com

# التخزين - الخيار 1: Cloudinary Addon (موصى به على Heroku — CLOUDINARY_URL يُضبط تلقائياً)
heroku addons:create cloudinary:starter
heroku config:set STORAGE_TYPE=cloudinary
# CLOUDINARY_FOLDER اختياري (default: mobile-recipes)
heroku config:set CLOUDINARY_FOLDER=mobile-recipes

# التخزين - الخيار 2: Cloudinary يدوياً (إذا لم تستخدم Addon)
# heroku config:set STORAGE_TYPE=cloudinary
# heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
# heroku config:set CLOUDINARY_API_KEY=your_api_key
# heroku config:set CLOUDINARY_API_SECRET=your_api_secret

# التخزين - الخيار 3: AWS S3
heroku config:set STORAGE_TYPE=s3
heroku config:set AWS_S3_BUCKET=your-bucket-name
heroku config:set AWS_REGION=us-east-1
heroku config:set AWS_ACCESS_KEY_ID=your_access_key
heroku config:set AWS_SECRET_ACCESS_KEY=your_secret_key

# اختياري: منفذ مخصص (Heroku يضبط هذا تلقائياً)
# heroku config:set PORT=3000
```

### النشر عبر GitHub Actions

المشروع يتضمن workflow لـ GitHub Actions (`.github/workflows/build-and-deploy.yml`) ينشر تلقائياً إلى Heroku.

**الإعداد:**

1. احصل على Heroku API key:
   ```bash
   heroku auth:token
   ```

2. أضف إلى GitHub Secrets:
   - اذهب إلى: `Repository → Settings → Secrets → Actions`
   - أضف: `HEROKU_API_KEY` مع token الخاص بك
   - أضف: `HEROKU_APP_NAME` مع اسم تطبيقك
   - أضف: `HEROKU_EMAIL` مع بريدك الإلكتروني في Heroku

3. ادفع إلى فرع `main`:
   ```bash
   git push origin main
   ```

GitHub Actions سيقوم تلقائياً بـ:
- دفع كود الخادم إلى فرع `server`
- Heroku يسحب من فرع `server`
- تشغيل `npm install` و `npm start`

### النشر اليدوي

إذا لم تكن تستخدم GitHub Actions:

```bash
cd mobile-recipes-e1
# تأكد من أنك في جذر المشروع

# أضف Heroku remote (إذا لم يتم إضافته)
heroku git:remote -a your-app-name

# انشر (Heroku يكتشف مجلد server/ تلقائياً عبر Procfile)
git push heroku main
```

### التحقق من النشر

```bash
heroku logs --tail
# التحقق من السجلات

# التحقق من الإعدادات
heroku config

# فتح التطبيق
heroku open

# اختبار نقطة الصحة
curl https://your-app-name.herokuapp.com/health
```

استجابة الصحة المتوقعة:
```json
{
  "status": "OK",
  "message": "Server is running",
  "environment": "production",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📱 إعدادات الواجهة الأمامية

حدّث رابط API في التطبيق:

**التطوير** (`app/.env.local`):
```bash
VITE_API_URL=http://localhost:3000
```

**الإنتاج** (متغيرات GitHub Actions):
```bash
VITE_API_URL=https://your-app-name.herokuapp.com
```

اضبط في GitHub:
- `Repository → Settings → Secrets → Actions`
- أضف: `VITE_API_URL` كـ **Variable** (ليس Secret)

## 🗄️ إدارة قاعدة البيانات

### الوصول إلى PostgreSQL Shell

```bash
heroku pg:psql
```

### تشغيل Migrations

Sequelize سيقوم بمزامنة تلقائية عند بدء التشغيل (`db.sync({ alter: true })`)، لكن للإنتاج قد ترغب في تعطيل المزامنة التلقائية واستخدام migrations بدلاً من ذلك.

**إنشاء migration:**
```bash
npx sequelize-cli migration:generate --name add-new-field
```

**تشغيل migrations على Heroku:**
```bash
heroku run npx sequelize-cli db:migrate
```

### نسخ احتياطي لقاعدة البيانات

```bash
heroku pg:backups:capture
# إنشاء نسخة احتياطية

# تنزيل النسخة الاحتياطية
heroku pg:backups:download

# قائمة النسخ الاحتياطية
heroku pg:backups
```

## 🔍 المراقبة وتصحيح الأخطاء

### عرض السجلات

```bash
heroku logs --tail
# سجلات في الوقت الفعلي

# آخر 1000 سطر
heroku logs -n 1000

# تصفية حسب المصدر
heroku logs --source app
```

### مراقبة الأداء

**إضافة Heroku Metrics:**
```bash
heroku addons:create heroku-metrics:standard
```

**عرض المقاييس:**
```bash
heroku open metrics
```

### تتبع الأخطاء (اختياري)

ثبّت Sentry لتتبع الأخطاء:

```bash
npm install @sentry/node
```

أضف إلى `server/app.js`:
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

## 🧪 اختبار الإنتاج محلياً

### استخدام Heroku Local

```bash
npm install -g foreman
# ثبت foreman (إذا لم يكن مثبتاً)

# أنشئ ملف .env بإعدادات شبيهة بالإنتاج
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://localhost:5432/myrecipes
JWT_SECRET=test_secret_for_local_prod
CORS_ORIGINS=http://localhost:5173
STORAGE_TYPE=local
EOF

# شغّل مع Heroku Local
heroku local
```

### استخدام Docker (بديل)

للإنتاج استخدم الصور الرسمية في المستودع: `docker/server.Dockerfile` و`docker/app.Dockerfile` مع `docker compose up --build` أو الصور المنشورة على GHCR كما في قسم **Docker Delivery** أعلى هذا الملف. تجنّب نسخ `Dockerfile` مبسّط هنا لأنه قديم ولا يعكس سياسة الأمان والطبقات الحالية.

## 📊 تحسين الأداء

### 1. تفعيل ضغط Gzip

ثبّت middleware الضغط:
```bash
npm install compression
```

أضف إلى `server/app.js`:
```javascript
import compression from 'compression';
app.use(compression());
```

### 2. تفعيل HTTP Caching

للصور الثابتة المقدمة محلياً:
```javascript
app.use('/images', express.static(imagesRoot, {
  maxAge: '1d', // تخزين مؤقت ليوم واحد
  etag: true
}));
```

### 3. Connection Pooling لقاعدة البيانات

مُكوَّن بالفعل في `utilities/database.js` عبر إعدادات Sequelize الافتراضية.

للضبط المخصص:
```javascript
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
```

### 4. استخدام CDN للصور

عند استخدام Cloudinary أو S3، تُقدم الصور تلقائياً عبر CDN.

## 🚨 المشاكل الشائعة والحلول

### المشكلة: "Application Error" على Heroku

**تحقق من السجلات:**
```bash
heroku logs --tail
```

**الأسباب الشائعة:**
- متغيرات البيئة ناقصة
- فشل الاتصال بقاعدة البيانات
- مشاكل ربط المنفذ (تأكد من `process.env.PORT`)
- فشل البناء (تحقق من التبعيات)

### المشكلة: أخطاء CORS

**تحقق من إعدادات CORS:**
```bash
heroku config:get CORS_ORIGINS
```

**اختبر من console المتصفح:**
```javascript
fetch('https://your-app.herokuapp.com/health')
  .then(r => r.json())
  .then(console.log)
```

### المشكلة: انتهاء مهلة الاتصال بقاعدة البيانات

**تحقق من حالة قاعدة البيانات:**
```bash
heroku pg:info
```

**تحقق من حدود الاتصال:**
```bash
heroku pg:ps
```

### المشكلة: عدم بقاء الملفات (استخدام التخزين المحلي)

**السبب:** نظام ملفات Heroku المؤقت

**الحل:** انتقل إلى Cloudinary أو S3:
```bash
heroku config:set STORAGE_TYPE=cloudinary
heroku config:set CLOUDINARY_CLOUD_NAME=xxx
heroku config:set CLOUDINARY_API_KEY=xxx
heroku config:set CLOUDINARY_API_SECRET=xxx
heroku restart
```

### المشكلة: استخدام ذاكرة عالي

**تحقق من مقاييس dyno:**
```bash
heroku ps
```

**التحسين:**
- استخدم نوع dyno أصغر للتطوير
- نفذ ترقيم الصفحات للاستعلامات الكبيرة
- استخدم فهارس قاعدة البيانات
- حدّد حجم payload JSON

## 🔄 خط أنابيب CI/CD

يوفر workflow GitHub Actions (`.github/workflows/build-and-deploy.yml`):

- ✅ نشر تلقائي عند الدفع إلى `main`
- ✅ بناء منفصل للخادم والتطبيق
- ✅ فروع orphan للنشر النظيف
- ✅ خيار تشغيل يدوي

**تفعيل النشر اليدوي:**
- اذهب إلى: تبويب `Actions` في GitHub
- اختر: `Build & Deploy`
- انقر: `Run workflow`
- اختر: `server`، `app`، أو `both`

## 📝 قائمة التحقق بعد النشر

بعد النشر الناجح:

- [ ] اختبر نقطة الصحة: `https://your-app.herokuapp.com/health`
- [ ] اختبر تسجيل المستخدم
- [ ] اختبر رفع الصور
- [ ] تحقق من إمكانية الوصول للصور
- [ ] اختبر تدفق المصادقة
- [ ] تحقق من السجلات بحثاً عن أخطاء
- [ ] تحقق من CORS من الواجهة الأمامية
- [ ] اختبر إعادة تعيين كلمة المرور (إذا كان مُنفذاً)
- [ ] راقب استخدام الذاكرة والمعالج
- [ ] إعداد النسخ الاحتياطية التلقائية

## � توجيه SPA على GitHub Pages

تطبيق وصفاتي (واجهة أمامية) يعمل كـ **SPA — Single Page Application**: كل تنقل يخدم `index.html` ويترك React Router يتولى عرض الصفحة الصحيحة. لكن خوادم الاستضافة الثابتة (GitHub Pages, Nginx...) تحاول إيجاد **ملف حقيقي** لكل مسار — فيرجع 404.

### الحل: ثلاثة ملفات

| الملف | الغرض | منصة |
|------|------|-------|
| `app/public/_redirects` | يعيد توجيه كل الطلبات إلى `index.html` | Netlify / Render |
| `app/public/404.html` | يحوّل المسار إلى query string ثم يعيد التوجيه لـ root | GitHub Pages |
| script in `app/index.html` | يفك التشفير ويرمم المسار باستخدام `history.replaceState` | GitHub Pages |

### كيف يعمل بروتوكول GitHub Pages

```text
2. GitHub Pages: لا يوجد ملف باسم "profile"  // يخدم 404.html
1. المستخدم يفتح /mobile-recipes-e1/profile
3. 404.html: يحوّل المسار إلى query string:
   /mobile-recipes-e1/?/profile
4. index.html يستقبل: يرمم history API إلى المسار الحقيقي
5. React Router يعرض صفحة الملف الشخصي
```

### فحص الملفات تلقائيًا

يتحقق `validate-workflow.mjs` (فحص رقم 5) من وجود هذه الملفات قبل كل `git push`:

```bash
node validate-workflow.mjs
# 5. Static assets (PWA manifest + SPA routing)
# ✅ _redirects: قاعدة catch-all لـ SPA موجودة
# ✅ 404.html: سكريبت إعادة التوجيه لـ GitHub Pages SPA موجود
# ✅ app/index.html: سكريبت استقبال SPA موجود
# ✅ manifest.json: أيقونة "favicon.png" موجودة (الحجم المُعلَن: 64x64)
```

### محيطة مخصصة `_redirects` لـ Netlify/Render

```text
/* /index.html 200
```

> تحذير: إذا حذفت `_redirects` أو `404.html` ستعود مشكلة 404 عند التحديث مجدديًا.

## �📚 موارد إضافية

- [دليل Heroku Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)
- [أفضل ممارسات Node.js للإنتاج](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [أفضل ممارسات أمان Express](https://expressjs.com/en/advanced/best-practice-security.html)

## 🆘 الدعم

إذا واجهت مشاكل:
1. تحقق من سجلات Heroku أولاً
2. تحقق من ضبط جميع متغيرات البيئة
3. اختبر نقاط النهاية باستخدام Postman/curl
4. راجع سجلات GitHub Actions
5. راجع هذا الدليل بدقة

---

**آخر تحديث:** 2024
**المشروع:** Mobile Recipes E1
**منصة النشر:** Heroku + GitHub Pages
