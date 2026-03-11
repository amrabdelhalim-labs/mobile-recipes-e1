# شرح استراتيجية التخزين المحلي (local.strategy.js)

## 📋 نظرة عامة

ملف `local.strategy.js` يحتوي على **نظام تخزين الملفات محلياً** (على القرص الصلب).  
تم شرح هذا الملف سابقاً بالتفصيل - راجع الشرح الأول للنظام الكامل.

---

## 🎯 الملخص السريع

### **الوظائف الرئيسية**:

#### 1. **`uploadFile(file)`**
```javascript
const result = await strategy.uploadFile(file);
// { url: '/images/1234567890-123.jpg', filename: '1234567890-123.jpg' }
```
- يرفع ملف واحد
- ينشئ اسم فريد (timestamp + random)
- يحفظه في `server/public/images/`
- يرجع URL ورابط الملف

#### 2. **`uploadFiles(files)`**
```javascript
const results = await strategy.uploadFiles([file1, file2, file3]);
// [
//   { url: '/images/123.jpg', filename: '123.jpg' },
//   { url: '/images/456.jpg', filename: '456.jpg' },
//   ...
// ]
```
- يرفع عدة ملفات دفعة واحدة
- يستخدم `Promise.all()` للسرعة

#### 3. **`deleteFile(filename)`**
```javascript
const deleted = await strategy.deleteFile('/images/photo.jpg');
// true (نجح) أو false (فشل)
```
- يحذف ملف واحد
- يستخرج اسم الملف من URL تلقائياً

#### 4. **`deleteFiles(filenames)`**
```javascript
const result = await strategy.deleteFiles(['photo1.jpg', 'photo2.jpg']);
// { success: ['photo1.jpg'], failed: ['photo2.jpg'] }
```
- يحذف عدة ملفات
- يرجع قائمتين: نجح وفشل

#### 5. **`getFileUrl(filename)`**
```javascript
const url = strategy.getFileUrl('photo.jpg');
// '/images/photo.jpg'
```
- يُنشئ URL كامل من اسم الملف

#### 6. **`healthCheck()`**
```javascript
const isHealthy = await strategy.healthCheck();
// true (المجلد موجود وقابل للكتابة) أو false
```
- يفحص صلاحية نظام التخزين

---

## 🏗️ البنية

```text
LocalStorageStrategy
├── constructor() - الإعداد الأولي
├── _ensureDirectoryExists() - إنشاء المجلد إذا لم يوجد
├── uploadFile() - رفع ملف واحد
├── uploadFiles() - رفع عدة ملفات
├── deleteFile() - حذف ملف واحد
├── deleteFiles() - حذف عدة ملفات
├── getFileUrl() - الحصول على URL
├── healthCheck() - فحص صحي
└── _extractFilename() - استخراج اسم الملف
```

---

## 💡 مثال الاستخدام

```javascript
import LocalStorageStrategy from './services/storage/local.strategy.js';

// إنشاء النظام
const storage = new LocalStorageStrategy({
  uploadsDir: '/path/to/uploads',
  baseUrl: '/images'
});

// رفع صورة
const result = await storage.uploadFile(fileFromMulter);
console.log(result.url);  // '/images/1234567890-123.jpg'

// حذف صورة
await storage.deleteFile(result.url);
```

---

## 🔗 العلاقة مع الملفات الأخرى

```text
files.js (Multer)
  // يرفع الملف للذاكرة
getStorageService()
  // يحصل على النسخة
StorageService
  // يختار الاستراتيجية
LocalStorageStrategy
  // يحفظ على القرص
server/public/images/
```

---

## 📖 للتفاصيل الكاملة

راجع **الشرح الأول** الذي قدمته في بداية المحادثة - يحتوي على:
- شرح مفصل لكل سطر
- أمثلة عملية
- أسئلة وأجوبة
- تفاصيل فنية

---

**📖 الخطوة التالية**: [خدمة التخزين](./07-storage-service.md)
