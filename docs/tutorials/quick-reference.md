# 🎓 مرجع سريع - خارطة الشروحات

## 🎯 اختر مسارك

### 🌱 **أنا مبتدئ كامل**
```
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
| هيكل التطبيق | ⭐⭐⭐☆☆ | 25 دقيقة | 🔥 عالية |
| التكامل مع الخادم | ⭐⭐⭐☆☆ | 20 دقيقة | 🔥 عالية جداً |
| سياق المصادقة | ⭐⭐⭐⭐☆ | 30 دقيقة | 🔥 عالية جداً |
| هوك الصور | ⭐⭐⭐☆☆ | 25 دقيقة | ⚡ متوسطة |
| هندسة المكونات | ⭐⭐☆☆☆ | 15 دقيقة | ⚡ متوسطة |
| اختبارات العميل | ⭐⭐⭐⭐☆ | 30 دقيقة | 🔥 عالية |

---

## 🧭 مسارات تعليمية مقترحة

### 🎯 مسار 1: الأساسيات (3-4 ساعات)
```
1. دليل المفاهيم
2. إعداد الخادم
3. قاعدة البيانات
4. JWT
5. Middleware
6. هيكل التطبيق
7. سياق المصادقة
```

### 🎯 مسار 2: نظام الملفات (2 ساعة)
```
1. نظام رفع الملفات
2. استراتيجية التخزين المحلي
3. خدمة التخزين
4. هوك معرض الصور
```

### 🎯 مسار 3: الأمان والمصادقة (2 ساعة)
```
1. JWT
2. Middleware المصادقة
3. سياق المصادقة في React
4. تدفق تسجيل الدخول الكامل
```

### 🎯 مسار 4: الجودة والاختبارات (2 ساعة)
```
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
