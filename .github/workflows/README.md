# GitHub Actions Workflow Setup

## 🔧 إعداد المتغيرات المطلوبة

أضف هذه المتغيرات في: `Settings` → `Secrets and variables` → `Actions` → **Secrets**

### المتغيرات الإلزامية

| Secret | الوصف | مثال |
|--------|-------|-------|
| `VITE_API_URL` | عنوان API الخاص بالخادم | `https://your-api.onrender.com` |

### المتغيرات الاختيارية

| Secret | الوصف | القيمة الافتراضية |
|--------|-------|-----------------|
| `VITE_BASE_URL` | المسار الأساسي للتطبيق | `/mobile-recipes-e1/` تلقائياً على GitHub Actions |

> **ملاحظة:** لا حاجة لضبط `VITE_BASE_URL` عند النشر على GitHub Pages — يتم اكتشافها تلقائياً عبر متغير البيئة `GITHUB_ACTIONS` في `vite.config.ts`.

---

## 🚀 كيف يعمل الـ Workflow

عند عمل Push للفرع `main` يعمل jobان بالتوازي:

### Job 1: deploy-server
- **لا يوجد build step** — الخادم JavaScript خالص يعمل مباشرة
- ينسخ كل محتويات `server/` إلى فرع `server` نظيف
- **محتوى فرع server:** `app.js`, `package.json`, `Procfile`, المجلدات...

### Job 2: deploy-app
- يثبت dependencies من `app/package-lock.json`
- يبني التطبيق (`tsc && vite build`) داخل `app/`
- ينسخ محتويات `app/dist/` + `.nojekyll` إلى فرع `web` نظيف

**تشغيل يدوي:** يمكن تشغيل الـ workflow يدوياً من تبويب Actions مع اختيار:
- `both` — نشر الخادم والتطبيق
- `server` — الخادم فقط
- `app` — التطبيق فقط

---

## ✅ إعداد GitHub Pages (اختياري)

لرؤية التطبيق على GitHub Pages:

1. اذهب إلى `Settings` → `Pages`
2. **Source:** اختر **Deploy from a branch**
3. **Branch:** اختر `web` → `/ (root)`
4. احفظ التغييرات

سيكون الموقع متاحاً على:
```
https://[username].github.io/mobile-recipes-e1/
```

---

## 📝 للتطوير المحلي

أنشئ ملف `.env.local` في مجلد `app` (مستثنى من git):
```env
VITE_API_URL=http://localhost:3000
```

---

## 🔍 استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| فشل بناء التطبيق | تحقق من `VITE_API_URL` في Secrets |
| الموقع لا يفتح | تأكد من تفعيل GitHub Pages في Settings |
| تكرار الملفات في الفروع | الـ Workflow يستخدم orphan branch نظيف — لن يحدث |
| خطأ `not a git repository` | المنطق الحالي يحافظ على `.git` أثناء الحذف |

راجع سجلات الـ Actions في:
```
Repository → Actions → Build & Deploy
```
