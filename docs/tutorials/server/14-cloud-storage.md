# الدرس الرابع عشر: استراتيجيات التخزين السحابي ☁️

> **هدف الدرس:** تفهم كيف تدعم وصفاتي ثلاثة أنواع من التخزين (Local, Cloudinary, AWS S3) بنفس الواجهة، وكيف تختلف إعدادات صور الوصفات عن صور الملف الشخصي، وكيف تُدار الصور المتعددة لكل وصفة.

---

## 1. لماذا التخزين السحابي؟

در [الدرس السادس](./06-storage-strategy.md) شرح التخزين المحلي (`local.strategy.js`). هذا مناسب للتطوير، لكن في الإنتاج:

| المشكلة | الحل |
|---------|------|
| الهيرووكو يحذف الملفات عند إعادة النشر | Cloudinary أو S3 تبقى بشكل دائم |
| محدودية المساحة على الخادم | تخزين لا محدود في السحابة |
| لا CDN → الصور بطيئة عالمياً | Cloudinary لديها CDN تلقائياً |

---

## 2. الواجهة المشتركة — `services/storage/storage.interface.js`

```javascript
/**
 * @typedef {Object} StorageStrategy
 * @property {function(file): Promise<{url, filename, publicId?}>}  uploadFile   — رفع ملف واحد
 * @property {function(files): Promise<UploadResult[]>}              uploadFiles  — رفع عدة ملفات
 * @property {function(string): Promise<boolean>}                   deleteFile   — حذف ملف
 * @property {function(string[]): Promise<{success,failed}>}        deleteFiles  — حذف عدة ملفات
 * @property {function(string): string}                             getFileUrl   — بناء الرابط
 * @property {function(): Promise<boolean>}                         healthCheck  — التحقق من الاتصال
 */
```

هذا الملف لا يحتوي على كود تنفيذي — هو **عقد** مكتوب بـ JSDoc يحدد الدوال التي يجب أن تُنفذها كل استراتيجية.

**لماذا `uploadFiles` مهمة في وصفاتي؟**

وصفاتي تدعم **صوراً متعددة لكل وصفة** (جدول `post_images`). كل وصفة قد تحتوي على 1-10 صور. المتحكم يستدعي `uploadFiles(req.files)` مرة واحدة لرفع كل الصور معاً.

```text
post.controller → storage.uploadFiles([img1, img2, img3])
         ↓
نشر وصفة جديدة برفع 3 صور
         ↓ (Cloudinary: رفع 3 ملفات متوازية بـ Promise.all)
Results: [{url1, publicId1}, {url2, publicId2}, {url3, publicId3}]
         ↓
postImages.repository.createMany([...])  // حفظ جميع الروابط
```

---

## 3. استراتيجية Cloudinary — `services/storage/cloudinary.strategy.js`

### 3.1 الإعداد

```javascript
constructor(config = {}) {
  this.folder = config.folder || process.env.CLOUDINARY_FOLDER || 'mobile-recipes';

  // دعم CLOUDINARY_URL (صيغة Heroku addon)
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    const url = new URL(cloudinaryUrl);
    this.cloudName = url.hostname;   // CLOUD_NAME
    this.apiKey    = url.username;   // API_KEY
    this.apiSecret = decodeURIComponent(url.password);  // API_SECRET
  } else {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey    = process.env.CLOUDINARY_API_KEY;
    this.apiSecret = process.env.CLOUDINARY_API_SECRET;
  }

  this._initPromise = this._initializeCloudinary();
  this._initPromise.catch(() => {});  // منع unhandledRejection
}
```

المجلد الافتراضي `'mobile-recipes'` ← تُحفظ صور كل الوصفات في هذا المجلد على Cloudinary.

### 3.2 التهيئة غير المتزامنة وحل مشكلة الطلبات المتزامنة

```javascript
async _initializeCloudinary() {
  const cloudinary = await import('cloudinary');  // تحميل ديناميكي
  this.cloudinary = cloudinary.v2;
  this.cloudinary.config({ cloud_name, api_key, api_secret });
}

async _ensureInitialized() {
  await this._initPromise;  // ينتظر نفس الـ Promise
}
```

**مشاركة الـ Promise:**
```text
Cloudinary ينتهي من التهيئة
         ↓
طلب 1 يصل → _ensureInitialized()  // ينتظر نفس _initPromise
طلب 2 يصل → _ensureInitialized()  // ينتظر نفس _initPromise
         ↓
الخادم يبدأ → _initPromise = _initializeCloudinary() (غير منتهية بعد)
         ↓
طلب 1 وطلب 2 يستمران معاً ✅ (لا تهيئة مزدوجة)
```

### 3.3 رفع صورة وصفة — الفرق المهم!

```javascript
async uploadFile(file) {
  await this._ensureInitialized();
  return new Promise((resolve, reject) => {
    const uploadStream = this.cloudinary.uploader.upload_stream(
      {
        folder: this.folder,
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1920, crop: 'limit' },  // ← صور وصفات!
          { quality: 'auto:good' },
        ],
      },
      (error, result) => { ... }
    );
    uploadStream.end(file.buffer);
  });
}
```

**`crop: 'limit'` مقابل `crop: 'fill'`:**

| الخيار | المعنى | يُستخدم في |
|--------|--------|-----------|
| `crop: 'limit'` | إذا الصورة أكبر من 1920px → تُصغَّر. إذا أصغر → تبقى كما هي. **الأبعاد محفوظة** | صور الوصفات |
| `crop: 'fill'` | يُقص لملء المقاس المطلوب تماماً | صور الملف الشخصي (مربعة) |
| `gravity: 'face'` | يُركّز القص على الوجه | لا يُستخدم هنا (ليست صوراً شخصية) |

صور الوصفات يجب أن تُعرض كاملة بدون قص — المستخدم يريد أن يرى الطبق كماً هو.

### 3.4 رفع عدة صور بالتوازي

```javascript
async uploadFiles(files) {
  const uploadPromises = files.map((file) => this.uploadFile(file));
  return Promise.all(uploadPromises);  // كل الصور ترفع في نفس الوقت
}
```
`Promise.all(...)` ← لا ينتظر كل صورة على حدة — كل الصور ترفع **بالتوازي**. 3 صور تستغرق وقت صورة واحدة (تقريباً).

### 3.5 حذف صورة وصفة

```javascript
async deleteFile(publicIdOrUrl) {
  const publicId = this._extractPublicId(publicIdOrUrl);
  const result = await this.cloudinary.uploader.destroy(publicId);
  return result.result === 'ok';
}

_extractPublicId(urlOrId) {
  if (urlOrId.includes('cloudinary.com')) {
    const parts = urlOrId.split('/');
    const uploadIndex = parts.indexOf('upload');
    // يأخذ كل شيء بعد /upload/v123456789/ ويحذف الامتداد
    return parts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
  }
  return urlOrId;
}
```

مثال:
```text
https://res.cloudinary.com/mycloud/image/upload/v1735/mobile-recipes/photo.jpg
                                                        ↑ uploadIndex
→ slice(uploadIndex + 2) = ['mobile-recipes', 'photo.jpg']
→ join('/') = 'mobile-recipes/photo.jpg'
  // حذف الامتداد = 'mobile-recipes/photo'  ← publicId لـ API
```

عند **تعديل الوصفة** في المتحكم:
```javascript
// post.controller.js — عند تعديل الوصفة:
const deletedIds = JSON.parse(req.body.deletedImageIds || '[]');
if (deletedIds.length > 0) {
  await storage.deleteFiles(deletedIds);  // حذف الصور القديمة أولاً
}
// ثم رفع الصور الجديدة...
```

---

## 4. استراتيجية AWS S3 — `services/storage/s3.strategy.js`

### 4.1 الاختلاف عن Cloudinary

| | Cloudinary | AWS S3 |
|---|---|---|
| التحويل التلقائي | ✅ (`crop: 'limit'`, جودة تلقائية) | ❌ (الصورة تُرفع كما هي) |
| CDN | ✅ تلقائي | يحتاج CloudFront منفصل |
| المجلد الافتراضي | `'mobile-recipes'` | `'uploads/images'` |
| SDK | `cloudinary` | `@aws-sdk/client-s3` |

### 4.2 رفع ملف لـ S3

```javascript
async uploadFile(file) {
  if (!this.s3Client) await this._initializeS3();
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileExtension = file.originalname.split('.').pop();
  const key = `${this.folder}/${uniqueSuffix}.${fileExtension}`;
  // 'uploads/images/1735000000-123456789.jpg'

  await this.s3Client.send(new PutObjectCommand({
    Bucket: this.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // لا نضيف ACL: 'public-read' — AWS تمنعه في الحسابات الحديثة
  }));

  return {
    url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
    filename: key,
  };
}
```

**لماذا ممنوع `ACL: 'public-read'`؟**
AWS أضافت حظر تلقائي على "Block all public access" في إعدادات S3 الافتراضية الجديدة. إضافة `ACL: 'public-read'` ستتسبب في خطأ "Access Denied". بدلاً من ذلك، يُدار الوصول العام عبر Bucket Policy.

### 4.3 التحقق بدون تحميل — `HeadObjectCommand`

```javascript
async healthCheck() {
  const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
  await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  return true;
}
```
`HeadBucketCommand` ← يتحقق من وجود الـ bucket وإمكانية الوصول إليه بدون تحميل أي بيانات — أسرع وأرخص تكلفةً (AWS تُحصِّل على كل GET/PUT).

---

## 5. كيف يختار الخادم الاستراتيجية؟

من [الدرس السابع](./07-storage-service.md) (`storage.service.js`):

```javascript
function createStorageStrategy() {
  switch (process.env.STORAGE_TYPE) {
    case 'cloudinary': return new CloudinaryStorageStrategy();
    case 's3':         return new S3StorageStrategy();
    default:           return new LocalStorageStrategy();  // 'local' أو فارغ
  }
}
```

لا تغيير في كود المتحكمات — `storage.uploadFile()` و`storage.uploadFiles()` تعملان بنفس الطريقة مهما كانت الاستراتيجية.

---

## 6. رحلة رفع صور الوصفة من البداية للنهاية

```text
POST /posts/
         ↓
المستخدم يرفع وصفة بـ 3 صور
req.files = [img1, img2, img3]  (Multer: memoryStorage)
         ↓
validator.newPost  // يتحقق من title, content, location...
         ↓ (نجح)
validateRequest  // لا أخطاء → next()
         ↓
post.controller.createPost()
  1. posts.repository.create({ title, content, location, userId })
  2. storage.uploadFiles([img1, img2, img3])  // رفع الصور للسحابة
  3. postImages.repository.createMany([{url1}, {url2}, {url3}])
         ↓
{ id: 42, title: "...", images: [{url: "https://res.cloudinary.com/..."}, ...] }
```

---

## 7. مقارنة الاستراتيجيات الثلاث

| | Local | Cloudinary | AWS S3 |
|---|---|---|---|
| **البيئة** | تطوير | إنتاج | إنتاج |
| **دوام الملفات** | يُمسح عند إعادة النشر | دائم | دائم |
| **تحويل تلقائي** | ❌ | ✅ `limit 1920px` | ❌ |
| **الإعداد** | لا شيء | 3-4 متغيرات بيئة | 4 متغيرات بيئة |
| **التكلفة** | مجاني | مجاني (25GB) | مدفوع |

---

*[← الدرس الثالث عشر: اختبارات الخادم](./13-testing.md)*
