# الدرس الثاني عشر: المدققات (Validators) ✅

> **هدف الدرس:** تفهم كيف تعمل طبقة التحقق من البيانات في وصفاتي — باستخدام مكتبة `express-validator` — لمنع الحفظ في قاعدة البيانات قبل التأكد من صحة البيانات الواردة.

---

## 1. لماذا نحتاج للتحقق أصلاً؟

### مشكلة بدون تحقق:

```text
bcrypt.hash("", 10)  // كلمة مرور فارغة!
         ↓ (بدون تحقق)
المستخدم يرسل: { email: "ليس-إيميل", name: "" }
repositories.user.create(...)  // يُحفظ في DB
         ↓
خطأ غريب في قاعدة البيانات أو بيانات مكسورة
```

### مع التحقق:

```text
validator.register  // يكتشف: email غير صحيح, name فارغ
         ↓
المستخدم يرسل: { email: "ليس-إيميل", name: "" }
         ↓
validateRequest  // يُرسل 400 مع رسائل واضحة
         ↓
{ errors: ["صيغة الإيميل غير صحيحة", "الاسم مطلوب"] }
         ↓ (لا يصل للمتحكم)
```

---

## 2. مكتبة `express-validator` — كيف تعمل؟

مكتبة `express-validator` تعمل على **مرحلتين**:

```text
    body('email').isEmail().withMessage('...')
المرحلة 1: التعريف (في ملفات validators/)
         ↓ (لا تُنفَّذ بعد — فقط تُعرَّف)

المرحلة 2: التنفيذ (في validator.middleware.js)
    validationResult(req)  // هنا تُنفَّذ وتُجمَّع الأخطاء
```

تشبه وصفة الطبخ:
- المرحلة 1: كتابة الوصفة
- المرحلة 2: الطبخ الفعلي

---

## 3. مدقق المستخدمين — `validators/user.validator.js`

### 3.1 التحقق لتسجيل حساب جديد

```javascript
import { body } from 'express-validator';
```
`body` ← دالة من المكتبة تبني قاعدة تحقق لحقل في `req.body`.

```javascript
const register = [
```
`register` ← **مصفوفة** من قواعد التحقق (وليس دالة واحدة). كل عنصر قاعدة مستقلة.

```javascript
  body('name')
    .notEmpty()
    .withMessage('الاسم مطلوب')
```
- `body('name')` ← نستهدف حقل `name` في `req.body`
- `.notEmpty()` ← يفشل إذا كان الحقل فارغاً `""` أو غير موجود
- `.withMessage('الاسم مطلوب')` ← الرسالة التي تظهر للمستخدم عند الفشل

```javascript
    .isLength({ min: 3 })
    .withMessage('يجب أن يكون الاسم 3 أحرف على الأقل'),
```
- `.isLength({ min: 3 })` ← الطول لا يقل عن 3 أحرف
- كل `.withMessage()` يرتبط بالشرط الذي **قبله مباشرة**

```javascript
  body('email')
    .notEmpty()
    .withMessage('الإيميل مطلوب')
    .isEmail()
    .withMessage('صيغة الإيميل غير صحيحة'),
```
- `.isEmail()` ← يتحقق تلقائياً أن الصيغة `xxx@yyy.zzz`

```javascript
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
];
```
كلمة المرور: موجودة وطولها 6+.

### 3.2 التحقق لتسجيل الدخول

```javascript
const login = [
  body('email')
    .notEmpty()
    .withMessage('الإيميل مطلوب')
    .isEmail()
    .withMessage('صيغة الإيميل غير صحيحة'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];
```
أبسط من التسجيل — لا نتحقق من طول كلمة المرور عند الدخول (الخادم هو من يتحقق من صحتها بـ bcrypt).

### 3.3 التحقق لتحديث المعلومات

```javascript
const updateInfo = [
  body('name')
    .optional({ checkFalsy: true })
    .isLength({ min: 3 })
    .withMessage('يجب أن يكون الاسم 3 أحرف على الأقل'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
];
```
- `.optional({ checkFalsy: true })` ← الحقل اختياري
  - إذا لم يُرسَل → لا تحقق
  - إذا أُرسِل → يجب أن يحقق الشروط
- `checkFalsy: true` ← يتجاهل `""` و `null` و `undefined` (كلها "اختيارية")

```javascript
export { register, login, updateInfo };
```

---

## 4. مدقق التعليقات — `validators/comment.validator.js`

```javascript
import { body } from 'express-validator';

const addComment = [
  body('text')
    .notEmpty()
    .withMessage('نص التعليق مطلوب')
    .isString()
    .withMessage('التعليق يجب أن يكون نصاً')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('التعليق يجب أن يكون بين 1 و 1000 حرف'),
];
```
- `.isString()` ← يتحقق أن نوعه نص (ليس رقماً أو مصفوفة)
- `.trim()` ← يحذف المسافات من البداية والنهاية قبل التحقق من الطول
- `.isLength({ min: 1, max: 1000 })` ← بين 1 و 1000 حرف

```javascript
const updateComment = [
  body('text')
    .notEmpty()
    .withMessage('نص التعليق مطلوب')
    .isString()
    .withMessage('التعليق يجب أن يكون نصاً')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('التعليق يجب أن يكون بين 1 و 1000 حرف'),
];

export { addComment, updateComment };
```
نفس القواعد — التعليق الجديد والمُعدَّل لهما نفس الشروط.

---

## 5. مدقق الوصفات — `validators/post.validator.js`

### 5.1 التحقق لإنشاء وصفة جديدة

```javascript
const newPost = [
  body('title')
    .notEmpty()
    .withMessage('العنوان مطلوب')
    .isString()
    .withMessage('العنوان يجب أن يكون نصاً')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('العنوان يجب أن يكون بين 3 و 200 حرف'),
```
العنوان: موجود، نص، بين 3-200 حرف.

```javascript
  body('content')
    .notEmpty()
    .withMessage('المحتوى مطلوب')
    .isString()
    .withMessage('المحتوى يجب أن يكون نصاً')
    .trim()
    .isLength({ min: 10 })
    .withMessage('المحتوى يجب أن يكون 10 أحرف على الأقل'),
```
المحتوى: موجود، نص، 10 أحرف فأكثر.

```javascript
  body('steps')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) && (typeof parsed !== 'object' || parsed === null)) {
            throw new Error('الخطوات يجب أن تكون بصيغة صحيحة');
          }
        } catch (e) {
          if (e.message === 'الخطوات يجب أن تكون بصيغة صحيحة') throw e;
          throw new Error('صيغة الخطوات غير صحيحة');
        }
      } else if (
        value !== undefined &&
        value !== null &&
        !Array.isArray(value) &&
        typeof value !== 'object'
      ) {
        throw new Error('الخطوات يجب أن تكون بصيغة صحيحة');
      }
      return true;
    }),
```

هذا **مدقق مخصص** (Custom Validator) يستخدم `.custom()`:

```text
القيمة الواردة (steps) يمكن أن تكون:

الحالة 1: نص JSON   → '[ {"step":1, "text":"اقطع البصل"} ]'
    - نُحوِّله بـ JSON.parse
    - نتحقق أنه مصفوفة أو كائن

الحالة 2: مصفوفة/كائن مباشرة → [{...}, {...}]
    - نقبله مباشرة

الحالة 3: null أو فارغ  // نتجاهله (اختياري)

الحالة 4: أي نوع آخر (رقم, boolean)  // نرفضه
```

- `.optional({ nullable: true, checkFalsy: true })` ← اختياري تماماً
- `return true` في نهاية الدالة ← إذا وصلنا هنا بدون رمي خطأ → التحقق نجح

```javascript
  body('country')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('الدولة يجب أن تكون نصاً')
    .trim()
    .isLength({ max: 100 })
    .withMessage('اسم الدولة طويل جداً'),
  body('region')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('المنطقة يجب أن تكون نصاً')
    .trim()
    .isLength({ max: 100 })
    .withMessage('اسم المنطقة طويل جداً'),
```
البلد والمنطقة: اختياريان، نص قصير (≤100 حرف).

### 5.2 التحقق لتعديل وصفة (`updatePost`)

فرق مهم: كل الحقول **اختيارية** — المستخدم قد يُعدِّل العنوان فقط دون المحتوى.

```javascript
body('deletedImages')
  .optional({ nullable: true, checkFalsy: true })
  .custom((value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error('صيغة الصور المحذوفة غير صحيحة');
        }
      } catch {
        throw new Error('صيغة الصور المحذوفة غير صحيحة');
      }
    } else if (value !== undefined && value !== null && !Array.isArray(value)) {
      throw new Error('صيغة الصور المحذوفة غير صحيحة');
    }
    return true;
  }),
```
`deletedImages` ← قائمة بـ IDs الصور التي يريد حذفها. تأتي كنص JSON `"[1, 2, 3]"` من FormData.

---

## 6. وسيط تنفيذ التحقق — `validator.middleware.js`

هذا الملف هو **جسر** بين مكتبة `express-validator` والخادم.

```javascript
import { validationResult } from 'express-validator';
import fs from 'node:fs';
import path from 'node:path';
import { imagesRoot } from '../utilities/files.js';
```
- `validationResult` ← تجمع نتائج كل قواعد التحقق التي **مرّت على الطلب**
- `fs` ← نظام الملفات — لحذف الملفات المرفوعة عند الفشل
- `imagesRoot` ← مسار مجلد الصور

```javascript
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
```
- تُستدعى هذه الدالة بعد تشغيل قواعد التحقق
- `validationResult(req)` ← تجمع كل النتائج من الـ `req` الذي مرّ على validators قبلها

```javascript
  if (!errors.isEmpty()) {
```
`isEmpty()` ← هل لا توجد أخطاء؟ إذا لم تكن فارغة → يوجد أخطاء.

```javascript
    const files = [];
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (req.file) {
      files.push(req.file);
    }
```
نجمع الملفات المرفوعة — `req.files` للمصفوفة، `req.file` للملف المفرد.

```javascript
    if (files.length > 0) {
      for (const file of files) {
        const filePath = path.join(imagesRoot, file.filename);
        fs.promises.unlink(filePath).catch((err) => {
          if (err?.code !== 'ENOENT') {
            console.error('Failed to delete uploaded image:', err.message);
          }
        });
      }
    }
```
**هذا الجزء مهم جداً!**

إذا رُفعت ملفات **ثم** اكتُشف خطأ في بيانات أخرى → الملفات المرفوعة يجب حذفها.

```text
upload.single()  // رفع الصورة بنجاح → وُضعت في مجلد uploads/
         ↓
المستخدم يرسل: صورة + title = ""
         ↓
validator.newPost  ← title فارغ  // خطأ!
         ↓
validateRequest  // يكتشف الخطأ
  // يحذف الصورة التي رُفعت
  // يرسل 400
```

بدون هذا الكود: ملفات "يتيمة" تتراكم في السيرفر! (ثم من يحذفها؟)

- `fs.promises.unlink(filePath)` ← يحذف الملف
- `.catch((err) => { if (err?.code !== 'ENOENT')... })` ← إذا الملف غير موجود أصلاً (`ENOENT`) → لا تسجّل خطأ

```javascript
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};
```
- `errors.array()` ← يحوّل نتائج التحقق لمصفوفة من الكائنات: `[{ msg: 'الاسم مطلوب', path: 'name', ... }]`
- إذا لا يوجد أخطاء → `next()` ← انتقل للمتحكم

---

## 7. كيف تتكامل الطبقات؟

```text
POST /account/register  { name: "i", email: "wrong", password: "" }
         ↓
validator.register (المصفوفة)
   ├── body('name').isLength({min:3})  // يُسجِّل: "الاسم قصير"
   ├── body('email').isEmail()  // يُسجِّل: "صيغة الإيميل غير صحيحة"
   └── body('password').notEmpty()  // يُسجِّل: "كلمة المرور مطلوبة"
         ↓
validateRequest
   errors = validationResult(req)
   errors.isEmpty() = false
   → res.status(400).json({ errors: [
       { msg: "يجب أن يكون الاسم 3 أحرف على الأقل", path: "name" },
       { msg: "صيغة الإيميل غير صحيحة", path: "email" },
       { msg: "كلمة المرور مطلوبة", path: "password" }
     ]})
         ↓ (لا يُكمل)
controller.register  // لا تُستدعى أبداً
```

---

## 8. المقارنة: `.notEmpty()` مقابل `.optional()`

| الكود | المعنى | متى يُستخدم |
|-------|--------|-------------|
| `.notEmpty()` | **مطلوب** — يفشل إذا فارغ | تسجيل/إنشاء |
| `.optional()` | **اختياري** — يتجاهل إذا غائب | تحديث جزئي |
| `.optional({ nullable: true })` | اختياري + يقبل `null` | حقول قد تُمسَح صراحةً |
| `.optional({ checkFalsy: true })` | يتجاهل `""` و `null` و `false` | حقول FormData |

---

## 9. خلاصة — أنواع المدققات المستخدمة

| المُدقِّق | ما يتحقق منه |
|-----------|-------------|
| `.notEmpty()` | الحقل موجود وغير فارغ |
| `.isEmail()` | صيغة إيميل صحيحة |
| `.isString()` | نوعه نص |
| `.isLength({ min, max })` | الطول في المدى المطلوب |
| `.trim()` | حذف المسافات قبل التحقق |
| `.custom((value) => {...})` | منطق تحقق مخصص (JSON.parse مثلاً) |
| `.withMessage('...')` | الرسالة عند فشل الشرط السابق |
| `.optional()` | الحقل اختياري |

---

*الدرس الثاني عشر من ثلاثة عشر — [← الدرس الحادي عشر: المسارات](./11-routes.md) | [الدرس الثالث عشر: اختبارات الخادم →](./13-testing.md)*
