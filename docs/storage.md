# خدمة التخزين - الدليل الشامل

## 📋 نظرة عامة

توفر خدمة التخزين **بنية مرنة وقابلة للتوسع** للتعامل مع رفع الملفات في تطبيق Mobile Recipes. تدعم عدة خدمات تخزين ويمكن التبديل بينها بسهولة عبر متغيرات البيئة.

## 🏗️ البنية المعمارية

### **نمط التصميم: Strategy Pattern**

تستخدم خدمة التخزين نمط الاستراتيجية (Strategy Pattern) لعزل عمليات التخزين. هذا يسمح بـ:
- ✅ التبديل السهل بين موفري التخزين
- ✅ عدم الحاجة لتغيير الكود عند تغيير التخزين
- ✅ واجهة برمجية موحدة لجميع الاستراتيجيات
- ✅ سهولة الاختبار والصيانة

### **الاستراتيجيات المتاحة**

1. **LocalStorageStrategy** - افتراضية، تخزين الملفات على قرص الخادم
2. **CloudinaryStorageStrategy** - التخزين السحابي عبر Cloudinary
3. **S3StorageStrategy** - التخزين على AWS S3

## 📁 هيكل الملفات

```text
server/
├── services/
│   └── storage/
│       ├── storage.interface.js    # تعريف الواجهة (TypeScript-style JSDoc)
│       ├── storage.service.js      # المصنع ومدير الخدمة
│       ├── local.strategy.js       # التخزين المحلي
│       ├── cloudinary.strategy.js  # Cloudinary
│       └── s3.strategy.js          # AWS S3
├── utilities/
│   └── files.js                    # إعدادات Multer
└── controllers/
    ├── post.controller.js          # يستخدم خدمة التخزين
    └── user.controller.js          # يستخدم خدمة التخزين
```

## 🔧 الإعداد والتكوين

### متغيرات البيئة

اضبط `STORAGE_TYPE` لاختيار موفر التخزين:

```bash
STORAGE_TYPE=local  # الخيارات: 'local' | 'cloudinary' | 's3'
# ملف .env
```

### التخزين المحلي (الافتراضي)

**الأفضل لـ:** التطوير، النشر الصغير، خوادم منفردة

```bash
STORAGE_TYPE=local
LOCAL_UPLOADS_DIR=               # اختياري, افتراضياً server/public/images
LOCAL_BASE_URL=/images           # اختياري, مسار URL لتقديم الملفات
```

**المزايا:**
- ✅ لا توجد تبعيات خارجية
- ✅ مجاني تماماً
- ✅ سريع للتطوير

**العيوب:**
- ⚠️ تُفقد الملفات عند إعادة تشغيل Heroku dyno
- ⚠️ غير قابل للتوسع لعدة خوادم
- ⚠️ لا توجد فوائد CDN

### التخزين على Cloudinary

**الأفضل لـ:** معظم عمليات النشر الإنتاجية، إعداد سهل، طبقة مجانية سخية

```bash
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mobile-recipes  # اختياري, لتنظيم الملفات
```

**أو عبر Heroku addon** (الأسهل للنشر):

```bash
# addon يُعيّن CLOUDINARY_URL تلقائياً
heroku addons:create cloudinary:starter
heroku config:set STORAGE_TYPE=cloudinary
```

> **ملاحظة مهمة — صورة الملف الشخصي الافتراضية:**
> عند استخدام Cloudinary في الإنتاج، اضبط `DEFAULT_PROFILE_IMAGE_URL` برابط Cloudinary للصورة الافتراضية حتى تخزن في قاعدة البيانات رابطاً صحيحاً:
> ```bash
> heroku config:set DEFAULT_PROFILE_IMAGE_URL=https://res.cloudinary.com/YOUR_CLOUD/image/upload/v1/mobile-recipes/default-profile.svg
> ```
> بدونه، تخزين `/images/default-profile.svg` (مسار محلي) في عمود الصورة قد يسبب مشكلة عند إعادة تحميل صورة جديدة لاحقاً.

المتغير الناتج:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

> `CLOUDINARY_URL` يأخذ الأولوية على المتغيرات المنفصلة عند تواجدهما معاً.

**المزايا:**
- ✅ طبقة مجانية: 25GB تخزين، 25GB نقل بيانات شهرياً
- ✅ تحسين تلقائي للصور
- ✅ CDN مدمج
- ✅ تحويلات الصور أثناء التشغيل
- ✅ إعداد سهل

**العيوب:**
- ⚠️ تبعية خارجية
- ⚠️ خطط مدفوعة للاستخدام الكثيف

### التخزين على AWS S3

**الأفضل لـ:** النشر المؤسسي، البنية التحتية الموجودة على AWS

```bash
STORAGE_TYPE=s3
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_FOLDER=uploads/images     # اختياري, بادئة لمفاتيح الكائنات
```

**خطوات الإعداد:**
1. أنشئ bucket على AWS Console
2. اضبط سياسة الـ bucket للسماح بالقراءة العامة
3. أنشئ مستخدم IAM بصلاحيات S3
4. ثبت SDK: `npm install @aws-sdk/client-s3`
5. اضبط متغيرات البيئة

**المزايا:**
- ✅ قابل للتوسع بشكل كبير
- ✅ نموذج الدفع حسب الاستخدام
- ✅ جزء من نظام AWS البيئي
- ✅ تحكم كامل

**العيوب:**
- ⚠️ إعداد معقد
- ⚠️ يتطلب معرفة بـ AWS
- ⚠️ لا يوجد CDN مدمج (استخدم CloudFront بشكل منفصل)

## 💻 الاستخدام في الكود

### الاستخدام الأساسي

```javascript
import { getStorageService } from '../utilities/files.js';

const storage = getStorageService();

// رفع ملف واحد
const result = await storage.uploadFile(req.file);
console.log(result);
// { url: '/images/123456789.jpg', filename: '123456789.jpg' }

// رفع عدة ملفات
const results = await storage.uploadFiles(req.files);

// حذف ملف
await storage.deleteFile('123456789.jpg');

// حذف عدة ملفات
await storage.deleteFiles(['image1.jpg', 'image2.jpg']);

// الحصول على رابط عام
const url = storage.getFileUrl('123456789.jpg');

// فحص صحة الخدمة
const isHealthy = await storage.healthCheck();
```

### في Controllers

الخدمة مدمجة بالفعل في:
- `post.controller.js` - رفع صور المنشورات
- `user.controller.js` - رفع صور الملف الشخصي

مثال من controller `newPost`:

```javascript
const storage = getStorageService();
const uploadResults = await storage.uploadFiles(req.files);

for (const result of uploadResults) {
    await models.Post_Image.create({
        imageUrl: result.url,
        PostId: post.id,
    });
}
```

### معالجة الأخطاء

جميع الاستراتيجيات تنفذ تنظيفاً تلقائياً عند حدوث أخطاء:

```javascript
try {
    const result = await storage.uploadFile(req.file);
    // ... حفظ في قاعدة البيانات
} catch (error) {
    // يتم تنظيف الملف تلقائياً
    console.error('فشل الرفع:', error);
}
```

## 🚀 دليل النشر

### التطوير المحلي

1. احتفظ بـ `STORAGE_TYPE=local` الافتراضي في `.env`
2. تُخزن الملفات في `server/public/images`
3. تُقدم عبر Express static middleware في `/images`

```bash
npm run dev
```

### الإنتاج على Heroku مع Cloudinary

1. `cloudinary` مضافة في `dependencies` — يثبتها `npm install` تلقائياً بشكل موثوق على Heroku.

2. اضبط متغيرات Heroku:
```bash
heroku config:set STORAGE_TYPE=cloudinary
heroku config:set CLOUDINARY_CLOUD_NAME=xxx
heroku config:set CLOUDINARY_API_KEY=xxx
heroku config:set CLOUDINARY_API_SECRET=xxx
```

3. انشر:
```bash
git push heroku main
```

### الإنتاج على Heroku مع S3

1. ثبت AWS SDK:
```bash
npm install @aws-sdk/client-s3
```

2. أنشئ S3 bucket ومستخدم IAM

3. اضبط متغيرات Heroku:
```bash
heroku config:set STORAGE_TYPE=s3
heroku config:set AWS_S3_BUCKET=your-bucket
heroku config:set AWS_REGION=us-east-1
heroku config:set AWS_ACCESS_KEY_ID=xxx
heroku config:set AWS_SECRET_ACCESS_KEY=xxx
```

4. انشر:
```bash
git push heroku main
```

## 📊 مقارنة الاستراتيجيات

| الميزة | محلي | Cloudinary | S3 |
|---------|-------|------------|-----|
| **تعقيد الإعداد** | 🟢 سهل | 🟡 متوسط | 🔴 صعب |
| **طبقة مجانية** | ✅ نعم | ✅ نعم (25GB) | ⚠️ محدودة |
| **CDN** | ❌ لا | ✅ نعم | ⚠️ منفصل (CloudFront) |
| **تحسين الصور** | ❌ لا | ✅ تلقائي | ❌ يدوي |
| **قابلية التوسع** | ⚠️ خادم واحد | ✅ ممتاز | ✅ ممتاز |
| **توافق Heroku** | ⚠️ مؤقت | ✅ نعم | ✅ نعم |
| **التبعيات** | لا شيء | `cloudinary` | `@aws-sdk/client-s3` |
| **الأفضل لـ** | التطوير | الإنتاج | المؤسسات |

## 🔐 اعتبارات الأمان

### التحقق من الملفات

إعدادات Multer في `utilities/files.js` تفرض:
- ✅ حد حجم الملف: 5MB لكل ملف
- ✅ التحقق من نوع MIME: الصور فقط
- ✅ التخزين في الذاكرة: لا توجد ملفات مؤقتة على القرص

### حماية CORS

تم تكوين CORS في `app.js`:
```javascript
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### التحكم في الوصول

- ✅ المصادقة مطلوبة للرفع (Bearer token)
- ✅ المستخدمون يمكنهم حذف صورهم فقط
- ✅ الحذف المتسلسل: حذف المستخدم يزيل جميع صوره

## 🐛 حل المشاكل

### المشكلة: "Storage service not found"

**الحل:** تأكد من الاستيراد الصحيح:
```javascript
import { getStorageService } from '../utilities/files.js';
```

### المشكلة: "Failed to load cloudinary package"

**الحل:** `cloudinary` مضافة في `dependencies` (وليس `optionalDependencies`) — `npm install` يثبتها تلقائياً وبشكل موثوق. إذا اختفت، شغّل:
```bash
npm install cloudinary
```

### المشكلة: فقدان الملفات بعد إعادة تشغيل Heroku dyno

**السبب:** استخدام `STORAGE_TYPE=local` على Heroku (نظام ملفات مؤقت)

**الحل:** انتقل إلى Cloudinary أو S3

### المشكلة: "Not allowed by CORS"

**الحل:** أضف رابط الواجهة الأمامية إلى `CORS_ORIGINS`:
```bash
heroku config:set CORS_ORIGINS=https://yourapp.com,http://localhost:5173
```

### المشكلة: فشل الرفع بصمت

**تحقق:**
1. متغيرات البيئة مضبوطة بشكل صحيح
2. لـ Cloudinary: تحقق من البيانات في لوحة التحكم
3. لـ S3: تحقق من صلاحيات IAM وسياسة bucket
4. راجع سجلات الخادم للحصول على رسائل خطأ تفصيلية

## 🧪 اختبار استراتيجيات مختلفة

يمكنك التبديل بين الاستراتيجيات دون تغيير الكود:

```bash
export STORAGE_TYPE=local
# اختبار مع التخزين المحلي
npm run dev

# اختبار مع Cloudinary
export STORAGE_TYPE=cloudinary
export CLOUDINARY_CLOUD_NAME=xxx
export CLOUDINARY_API_KEY=xxx
export CLOUDINARY_API_SECRET=xxx
npm run dev

# اختبار مع S3
export STORAGE_TYPE=s3
export AWS_S3_BUCKET=your-bucket
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
npm run dev
```

## 📝 إضافة استراتيجية تخزين جديدة

لإضافة موفر جديد (مثل Azure Blob Storage):

1. أنشئ `server/services/storage/azure.strategy.js`
2. نفذ الواجهة:
   ```javascript
   class AzureStorageStrategy {
     async uploadFile(file) { /* ... */ }
     async uploadFiles(files) { /* ... */ }
     async deleteFile(filename) { /* ... */ }
     async deleteFiles(filenames) { /* ... */ }
     getFileUrl(filename) { /* ... */ }
     async healthCheck() { /* ... */ }
   }
   ```
3. أضف إلى مصنع `storage.service.js`:
   ```javascript
   case 'azure':
     return new AzureStorageStrategy({ /* config */ });
   ```
4. حدّث `.env.example` بالمتغيرات الجديدة

## 📚 موارد إضافية

- [توثيق Cloudinary](https://cloudinary.com/documentation)
- [توثيق AWS S3](https://docs.aws.amazon.com/s3/)
- [توثيق Multer](https://github.com/expressjs/multer)
- [شرح نمط Strategy Pattern](https://refactoring.guru/design-patterns/strategy)

## ✅ الخلاصة

توفر خدمة التخزين:
- 🔌 بنية قابلة للتوصيل
- 🌍 دعم عدة خدمات تخزين
- 🛡️ معالجة أخطاء وتنظيف مدمج
- 📦 عدم الحاجة لتغيير الكود للتبديل بين الموفرين
- 🚀 جاهزة للإنتاج مع Cloudinary/S3
- 🧪 سهولة الاختبار مع التخزين المحلي

**الإعداد الموصى به:**
- التطوير: `local`
- الإنتاج: `cloudinary` (الأسهل) أو `s3` (للمؤسسات)
