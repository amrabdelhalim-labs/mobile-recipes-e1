# شرح خدمة التخزين (storage.service.js)

## 📋 نظرة عامة

ملف `storage.service.js` هو **مصنع (Factory)** يختار **استراتيجية التخزين المناسبة** حسب الإعدادات.

---

## 🤔 ما المشكلة التي يحلها؟

### بدون StorageService:
```javascript
if (process.env.STORAGE_TYPE === 'local') {
// في كل ملف controller
  const storage = new LocalStorageStrategy();
} else if (process.env.STORAGE_TYPE === 'cloudinary') {
  const storage = new Cloud inaryStorageStrategy();
} else if (process.env.STORAGE_TYPE === 's3') {
  const storage = new S3StorageStrategy();
}
// تكرار هذا الكود في كل مكان! 😫
```

### مع StorageService:
```javascript
const storage = getStorageService();
// في أي controller
// يعطيك الاستراتيجية الصحيحة تلقائياً! ✅
```

---

## 🏭 Design Patterns المستخدمة

### 1. **Singleton Pattern** (نمط الكائن الوحيد)
- يضمن وجود **نسخة واحدة فقط** من الخدمة
- جميع الملفات تستخدم نفس النسخة

### 2. **Factory Pattern** (نمط المصنع)
- "المصنع" يقرر أي استراتيجية تُستخدم
- الكود لا يهتم بالتفاصيل: "أعطني نظام تخزين وكفى!"

### 3. **Strategy Pattern** (نمط الاستراتيجية)
- استراتيجيات مختلفة (Local, Cloudinary, S3)
- نفس الواجهة (Interface) للجميع
- يمكن التبديل بسهولة

---

## 📚 الكود الكامل مع الشرح

### القسم 1: الاستيرادات

```javascript
import LocalStorageStrategy from './local.strategy.js';
import CloudinaryStorageStrategy from './cloudinary.strategy.js';
import S3StorageStrategy from './s3.strategy.js';
```

**الشرح**: 
- استيراد جميع استراتيجيات التخزين الممكنة
- كل استراتيجية في ملف منفصل

---

### القسم 2: الخصائص الثابتة (Static Properties)

```javascript
class StorageService {
    static instance = null;
    static strategy = null;
}
```

**الشرح**:
- **`static`** = تنتمي للكلاس نفسه، ليس للأغراض (Objects)
- **`instance`** = النسخة الوحيدة من الخدمة
- **`strategy`** = الاستراتيجية المختارة (محجوز للاستخدام المستقبلي)

💡 **مثال**:
```javascript
StorageService.instance  // نفس القيمة دائماً
```

---

### القسم 3: الحصول على النسخة الوحيدة

```javascript
static getInstance() {
    if (!StorageService.instance) {
        StorageService.instance = StorageService.createStrategy();
    }
    return StorageService.instance;
}
```

**الشرح خطوة بخطوة**:

#### 1. **الفحص**:
```javascript
if (!StorageService.instance)
```
- هل توجد نسخة بالفعل؟
- إذا لا → أنشئ واحدة

#### 2. **الإنشاء**:
```javascript
StorageService.instance = StorageService.createStrategy();
```
- استدعاء `createStrategy()` لاختيار الاستراتيجية
- حفظها في `instance`

#### 3. **الإرجاع**:
```javascript
return StorageService.instance;
```
- إرجاع النسخة (الجديدة أو الموجودة)

**مثال**:
```javascript
const storage1 = StorageService.getInstance();
// المرة الأولى
// ينشئ نسخة جديدة

// المرة الثانية
const storage2 = StorageService.getInstance();
// يرجع نفس النسخة السابقة

console.log(storage1 === storage2);  // true ✅
```

---

### القسم 4: اختيار الاستراتيجية

```javascript
static createStrategy() {
    const storageType = (process.env.STORAGE_TYPE || 'local').toLowerCase();

    console.log(`🗄️  Initializing storage strategy: ${storageType}`);

    switch (storageType) {
        case 'cloudinary':
            return new CloudinaryStorageStrategy({
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                apiKey: process.env.CLOUDINARY_API_KEY,
                apiSecret: process.env.CLOUDINARY_API_SECRET,
                folder: process.env.CLOUDINARY_FOLDER || 'mobile-recipes',
            });

        case 's3':
            return new S3StorageStrategy({
                bucket: process.env.AWS_S3_BUCKET,
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                folder: process.env.AWS_S3_FOLDER || 'uploads/images',
            });

        case 'local':
        default:
            return new LocalStorageStrategy({
                uploadsDir: process.env.LOCAL_UPLOADS_DIR,
                baseUrl: process.env.LOCAL_BASE_URL || '/images',
            });
    }
}
```

**الشرح التفصيلي**:

#### 1. **قراءة نوع التخزين**:
```javascript
const storageType = (process.env.STORAGE_TYPE || 'local').toLowerCase();
```
- يقرأ `STORAGE_TYPE` من `.env`
- إذا لم يوجد → افتراضياً `'local'`
- يحول للأحرف الصغيرة (`toLowerCase()`)

💡 **أمثلة في `.env`**:
```env
STORAGE_TYPE=local  // استخدام التخزين المحلي
STORAGE_TYPE=cloudinary  // استخدام Cloudinary
STORAGE_TYPE=s3  // استخدام AWS S3
# لا شيء            → local (افتراضي)
```

#### 2. **طباعة معلومات**:
```javascript
console.log(`🗄️  Initializing storage strategy: ${storageType}`);
```
- للتأكيد في Console أي استراتيجية تُستخدم

#### 3. **الاختيار بـ Switch**:

##### أ. **Cloudinary** (خدمة سحابية):
```javascript
case 'cloudinary':
    return new CloudinaryStorageStrategy({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER || 'mobile-recipes',
    });
```

**متطلبات `.env`**:
```env
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=mycloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123def456
CLOUDINARY_FOLDER=mobile-recipes  # اختياري
```

##### ب. **AWS S3** (خدمة Amazon):
```javascript
case 's3':
    return new S3StorageStrategy({
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        folder: process.env.AWS_S3_FOLDER || 'uploads/images',
    });
```

**متطلبات `.env`**:
```env
STORAGE_TYPE=s3
AWS_S3_BUCKET=my-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_FOLDER=uploads/images  # اختياري
```

##### ج. **Local** (القرص المحلي) - الافتراضي:
```javascript
case 'local':
default:
    return new LocalStorageStrategy({
        uploadsDir: process.env.LOCAL_UPLOADS_DIR,
        baseUrl: process.env.LOCAL_BASE_URL || '/images',
    });
```

**متطلبات `.env`** (اختيارية):
```env
STORAGE_TYPE=local
LOCAL_UPLOADS_DIR=/custom/path/to/images  # اختياري
LOCAL_BASE_URL=/images                    # اختياري
```

---

### القسم 5: إعادة التعيين (للاختبارات)

```javascript
static reset() {
    StorageService.instance = null;
}
```

**الشرح**:
- يمسح النسخة الحالية
- **متى يُستخدم؟** في الاختبارات (Unit Tests) فقط

**مثال**:
```javascript
beforeEach(() => {
// في الاختبار
  StorageService.reset();
  process.env.STORAGE_TYPE = 'local';
});

test('should use local storage', () => {
  const storage = StorageService.getInstance();
  expect(storage).toBeInstanceOf(LocalStorageStrategy);
});
```

---

### القسم 6: معرفة النوع الحالي

```javascript
static getStorageType() {
    return (process.env.STORAGE_TYPE || 'local').toLowerCase();
}
```

**الشرح**:
- يرجع نوع التخزين المستخدم حالياً
- مفيد للتشخيص و Debugging

**مثال**:
```javascript
console.log(StorageService.getStorageType());
// 'local' أو 'cloudinary' أو 's3'
```

---

## 🔄 كيف يعمل النظام الكامل؟

```text
4. StorageService.getInstance()
   ↓
2. قراءة STORAGE_TYPE من .env
   ↓
3. أول استدعاء: getStorageService()
   ↓
1. التطبيق يبدأ
   ↓
5. هل instance موجود؟
   ├─ نعم  // أرجعه
   └─ لا  // أنشئ جديد
        ↓
6. createStrategy()
   ↓
7. اختر الاستراتيجية حسب STORAGE_TYPE
   ├─ 'local' → LocalStorageStrategy
   ├─ 'cloudinary' → CloudinaryStorageStrategy
   └─ 's3' → S3StorageStrategy
   ↓
8. حفظ في instance
   ↓
9. إرجاع الاستراتيجية
   ↓
10. استخدامها في Controllers
```

---

## 💡 أمثلة عملية

### مثال 1: استخدام في Controller

```javascript
import { getStorageService } from '../utilities/files.js';
// في post.controller.js

const createPost = async (req, res) => {
  // ...
  const storage = getStorageService();
  const uploadResults = await storage.uploadFiles(req.files);
  // يعمل مع أي استراتيجية! ✅
};
```

### مثال 2: التبديل بين الاستراتيجيات

#### Development (محلي):
```env
# .env.development
STORAGE_TYPE=local
```

#### Production (سحابي):
```env
# .env.production
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=myapp
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**لا تحتاج لتغيير أي كود!** فقط غير `.env`

---

## 🛡️ الواجهة الموحدة (Interface)

جميع الاستراتيجيات تدعم نفس الوظائف:

```javascript
interface StorageStrategy {
  uploadFile(file): Promise<{url, filename}>
  uploadFiles(files): Promise<Array<{url, filename}>>
  deleteFile(filename): Promise<boolean>
  deleteFiles(filenames): Promise<{success, failed}>
  getFileUrl(filename): string
  healthCheck(): Promise<boolean>
}
```

**الفائدة**: الكود يعمل مع أي استراتيجية بدون تغيير!

---

## ⚙️ الإعدادات التفصيلية

### 1. **Local Storage**
```env
STORAGE_TYPE=local
LOCAL_UPLOADS_DIR=./public/images      # المجلد (اختياري)
LOCAL_BASE_URL=/images                 # URL للوصول (اختياري)
```

**المميزات**:
- ✅ بسيط ومجاني
- ✅ لا يحتاج إعدادات خارجية
- ❌ لا يعمل مع خوادم متعددة (Multi-server)

### 2. **Cloudinary**
```env
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=mycloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123
CLOUDINARY_FOLDER=my-app              # اختياري
```

**المميزات**:
- ✅ تحسين الصور تلقائياً
- ✅ CDN سريع
- ✅ مجاني حتى 25GB

### 3. **AWS S3**
```env
STORAGE_TYPE=s3
AWS_S3_BUCKET=my-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
AWS_S3_FOLDER=uploads                 # اختياري
```

**المميزات**:
- ✅ موثوق وقابل للتوسع
- ✅ رخيص للتخزين الكبير
- ❌ يحتاج إعداد AWS

---

## 🔍 Debugging

### فحص الاستراتيجية المستخدمة:
```javascript
const storage = StorageService.getInstance();
console.log(storage.constructor.name);
// 'LocalStorageStrategy' أو 'CloudinaryStorageStrategy' أو 'S3StorageStrategy'
```

### فحص النوع من `.env`:
```javascript
console.log(StorageService.getStorageType());
// 'local' أو 'cloudinary' أو 's3'
```

---

## ❓ أسئلة شائعة

### 1. **لماذا نستخدم Singleton؟**
لضمان استخدام نفس الإعدادات في كل مكان، وتجنب إنشاء نسخ متعددة.

### 2. **هل يمكن استخدام استراتيجيتين معاً؟**
نعم، لكن تحتاج لتعديل الكود:
```javascript
const localStorage = new LocalStorageStrategy();
const cloudStorage = new CloudinaryStorageStrategy();
```

### 3. **ماذا لو كتبت STORAGE_TYPE خطأ؟**
```env
STORAGE_TYPE=amazons3  # خطأ! ❌
```
سيستخدم `local` (الافتراضي) تلقائياً.

### 4. **كيف أختبر استراتيجيات مختلفة؟**
```javascript
beforeEach(() => {
// في الاختبارات
  StorageService.reset();
});

test('local storage', () => {
  process.env.STORAGE_TYPE = 'local';
  const storage = StorageService.getInstance();
  // ...
});
```

---

## 🎯 النقاط المهمة

✅ **StorageService** = مصنع يختار الاستراتيجية تلقائياً  
✅ **Singleton Pattern** = نسخة واحدة فقط  
✅ **Factory Pattern** = اختيار ذكي حسب `.env`  
✅ **Strategy Pattern** = واجهة موحدة لجميع أنواع التخزين  
✅ **التبديل** بين الاستراتيجيات بتغيير `.env` فقط  

---

**📖 الخطوة التالية**: [متحكم المنشورات](./08-post-controller.md)
