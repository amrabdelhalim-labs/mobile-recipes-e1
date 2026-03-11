# دليل المساهمة — وصفاتي (mobile-recipes-e1)

> **اقرأ هذا الملف قبل إجراء أي تغيير.**
> هذه القواعد غير قابلة للتفاوض وتُطبَّق عند مراجعة الكود. أي انحراف يتطلب مبرراً صريحاً.

---

## 1. المعمارية أولاً

قبل كتابة أي كود، اقرأ توثيق توجيهات AI:

| الملف | اقرأه عند |
|-------|---------|
| [`docs/ai/README.md`](docs/ai/README.md) | دائماً — ابدأ من هنا |
| [`docs/ai/architecture.md`](docs/ai/architecture.md) | إجراء أي تغيير في الخادم أو العميل |
| [`docs/ai/feature-guide.md`](docs/ai/feature-guide.md) | إضافة كيان أو ميزة جديدة |

**ملخص القواعد الحرجة (القائمة الكاملة في `docs/ai/README.md`):**
- لا تستورد نموذج Sequelize مباشرة في المتحكم — استخدم `getRepositoryManager()`
- ترتيب middleware ثابت: `isAuthenticated` → `upload` (إن وجد) → المحققون → `validateRequest` → المتحكم
- المحققون يستخدمون `express-validator` (سلاسل `body()`) — لا تضع التحقق داخل المتحكمات
- `validateRequest` middleware يُنظِّف الملفات المرفوعة عند فشل التحقق — طبّقه دائماً بعد المحققين
- رمز المصادقة عبر `Preferences` (Capacitor) — لا `localStorage` أبداً
- التخزين عبر `getStorageService()` — لا تنشئ `StorageService` مباشرة
- ثوابت URL في `app/src/config/urls.ts` — لا تُضمِّن المسارات في المكونات
- طلبات HTTP عبر `api` (axios instance) من `app/src/config/axios.ts` — لا `fetch` أو `axios` خاماً
- جميع ارتباطات Sequelize عبر `model.associate(models)` في `models/index.js` فقط

---

## 2. أسماء الفروع

```text
main  // كود جاهز للإنتاج فقط؛ لا تُودِع مباشرة
feat/<topic>  // ميزة جديدة (مثال: feat/recipe-ratings)
fix/<topic>  // إصلاح خطأ (مثال: fix/image-upload-cleanup)
docs/<topic>  // توثيق فقط (مثال: docs/update-ai-guide)
chore/<topic>  // أدوات, اعتماديات, إعداد (مثال: chore/add-prettier)
refactor/<topic>  // إعادة هيكلة بدون تغيير في السلوك
```

---

## 3. رسائل الإيداع (Commit Messages)

**الصيغة:** [Conventional Commits](https://www.conventionalcommits.org/) — **بالإنجليزية فقط**.

```text
<type>(<scope>): <short description>

<body — list of changes, one per line starting with ->

<footer — breaking changes or issue references>
```

### الأنواع (Types)

| النوع | متى تستخدمه |
|-------|------------|
| `feat` | ميزة أو سلوك جديد |
| `fix` | إصلاح خطأ |
| `docs` | تغييرات في التوثيق فقط |
| `test` | إضافة أو تحديث اختبارات |
| `refactor` | إعادة هيكلة بدون تغيير في السلوك |
| `chore` | أدوات، إعداد، اعتماديات، CI |
| `style` | تنسيق فقط (بدون تغيير منطقي) |

### النطاقات (Scopes)

| النطاق | ينطبق على |
|--------|----------|
| `server` | مجلد `server/` |
| `app` | مجلد `app/` (Ionic client) |
| `docs` | مجلد `docs/` |
| `ci` | `.github/workflows/` |
| `ai` | `docs/ai/` تحديداً |

### قواعد الإيداع

1. **سطر الموضوع ≤ 72 حرفاً**
2. **الموضوع يستخدم صيغة الأمر** — "add"، "fix"، "update"، ليس "added"، "fixed"
3. **لا نقطة في نهاية سطر الموضوع**
4. **النص الأساسي إلزامي للإيداعات غير التافهة** — اذكر كل تغيير مهم
5. **افصل الموضوع عن النص بسطر فارغ**
6. **تغيير منطقي واحد لكل إيداع** — لا تخلط server + app + docs في إيداع واحد

### أمثلة

```bash
git commit -m "feat(server): add recipe rating entity with repository + validators
# ✅ صحيح

- Add Rating Sequelize model with associations to Recipe and User
- Register in models/index.js and add model.associate()
- Add RatingRepository extending BaseRepository
- Register in RepositoryManager as getRatingRepository()
- Add express-validator rules: score must be integer 1-5
- Add rating routes with correct middleware order
- Mount router at /posts/:id/ratings in app.js
- Cascade delete ratings when parent Recipe is deleted"

# ✅ صحيح (patch)
git commit -m "fix(app): use api axios instance in RatingService

- Replace raw axios.post() with api.post() to ensure token injection"

# ✅ صحيح (توثيق فقط)
git commit -m "docs(ai): update architecture with rating layer"

# ❌ خاطئ — موضوع عربي
git commit -m "إضافة التقييمات"

# ❌ خاطئ — نطاق مختلط
git commit -m "feat: add ratings server and app"

# ❌ خاطئ — لا نص في إيداع غير تافه
git commit -m "feat(server): add repository pattern"

# ❌ خاطئ — صيغة الماضي
git commit -m "feat(server): added rating endpoint"
```

---

## 4. استراتيجية التاجات (Tagging Strategy)

تُحدِّد التاجات **معالم الإصدار المهمة** — ليس كل إيداع.

### متى تنشئ تاجاً

| رفع الإصدار | المحفّز |
|------------|---------|
| `v1.0.0` (major) | أول إصدار جاهز للإنتاج، أو تغيير جذري (breaking change) |
| `v1.X.0` (minor) | ميزة جديدة مكتملة مع الاختبارات |
| `v1.X.Y` (patch) | إصلاح توثيق، إصلاح خطأ، تصحيح ثانوي |

**لا تضع تاجاً أبداً على:**
- إيداعات في منتصف العمل (work-in-progress)
- إيداعات بها اختبارات فاشلة
- إيداعات من نوع "Finished: X page"
- كل إيداع في فرع الميزة

### صيغة التاج — annotated tags حصراً

```bash
git tag -a v1.6.0 -m "v1.6.0 - Add Recipe Rating System
# تاج موصوف (استخدم دائماً -a — لا lightweight tags)

- Rating Sequelize model with User and Post associations
- RatingRepository extending BaseRepository
- express-validator rules: score integer 1-5, required
- Routes: POST /posts/:id/ratings, DELETE /posts/:id/ratings/:id
- Cascade delete when parent Recipe deleted
- App: StarRating component + useRatings hook"

# تاج على إيداع سابق
git tag -a v1.0.0 <hash> -m "v1.0.0 - ..."

# رفع التاج إلى GitHub
git push origin v1.6.0
```

### قواعد رسالة التاج

1. **السطر الأول:** `vX.Y.Z - عنوان بشري واضح`
2. **النص:** قائمة بأهم التغييرات
3. **اذكر أعداد الاختبارات** عند تغييرها (قبل → بعد)
4. **بالإنجليزية فقط**

---

## 5. تنسيق الكود

**جميع الكود منسّق بـ Prettier** قبل كل إيداع. لا قرارات مسافات يدوية.

```bash
node format.mjs
# تنسيق جميع الملفات (من جذر المشروع — يعمل على جميع الأنظمة)

# التحقق بدون كتابة (CI — يخرج 1 إذا كان غير منسّق)
node format.mjs --check

# أو لكل حزمة:
cd server && npm run format
cd app && npm run format
```

**إعداد Prettier** (`.prettierrc.json` في `server/` و`app/`):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**القواعد:**
- مسافة بادئة 2 فراغ — دائماً، لا tabs
- علامات اقتباس مفردة للسلاسل النصية
- فواصل trailing في الهياكل متعددة الأسطر (متوافق مع ES5)
- أقصى عرض للسطر: 100 حرف
- لا تُعدِّل المسافات يدوياً — دع Prettier يقرر

---

## 6. قائمة التحقق قبل الإيداع

شغّل هذا قبل كل `git commit`:

```bash
cd server && npm run test:all
# 1. جميع اختبارات الخادم

# 2. جميع اختبارات العميل
cd app && npm run test

# 3. Prettier — تأكد من تطبيق التنسيق
node format.mjs --check

# 4. فحص الورك فلو (لازم عند تعديل .github/workflows أو server/package.json)
node validate-workflow.mjs
```

**يجب أن ينجح كل ما سبق قبل الإيداع.** إيداع بفشل اختبارات أو كود غير منسّق يجب ألا يصل إلى `main`.

---

## 7. تحديثات التوثيق

عند إضافة ميزة أو تغييرها:

| نوع التغيير | تحديثات التوثيق المطلوبة |
|------------|------------------------|
| كيان جديد (model + repo + controller) | `docs/ai/feature-guide.md`، `docs/ai/architecture.md`، `docs/api-endpoints.md` |
| نقطة نهاية REST جديدة | `docs/api-endpoints.md`، `docs/ai/README.md` (جدول API) |
| متغير بيئة جديد | `docs/ai/README.md` (قسم المتغيرات)، `README.md` |
| ملف اختبار جديد | `docs/testing.md` |
| مزود تخزين جديد | `docs/storage.md`، `docs/ai/architecture.md` |
| تغيير في المصادقة | `docs/ai/architecture.md` (قسم المصادقة) |

**إيداعات التوثيق يجب أن تكون منفصلة عن إيداعات الكود** (استخدم النوع `docs`).

---

## 8. متطلبات الاختبار

| مجموعة الاختبار | الأمر | يجب أن تنجح قبل |
|----------------|-------|----------------|
| اختبارات الخادم الشاملة | `cd server && npm run test:all` | أي إيداع على الخادم |
| اختبارات Vitest للعميل | `cd app && npm run test` | أي إيداع على العميل |

راجع [`docs/testing.md`](docs/testing.md) للتوثيق الكامل للاختبارات.

---

## 9. ملاحظات مزود التخزين

يدعم الخادم ثلاثة واجهات خلفية للتخزين يتحكم بها متغير `STORAGE_TYPE`:

| القيمة | الواجهة الخلفية |
|--------|----------------|
| `local` | نظام الملفات المحلي (`server/public/uploads/`) |
| `s3` | AWS S3 (يتطلب متغيرات `AWS_*`) |
| `cloudinary` | Cloudinary (يتطلب متغيرات `CLOUDINARY_*`) |

عند إضافة مزود تخزين جديد: اتبع الدليل في [`docs/ai/feature-guide.md`](docs/ai/feature-guide.md) (قسم مزود التخزين الجديد) وأضف المزود إلى `docs/storage.md`.
