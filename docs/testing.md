# الاختبارات — وصفاتي

## نظرة عامة

المشروع يحتوي على مجموعتين من الاختبارات:
- **اختبارات الخادم:** نظام مخصص بدون مكتبات خارجية — 4 أنواع (121 اختبار)
- **اختبارات التطبيق:** Vitest + Testing Library — 6 ملفات (37 اختبار)

**إجمالي الاختبارات:** 158 اختبار (121 خادم + 37 تطبيق)

---

## تشغيل الاختبارات

### الخادم

```bash
cd server

# تشغيل جميع الاختبارات
npm run test:all

# أو تشغيل كل مجموعة على حدة
npm test                     # repositories.test.js (36 اختبار)
npm run test:comprehensive   # comprehensive-test.js (43 اختبار)
npm run test:full-stack      # integration.test.js (46 اختبار) — يتطلب خادماً يعمل
npm run test:e2e             # api.test.js (7+ اختبار)
```

**المتطلبات:** قاعدة بيانات PostgreSQL نشطة — يستخدم قاعدة البيانات من `.env`

### التطبيق

```bash
cd app

# تشغيل واحد
npm test

# وضع المراقبة (للتطوير)
npm run test:watch

# مع تقرير التغطية
npm run test:coverage
```

**المتطلبات:** لا يحتاج خادم — جميع الاختبارات تستخدم mocks

---

## اختبارات الخادم

### المجموعة 1: Repository Tests (36 اختبار)

```bash
npm test
```

تختبر جميع عمليات CRUD لكل repository:

| المستودع | عدد الاختبارات | التغطية |
|---------|---------------|---------|
| User Repository | 7 | إنشاء، بحث، تحقق، تحديث، عدد |
| Post Repository | 5 | إنشاء، جلب مع ترقيم، بحث بالمستخدم، تفاصيل، تحديث |
| Comment Repository | 4 | إنشاء، جلب بالمنشور، جلب بالمستخدم، تحديث |
| Like Repository | 6 | تبديل، جلب بالمنشور، عدد، التحقق من وجود إعجاب |
| Repository Manager | 5 | فحص الصحة، نمط Singleton، الوصول للمستودعات |
| Cascade Operations | 3 | حذف متسلسل للمنشورات والتعليقات والإعجابات |
| التنظيف | 2 | التحقق من عدم وجود سجلات يتيمة |

---

### المجموعة 2: Comprehensive Tests (43 اختبار)

```bash
npm run test:comprehensive
```

تختبر دورة حياة البيانات الكاملة عبر 6 مراحل:

| المرحلة | الوصف | الاختبارات |
|---------|-------|-----------|
| 1. إنشاء المستخدمين | 3 مستخدمين، بحث بالبريد، عدد | 5 |
| 2. إنشاء المنشورات | 3 منشورات، تحديث، ترقيم | 6 |
| 3. إنشاء التعليقات | 3 تعليقات، تحديث، عدد | 6 |
| 4. الإعجابات | تبديل، عدد، التحقق | 6 |
| 5. التحقق من العلاقات | التأكد من سلامة البيانات | 4 |
| 6. الحذف والتنظيف | حذف الكل، التحقق من عدم وجود يتامى | 10 |

**الناتج المتوقع:**
```
Total Tests: 43
Passed: 43
Failed: 0
Success Rate: 100.00%

✓ All tests passed! Repository pattern is fully functional.

📊 Test Data Created:
   • Users created: 3
   • Posts created: 3
   • Comments created: 3
   • Likes created: 3+

✓ All test data cleaned up and deleted
```

---

### المجموعة 3: Integration Tests (46 اختبار)

```bash
npm run test:full-stack
```

تختبر تكامل كامل التطبيق مع الخادم قيد التشغيل. تشمل:
- تكامل المستودعات مع خدمة التخزين
- رفع الصور وحذفها
- مصادقة المستخدم من البداية للنهاية
- تنسيق الاستجابات

---

## اختبارات التطبيق (Vitest)

### الإعداد

الاختبارات تستخدم:
- **Vitest** — إطار الاختبار (متوافق مع Vite)
- **@testing-library/react** — اختبار مكونات React
- **jsdom** — بيئة DOM اصطناعية

ملف `setupTests.ts` يضبط:
- matchers إضافية لـ DOM
- mock لـ `window.matchMedia` (مطلوب من Ionic)
- mocks لـ Capacitor: `Preferences`, `Camera`, `Geolocation`

---

### ملفات الاختبار (6 ملفات، 37 اختبار)

| الملف | عدد الاختبارات | التغطية |
|-------|---------------|---------|
| `tests/types.test.ts` | 8 | التحقق من أنواع TypeScript مقابل استجابات الخادم |
| `tests/urls.test.ts` | 14 | التحقق من ثوابت الروابط مقابل مسارات الخادم |
| `tests/postsEvents.test.ts` | 5 | حافلة الأحداث المخصصة (emit, subscribe, cleanup) |
| `tests/usePhotoGallery.test.ts` | 4 | خطاف الكاميرا (التقاط، مسح، معالجة الأخطاء) |
| `tests/axios.test.ts` | 5 | إعداد عميل API (baseURL, headers, interceptors) |
| `src/App.test.tsx` | 1 | اختبار دخان — التطبيق يُعرض بدون أخطاء |

### الناتج المتوقع

```
✓ src/tests/types.test.ts (8 tests)
✓ src/tests/urls.test.ts (14 tests)
✓ src/tests/postsEvents.test.ts (5 tests)
✓ src/tests/usePhotoGallery.test.ts (4 tests)
✓ src/tests/axios.test.ts (5 tests)
✓ src/App.test.tsx (1 test)

Test Files  6 passed (6)
     Tests  37 passed (37)
```

---

## إطار الاختبار المخصص

الخادم يستخدم إطار اختبار خاص بدون مكتبات خارجية:

```javascript
// test.helpers.js
function assert(condition, message) { ... }
function logSection(title) { ... }
function logStep(message) { ... }
function printSummary() { ... }
```

### لماذا بدون مكتبات؟

| الميزة | مكتبات (Jest/Mocha) | إطار مخصص |
|--------|---------------------|------------|
| الاعتماديات | عديدة | صفر |
| سرعة التشغيل | بطيء | فوري |
| حجم node_modules | كبير | لا زيادة |
| مناسب للتعليم | معقد | واضح ومباشر |

---

## الملخص الكامل

| المجموعة | الإطار | عدد الاختبارات |
|---------|--------|---------------|
| خادم: Repositories | مخصص | 36 |
| خادم: Comprehensive | مخصص | 43 |
| خادم: Full Stack | مخصص | 46 |
| تطبيق: Vitest | Vitest + Testing Library | 37 |
| **المجموع** | — | **162** |

---

## استكشاف الأخطاء

### "فشل الاتصال بقاعدة البيانات"
- تحقق من ملف `.env`
- تأكد من تشغيل PostgreSQL
- تحقق من وجود قاعدة البيانات والصلاحيات

### "Repository غير مهيأ"
- تحقق من وجود `server/repositories/index.js`
- تأكد من استدعاء `getRepositoryManager()` بشكل صحيح

### "فشل الاختبارات"
- اقرأ رسالة الخطأ بتمعن
- تحقق من حالة قاعدة البيانات
- تأكد من نظافة الحالة بين الاختبارات
