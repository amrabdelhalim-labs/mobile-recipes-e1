# 🎓 مرجع سريع - خارطة الشروحات

## 🎯 اختر مسارك

### 🌱 **أنا مبتدئ كامل**
```text
1. دليل المفاهيم الأساسية
2. إعداد الخادم الرئيسي
3. الاتصال بقاعدة البيانات
4. نظام JWT للمصادقة
5. وسيط المصادقة
6. نظام رفع الملفات
7. هيكل التطبيق الرئيسي
8. سياق المصادقة
```

---

### 💼 **أعرف الأساسيات - أريد التعمق**
انتقل مباشرة لـ:
- **نظام التخزين**: الملفات 5-6-7
- **Context API**: ملف 3 في Client
- **Capacitor & Camera**: ملف 4 في Client

---

### 🚀 **محترف - أبحث عن معلومة محددة**
استخدم الفهرس التفصيلي أدناه للانتقال السريع

---

## 📑 الفهرس التفصيلي

### 📘 [دليل المفاهيم الأساسية](./concepts-guide.md)
**المحتوى**: جميع المفاهيم والمصطلحات المستخدمة في المشروع

**ما ستتعلمه**:
- REST API, Middleware, JWT
- ORM, MVC, CORS
- React Hooks, Context API
- Design Patterns
- HTTP Status Codes
- Best Practices

**الوقت المتوقع**: 30-45 دقيقة

---

## 🖥️ شروحات الخادم (Server)

### 1️⃣ [إعداد الخادم الرئيسي](./server/01-app-setup.md)
**الملف**: `server/app.js`

**ما ستتعلمه**:
- إنشاء Express Server
- إعدادات CORS
- Middleware الأساسي
- معالجة الأخطاء
- Health Check

**المفاهيم**: Express, CORS, Middleware, Error Handling  
**الوقت المتوقع**: 20 دقيقة  
**الصعوبة**: ⭐⭐☆☆☆

---

### 2️⃣ [الاتصال بقاعدة البيانات](./server/02-database-connection.md)
**الملف**: `server/utilities/database.js`

**ما ستتعلمه**:
- إعداد Sequelize ORM
- الاتصال بـ PostgreSQL
- طريقتين للاتصال (URL أو معلومات منفصلة)
- SSL Configuration
- Logging

**المفاهيم**: ORM, Sequelize, PostgreSQL, SSL  
**الوقت المتوقع**: 15 دقيقة  
**الصعوبة**: ⭐⭐☆☆☆

---

### 3️⃣ [نظام JWT للمصادقة](./server/03-jwt-authentication.md)
**الملف**: `server/utilities/jwt.js`

**ما ستتعلمه**:
- ما هو JWT؟
- توليد Token
- التحقق من Token
- بنية JWT (Header, Payload, Signature)
- صلاحية Token
- أمان JWT

**المفاهيم**: JWT, Authentication, Token, Security  
**الوقت المتوقع**: 25 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 4️⃣ [وسيط المصادقة](./server/04-auth-middleware.md)
**الملف**: `server/middlewares/user.middleware.js`

**ما ستتعلمه**:
- ما هو Middleware؟
- قراءة Authorization Header
- استخراج Token
- التحقق من صحة Token
- حماية المسارات

**المفاهيم**: Middleware, Authorization Header, Request/Response  
**الوقت المتوقع**: 20 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 5️⃣ [نظام رفع الملفات](./server/05-file-upload-system.md)
**الملف**: `server/utilities/files.js`

**ما ستتعلمه**:
- مكتبة Multer
- Memory Storage
- File Filter (التحقق من نوع الملف)
- حد حجم الملف
- MIME Types

**المفاهيم**: Multer, File Upload, Memory Storage, MIME Types  
**الوقت المتوقع**: 25 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 6️⃣ [استراتيجية التخزين المحلي](./server/06-storage-strategy.md)
**الملف**: `server/services/storage/local.strategy.js`

**ما ستتعلمه**:
- كلاس LocalStorageStrategy
- رفع ملف/ملفات
- حذف ملف/ملفات
- إنشاء أسماء فريدة
- Health Check

**المفاهيم**: File System, Class, Async/Await  
**الوقت المتوقع**: مراجعة الشرح الأول  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 7️⃣ [خدمة التخزين](./server/07-storage-service.md)
**الملف**: `server/services/storage/storage.service.js`

**ما ستتعلمه**:
- Singleton Pattern
- Factory Pattern
- Strategy Pattern
- اختيار استراتيجية التخزين
- دعم Local/Cloudinary/S3

**المفاهيم**: Design Patterns, Static Methods, Switch Statement  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

### 8️⃣ [نمط المستودع](./server/08-repository-pattern.md)
**الملفات**: `server/repositories/`

**ما ستتعلمه**:
- لماذا Repository Pattern؟
- `BaseRepository` — عمليات CRUD العامة
- `UserRepository`, `PostRepository`, `CommentRepository`, `LikeRepository`
- `RepositoryManager` — نقطة وصول مركزية

**المفاهيم**: Repository Pattern, Inheritance, Singleton  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

### 9️⃣ [المتحكمات](./server/09-controllers.md)
**الملفات**: `server/controllers/`

**ما ستتعلمه**:
- ما هي المتحكمات ولماذا نحتاجها؟
- `user.controller.js` — تسجيل, دخول, ملف شخصي, حذف حساب
- `post.controller.js` — إنشاء, جلب, تعديل, حذف الوصفات
- `comment.controller.js` — إضافة, تعديل, حذف التعليقات
- `like.controller.js` — تفعيل/إلغاء الإعجاب
- نمط التحقق المتكرر: مصادقة → مدخلات → وجود → ملكية → تنفيذ
- منطق تنظيف الملفات عند الخطأ

**المفاهيم**: Controllers, Middleware, REST API, try/catch, Pagination  
**الوقت المتوقع**: 40 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 1️⃣0️⃣ [النماذج](./server/10-models.md)
**الملفات**: `server/models/`

**ما ستتعلمه**:
- Sequelize DataTypes (INTEGER, STRING, TEXT, JSON)
- العلاقات: belongsTo, hasMany, belongsToMany
- جدول الارتباط (junction table) للإعجاب
- `models/index.js` — تشغيل associate لكل نموذج
- timestamps, onDelete CASCADE

**المفاهيم**: ORM, Associations, Foreign Key, Junction Table  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 1️⃣1️⃣ [المسارات](./server/11-routes.md)
**الملفات**: `server/routes/`

**ما ستتعلمه**:
- Router.use() وتجميع المسارات
- سلسلة middleware: validator → validateRequest → controller
- المعامل الديناميكي `/:id`
- ترتيب `/me` قبل `/:id`
- خريطة كاملة لجميع مسارات API

**المفاهيم**: Express Router, HTTP Methods, Dynamic Params  
**الوقت المتوقع**: 25 دقيقة  
**الصعوبة**: ⭐⭐☆☆☆

---

### 1️⃣2️⃣ [المدققات](./server/12-validators.md)
**الملفات**: `server/validators/`, `server/middlewares/validator.middleware.js`

**ما ستتعلمه**:
- express-validator: `body().notEmpty().isEmail().isLength()`
- مدقق مخصص: `.custom((value) => { JSON.parse(...) })`
- الحقول الاختيارية: `.optional({ nullable: true, checkFalsy: true })`
- `validator.middleware.js`: تنظيف الملفات عند فشل التحقق

**المفاهيم**: express-validator, Validation Chain, File Cleanup  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 1️⃣3️⃣ [اختبارات الخادم](./server/13-testing.md)
**الملفات**: `server/tests/`

**ما ستتعلمه**:
- E2E واختبارات المستودعات
- بيئة الاختبار ومتغيرات `.env`
- تشغيل الاختبارات

**المفاهيم**: Testing, E2E, Integration, Unit Tests  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

### 1️⃣4️⃣ [استراتيجيات التخزين السحابي](./server/14-cloud-storage.md)
**الملفات**: `services/storage/cloudinary.strategy.js`, `s3.strategy.js`, `storage.interface.js`

**ما ستتعلمه**:
- Strategy Pattern ونمط الواجهة المشتركة
- صور الوصفات بـ Cloudinary (`crop: 'limit'` — يحافظ على النسب العرضية)
- `_initPromise` لمنع التهيئة المتكررة عند الطلبات المتزامنة
- رفع وحذف صور متعددة بالتوازي (Promise.all)
- AWS S3: PutObjectCommand بدون ACL

**المفاهيم**: Strategy Pattern, Cloudinary, AWS S3, Promise.all, Dynamic Import  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

## 📱 شروحات العميل (Client/App)

### 1️⃣ [هيكل التطبيق الرئيسي](./client/01-app-structure.md)
**الملف**: `app/src/App.tsx`

**ما ستتعلمه**:
- بنية Ionic React App
- React Router
- Routes & Redirects
- Ionic CSS
- Dark Mode

**المفاهيم**: React Router, Ionic Framework, JSX/TSX  
**الوقت المتوقع**: 25 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 2️⃣ [سياق المصادقة](./client/03-auth-context.md)
**الملف**: `app/src/context/AuthContext.tsx`

**ما ستتعلمه**:
- Context API
- useState Hook
- useEffect Hook
- useCallback Hook
- Capacitor Preferences
- تسجيل الدخول/الخروج

**المفاهيم**: Context API, React Hooks, Local Storage  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

### 3️⃣ [هوك معرض الصور](./client/04-photo-gallery-hook.md)
**الملف**: `app/src/hooks/usePhotoGallery.ts`

**ما ستتعلمه**:
- Custom Hooks
- Capacitor Camera API
- CameraSource (Camera/Photos/Prompt)
- Result Types (Uri/Base64/DataUrl)
- جودة الصور

**المفاهيم**: Custom Hooks, Capacitor, Camera API  
**الوقت المتوقع**: 25 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 4️⃣ [هندسة المكونات وتسمية الملفات](./client/05-component-naming.md)
**الملفات**: جميع مكونات `app/src/components/` و `app/src/pages/`

**ما ستتعلمه**:
- قواعد تسمية المكونات (PascalCase, أسماء وصفية)
- اللاحقات القياسية (List, Form, Card, Picker, Detail)
- هيكل المجلدات النموذجي
- تحديث الاستيرادات عند إعادة التسمية

**المفاهيم**: React Conventions, File Organization, Clean Code  
**الوقت المتوقع**: 15 دقيقة  
**الصعوبة**: ⭐⭐☆☆☆

---

### 5️⃣ [اختبارات العميل](./client/06-client-testing.md)
**الملفات**: `app/src/setupTests.ts` و `app/src/tests/`

**ما ستتعلمه**:
- إعداد بيئة Vitest ومحاكاة Capacitor
- اختبار الأنواع والروابط والأحداث
- اختبار Custom Hooks بـ renderHook
- vi.fn() و vi.mock() و Matchers
- أفضل الممارسات في الاختبارات

**المفاهيم**: Vitest, Mocking, Testing Library, renderHook, act  
**الوقت المتوقع**: 30 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

### 6️⃣ [صفحات الدخول والتسجيل](./client/07-pages-auth.md)
**الملفات**: `app/src/pages/Login.tsx`, `Register.tsx`

**ما ستتعلمه**:
- نموذج Formik مع Yup (validateOnBlur/Change: false)
- IonAlert لعرض الأخطاء داخل Ionic
- حفظ التوكن بـ Capacitor Preferences
- useHistory للتوجيه بعد نجاح تسجيل الدخول
- استدعاء AuthContext داخل صفحة

**المفاهيم**: Formik, Yup, Capacitor Preferences, Ionic React  
**الوقت المتوقع**: 20 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

### 7️⃣ [صفحات المنشورات](./client/08-pages-posts.md)
**الملفات**: `AllPosts.tsx`, `PostDetail.tsx`, `CreatePost.tsx`, `UpdatePost.tsx`, `MyPosts.tsx`, `GetPost.tsx`, `main.tsx`

**ما ستتعلمه**:
- Infinite Scroll مع `useRef` لمنع التكرار
- Pull-to-Refresh مع `IonRefresher`
- Optimistic Update للإعجابات
- رفع الصور بـ `FormData` (Multipart)
- قائمة إجراءات الحذف بـ `IonActionSheet`
- تعديل المنشور: جلب البيانات وتعبئة الحقول
- اشتراك الصفحات بالأحداث عبر `onPostsChanged`

**المفاهيم**: Infinite Scroll, FormData, IonActionSheet, Draft.js, Swiper  
**الوقت المتوقع**: 40 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

### 8️⃣ [المكوّنات](./client/09-components.md)
**الملفات**: `PostCard`, `Like`, `CommentForm`, `CommentList`, `UserAvatar`, `EditableField`, `LocationPicker`, `TextEditor`, `Header`, `Menu`

**ما ستتعلمه**:
- بنية Props وواجهات TypeScript للمكوّنات
- Optimistic Update مع Rollback في `Like`
- `onAdded` callback في `CommentForm`
- Skeleton Loading في `CommentList`
- revokeObjectURL لتجنب تسريب الذاكرة في `UserAvatar`
- Capacitor Geolocation + Nominatim في `LocationPicker`
- Draft.js و`convertToRaw` في `TextEditor`

**المفاهيم**: Capacitor Geolocation, Draft.js, FormData, Skeleton, Optimistic Update  
**الوقت المتوقع**: 35 دقيقة  
**الصعوبة**: ⭐⭐⭐⭐☆

---

### 9️⃣ [الأدوات والأنواع](./client/10-utils-types.md)
**الملفات**: `utils/postsEvents.ts`, `types/user.types.ts`, `types/post.types.ts`

**ما ستتعلمه**:
- نظام الأحداث المخصصة (CustomEvent) عبر `window.dispatchEvent`
- دالة `onPostsChanged` التي تُرجع دالة تنظيف لـ useEffect
- `UserProfile` و`UserBasic` — أنواع TypeScript للمستخدمين
- الفرق بين النوع الكامل والمختصر في النظام

**المفاهيم**: CustomEvent, TypeScript Interfaces, Event-driven, Memory Cleanup  
**الوقت المتوقع**: 15 دقيقة  
**الصعوبة**: ⭐⭐⭐☆☆

---

## 📊 جدول المقارنة

| الموضوع | الصعوبة | الوقت | الأولوية |
|---------|---------|-------|----------|
| المفاهيم الأساسية | ⭐⭐☆☆☆ | 30-45 دقيقة | 🔥 عالية جداً |
| إعداد الخادم | ⭐⭐☆☆☆ | 20 دقيقة | 🔥 عالية جداً |
| قاعدة البيانات | ⭐⭐☆☆☆ | 15 دقيقة | 🔥 عالية |
| JWT | ⭐⭐⭐☆☆ | 25 دقيقة | 🔥 عالية جداً |
| Middleware | ⭐⭐⭐☆☆ | 20 دقيقة | 🔥 عالية |
| رفع الملفات | ⭐⭐⭐☆☆ | 25 دقيقة | ⚡ متوسطة |
| التخزين المحلي | ⭐⭐⭐☆☆ | مراجعة | ⚡ متوسطة |
| خدمة التخزين | ⭐⭐⭐⭐☆ | 30 دقيقة | ⚡ متوسطة |
| التخزين السحابي | ⭐⭐⭐⭐☆ | 30 دقيقة | ⚡ متوسطة |
| هيكل التطبيق | ⭐⭐⭐☆☆ | 25 دقيقة | 🔥 عالية |
| التكامل مع الخادم | ⭐⭐⭐☆☆ | 20 دقيقة | 🔥 عالية جداً |
| سياق المصادقة | ⭐⭐⭐⭐☆ | 30 دقيقة | 🔥 عالية جداً |
| هوك الصور | ⭐⭐⭐☆☆ | 25 دقيقة | ⚡ متوسطة |
| هندسة المكونات | ⭐⭐☆☆☆ | 15 دقيقة | ⚡ متوسطة |
| اختبارات العميل | ⭐⭐⭐⭐☆ | 30 دقيقة | 🔥 عالية |
| صفحات الدخول والتسجيل | ⭐⭐⭐☆☆ | 20 دقيقة | 🔥 عالية |
| صفحات المنشورات | ⭐⭐⭐⭐☆ | 40 دقيقة | 🔥 عالية جداً |
| المكوّنات | ⭐⭐⭐⭐☆ | 35 دقيقة | 🔥 عالية |
| الأدوات والأنواع | ⭐⭐⭐☆☆ | 15 دقيقة | ⚡ متوسطة |

---

## 🧭 مسارات تعليمية مقترحة

### 🎯 مسار 1: الأساسيات (3-4 ساعات)
```text
4. JWT
2. إعداد الخادم
3. قاعدة البيانات
1. دليل المفاهيم
5. Middleware
6. هيكل التطبيق
7. سياق المصادقة
```

### 🎯 مسار 2: نظام الملفات (2.5 ساعة)
```text
1. نظام رفع الملفات
2. استراتيجية التخزين المحلي
3. خدمة التخزين
4. استراتيجيات التخزين السحابي (Cloudinary + S3)
5. هوك معرض الصور
```

### 🎯 مسار 3: الأمان والمصادقة (2 ساعة)
```text
1. JWT
2. Middleware المصادقة
3. سياق المصادقة في React
4. تدفق تسجيل الدخول الكامل
```

### 🎯 مسار 4: الجودة والاختبارات (2 ساعة)
```text
1. هندسة المكونات وتسمية الملفات
2. التكامل مع الخادم (Axios, URLs, Types)
3. اختبارات العميل (Vitest)
4. فحص الورك فلو قبل الرفع (validate-workflow.mjs)
```

---

## 💡 نصائح سريعة

### ⏰ إدارة الوقت
- خصص **20-30 دقيقة** لكل شرح
- خذ **استراحة 5 دقائق** بعد كل شرحين
- لا تحاول قراءة كل شيء في يوم واحد

### 📝 التدوين
- اصنع ملاحظات لكل موضوع
- اكتب الأمثلة المهمة
- دون الأسئلة للمراجعة لاحقاً

### 🔄 المراجعة
- راجع كل يومين-ثلاثة
- جرب بناء تطبيق صغير بنفسك
- ادرس الأخطاء التي تواجهها

---

## ❓ أسئلة شائعة

### س: من أين أبدأ؟
**ج**: [دليل المفاهيم الأساسية](./concepts-guide.md) ← ثم [إعداد الخادم](./server/01-app-setup.md)

### س: هل يجب أن أفهم Backend قبل Frontend؟
**ج**: لا، يمكنك البدء بأي منهما، لكن فهم Backend أولاً يساعد في فهم الصورة الكاملة.

### س: كم من الوقت أحتاج لإنهاء كل الشروحات؟
**ج**: حوالي **5-7 ساعات** للقراءة المركزة، لكن خذ وقتك ولا تتعجل.

### س: هل هناك مشاريع تدريبية؟
**ج**: المشروع نفسه هو التدريب! حاول تعديله وإضافة ميزات جديدة.

---

## 🔗 روابط سريعة

| الموضوع | الرابط |
|---------|--------|
| 📘 المفاهيم | [concepts-guide.md](./concepts-guide.md) |
| 🖥️ الخادم | [server/](./server/) |
| 📱 التطبيق | [client/](./client/) |
| 📖 الفهرس الرئيسي | [README.md](./README.md) |
| ⚙️ المساهمة | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| 🎨 التنسيق | `node format.mjs` — `node format.mjs --check` |
| 🔍 فحص الورك فلو | `node validate-workflow.mjs` |
| 📚 دليل الاختبارات | [docs/testing.md](../testing.md) |

---

**🎓 تذكر**: التعلم رحلة وليس سباق. خذ وقتك وتمتع بالتعلم! ✨
