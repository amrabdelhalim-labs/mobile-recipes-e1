# شرح نظام رفع الملفات (files.js)

## 📋 نظرة عامة

ملف `files.js` يدير **رفع وتخزين الصور** في التطبيق باستخدام مكتبة Multer ونظام التخزين.

---

## 📚 الكود الكامل

```javascript
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import StorageService from "../services/storage/storage.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesRoot = path.resolve(__dirname, "../public/images");

const extractFileName = (imageUrl) => {
    if (!imageUrl) return null;
    try {
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            const urlObj = new URL(imageUrl);
            return path.basename(urlObj.pathname);
        }
        return path.basename(imageUrl);
    } catch {
        return null;
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('يجب أن تكون الملفات من نوع صورة فقط!'), false);
        }
    }
});

const getStorageService = () => StorageService.getInstance();

export { upload, imagesRoot, extractFileName, getStorageService };
```

---

## 📦 القسم الأول: الاستيرادات

```javascript
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import StorageService from "../services/storage/storage.service.js";
```

### الشرح:
- **`multer`**: مكتبة لمعالجة رفع الملفات في Express
- **`path`**: للتعامل مع مسارات الملفات
- **`fileURLToPath`**: لتحويل URL إلى مسار
- **`StorageService`**: خدمة مخصصة لتخزين الملفات

---

## 📁 القسم الثاني: تحديد مجلد الصور

```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesRoot = path.resolve(__dirname, "../public/images");
```

### الشرح:

#### 1. **الملف الحالي**:
```javascript
const __filename = fileURLToPath(import.meta.url);
```
💡 **مثال**: `C:\project\server\utilities\files.js`

#### 2. **المجلد الحالي**:
```javascript
const __dirname = path.dirname(__filename);
```
💡 **مثال**: `C:\project\server\utilities`

#### 3. **مجلد الصور**:
```javascript
const imagesRoot = path.resolve(__dirname, "../public/images");
```

**ماذا يعني `"../public/images"`؟**
- `..` = ارجع مجلد واحد للأعلى
- من `utilities/` إلى `server/`
- ثم ادخل `public/images/`

💡 **النتيجة**: `C:\project\server\public\images`

---

## 🔍 القسم الثالث: استخراج اسم الملف من URL

```javascript
const extractFileName = (imageUrl) => {
    if (!imageUrl) return null;
    try {
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            const urlObj = new URL(imageUrl);
            return path.basename(urlObj.pathname);
        }
        return path.basename(imageUrl);
    } catch {
        return null;
    }
};
```

### الشرح التفصيلي:

#### 1. **فحص القيمة**:
```javascript
if (!imageUrl) return null;
```
إذا كانت `null` أو `undefined` أو فارغة → أرجع `null`

#### 2. **معالجة URL كامل**:
```javascript
if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const urlObj = new URL(imageUrl);
    return path.basename(urlObj.pathname);
}
```

**مثال**:
```javascript
const url = 'https://example.com/images/photo123.jpg?size=large';

const urlObj = new URL(url);
// urlObj.pathname = '/images/photo123.jpg'

path.basename(urlObj.pathname);
// النتيجة: 'photo123.jpg'
```

#### 3. **معالجة مسار نسبي**:
```javascript
return path.basename(imageUrl);
```

**مثال**:
```javascript
path.basename('/images/photo123.jpg');
// النتيجة: 'photo123.jpg'

path.basename('photo123.jpg');
// النتيجة: 'photo123.jpg'
```

#### 4. **معالجة الأخطاء**:
```javascript
catch {
    return null;
}
```
إذا كان URL غير صحيح → أرجع `null`

---

## 📤 القسم الرابع: إعدادات Multer

```javascript
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('يجب أن تكون الملفات من نوع صورة فقط!'), false);
        }
    }
});
```

### الشرح التفصيلي:

#### 1. **نوع التخزين**:
```javascript
storage: multer.memoryStorage(),
```

**ماذا يعني ذلك؟**
- الملفات تُخزن في **الذاكرة (RAM)** مؤقتاً
- **لا تُحفظ** على القرص الصلب مباشرة
- خدمة التخزين (StorageService) ستتولى الحفظ لاحقاً

**لماذا؟**
- مرونة أكثر (يمكن رفع الصورة لخدمة سحابية)
- معالجة أفضل (يمكن ضغط الصورة قبل الحفظ)

#### 2. **حد حجم الملف**:
```javascript
limits: { fileSize: 5 * 1024 * 1024 },
```

**الحساب**:
```
5 * 1024 * 1024 = 5,242,880 بايت = 5 ميجابايت
```

**ماذا يحدث إذا تجاوز المستخدم الحد؟**
```javascript
// رد الخادم
{
  "message": "File too large"
}
// Status: 400
```

#### 3. **فلتر نوع الملف**:
```javascript
fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('يجب أن تكون الملفات من نوع صورة فقط!'), false);
    }
}
```

**ما هو MIME Type؟**
- نوع الملف الذي يرسله المتصفح
- **أمثلة**:
  - `image/jpeg` = صورة JPG ✅
  - `image/png` = صورة PNG ✅
  - `image/gif` = صورة GIF ✅
  - `application/pdf` = ملف PDF ❌
  - `text/plain` = ملف نصي ❌

**المعاملات**:
- **`req`**: الطلب (Request)
- **`file`**: الملف المرفوع
- **`cb`**: Callback للإشارة للقبول أو الرفض

**القبول**:
```javascript
cb(null, true);
//  ↑     ↑
//  لا خطأ  مقبول
```

**الرفض**:
```javascript
cb(new Error('يجب أن تكون الملفات من نوع صورة فقط!'), false);
//  ↑ رسالة الخطأ                                         ↑ مرفوض
```

---

## 🏭 القسم الخامس: الحصول على خدمة التخزين

```javascript
const getStorageService = () => StorageService.getInstance();
```

### الشرح:

**ما هو Singleton Pattern؟**
- يضمن وجود **نسخة واحدة فقط** من الكائن
- `getInstance()` يرجع دائماً نفس النسخة

**لماذا نستخدمه؟**
- كفاءة: لا نحتاج لإنشاء نسخة جديدة في كل مرة
- اتساق: جميع الملفات تستخدم نفس الإعدادات

---

## 🔄 كيف يعمل النظام الكامل؟

### الخطوة 1: المستخدم يرفع صورة
```javascript
// في Frontend
const formData = new FormData();
formData.append('title', 'وصفة كبسة');
formData.append('images', imageFile);

fetch('/api/posts', {
  method: 'POST',
  body: formData
});
```

### الخطوة 2: Multer يستقبل الملف
```javascript
// في routes/post.routes.js
router.post('/posts', upload.array('images', 5), createPost);
//                    ↑ يقبل حتى 5 صور
```

### الخطوة 3: فحص نوع الملف
```javascript
// في fileFilter
if (file.mimetype.startsWith('image/')) {
  // ✅ صورة - مقبول
} else {
  // ❌ ليس صورة - مرفوض
}
```

### الخطوة 4: تخزين في الذاكرة
```javascript
file = {
  fieldname: 'images',
  originalname: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 245760,
  buffer: <Buffer ff d8 ff e0 00 10 ...>  // البيانات
}
```

### الخطوة 5: في Controller، رفع للتخزين
```javascript
// في post.controller.js
const storage = getStorageService();
const uploadResults = await storage.uploadFiles(req.files);
```

### الخطوة 6: حفظ على القرص أو السحابة
```javascript
// في storage.service.js
await strategy.uploadFile(file);
// يحفظ في public/images/ أو AWS S3
```

---

## 💡 أمثلة عملية

### مثال 1: رفع صورة واحدة
```javascript
// في routes
router.post('/profile-photo', upload.single('photo'), updateProfilePhoto);

// في controller
const file = req.file;  // ملف واحد
```

### مثال 2: رفع عدة صور
```javascript
// في routes
router.post('/posts', upload.array('images', 5), createPost);

// في controller
const files = req.files;  // مصفوفة من الملفات
console.log(files.length);  // عدد الصور
```

### مثال 3: استخراج اسم ملف
```javascript
const url1 = 'https://example.com/images/photo123.jpg';
extractFileName(url1);  // 'photo123.jpg'

const url2 = '/images/photo456.png';
extractFileName(url2);  // 'photo456.png'

const url3 = 'photo789.gif';
extractFileName(url3);  // 'photo789.gif'
```

---

## 🛡️ الأمان والتحقق

### 1. **فحص حجم الملف**:
```javascript
limits: { fileSize: 5 * 1024 * 1024 }  // 5 MB
```

### 2. **فحص نوع الملف**:
```javascript
if (file.mimetype.startsWith('image/'))
```

⚠️ **ملاحظة**: هذا الفحص **غير كافٍ** وحده!

### 3. **فحوصات إضافية موصى بها**:

#### أ. فحص امتداد الملف:
```javascript
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ext = path.extname(file.originalname).toLowerCase();
if (!allowedExtensions.includes(ext)) {
  return cb(new Error('امتداد غير مدعوم'));
}
```

#### ب. فحص `magic bytes` (البايتات السحرية):
```javascript
import fileType from 'file-type';

const type = await fileType.fromBuffer(file.buffer);
if (!type || !type.mime.startsWith('image/')) {
  return cb(new Error('ليس ملف صورة حقيقي'));
}
```

---

## ⚙️ خيارات Multer الإضافية

### 1. **رفع ملف واحد**:
```javascript
upload.single('fieldName')
// req.file
```

### 2. **رفع عدة ملفات (نفس الحقل)**:
```javascript
upload.array('fieldName', maxCount)
// req.files
```

### 3. **رفع ملفات متعددة (حقول مختلفة)**:
```javascript
upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
])
// req.files.profilePhoto
// req.files.coverPhoto
```

### 4. **رفع أي ملفات**:
```javascript
upload.any()
// req.files (مصفوفة لجميع الملفات)
```

---

## ❓ أسئلة شائعة

### 1. **لماذا نستخدم `memoryStorage` بدلاً من `diskStorage`؟**
- **مرونة**: يمكن رفع الصور لخدمة سحابية (AWS S3)
- **معالجة**: يمكن ضغط الصورة قبل الحفظ
- **نظافة**: لا نترك ملفات مؤقتة على القرص

### 2. **ماذا لو رفع المستخدم ملف ضخم؟**
Multer يرفضه تلقائياً ويرد:
```javascript
{
  "message": "File too large"
}
```

### 3. **هل يمكن تغيير حد الحجم؟**
نعم:
```javascript
limits: { fileSize: 10 * 1024 * 1024 }  // 10 MB
```

### 4. **كيف أحذف صورة من القرص؟**
```javascript
const storage = getStorageService();
await storage.deleteFile(filename);
```

---

## 🎯 النقاط المهمة

✅ **Multer** يعالج رفع الملفات في Express  
✅ **memoryStorage** يخزن الملفات في الذاكرة مؤقتاً  
✅ **fileFilter** يتحقق من أن الملف صورة  
✅ حد الحجم **5 MB** للأمان  
✅ **StorageService** يتولى الحفظ النهائي  

---

**📖 الخطوة التالية**: [استراتيجية التخزين المحلي](./06-storage-strategy.md)
