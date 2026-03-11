# 📚 الشروحات التعليمية للمشروع

هذا المجلد يحتوي على شروحات تفصيلية بالعربية لجميع الملفات المعقدة في المشروع.
الشروحات مكتوبة بأسلوب تعليمي بسيط مناسب للمبتدئين.

---

## � ابدأ من هنا!

### للمبتدئين:
1. 📖 **ابدأ بـ**: [دليل المفاهيم الأساسية](./concepts-guide.md)
2. 🖥️ **ثم اقرأ**: شروحات الخادم بالترتيب
3. 📱 **ثم انتقل لـ**: شروحات التطبيق

### للمتقدمين:
- تصفح الشروحات حسب الحاجة
- استخدم الفهرس أدناه للانتقال السريع

---

## 📂 هيكل الشروحات

### 📘 المفاهيم العامة
- [**دليل المفاهيم الأساسية**](./concepts-guide.md) - جميع المفاهيم المستخدمة في المشروع

---

### 🖥️ شروحات الخادم (Server)

#### **الإعدادات الأساسية**
1. [إعداد الخادم الرئيسي](./server/01-app-setup.md) - شرح `app.js`
2. [الاتصال بقاعدة البيانات](./server/02-database-connection.md) - شرح `database.js`

#### **المصادقة والحماية**
3. [نظام JWT للمصادقة](./server/03-jwt-authentication.md) - شرح `jwt.js`
4. [وسيط المصادقة](./server/04-auth-middleware.md) - شرح `user.middleware.js`

#### **رفع وتخزين الملفات**
5. [نظام رفع الملفات](./server/05-file-upload-system.md) - شرح `files.js`
6. [استراتيجية التخزين المحلي](./server/06-storage-strategy.md) - شرح `local.strategy.js`
7. [خدمة التخزين](./server/07-storage-service.md) - شرح `storage.service.js`
14. [استراتيجيات التخزين السحابي](./server/14-cloud-storage.md) - شرح `cloudinary.strategy.js`, `s3.strategy.js`, `storage.interface.js`

#### **بنية البيانات والأنماط**
8. [نمط المستودع](./server/08-repository-pattern.md) - شرح Repository Pattern كامل
9. [المتحكمات](./server/09-controllers.md) - شرح `user.controller.js`, `post.controller.js`, `comment.controller.js`, `like.controller.js`
10. [النماذج](./server/10-models.md) - شرح User, Post, Comment, Like, Post_Image (Sequelize)
11. [المسارات](./server/11-routes.md) - شرح جميع مسارات API (خريطة كاملة)
12. [المدققات](./server/12-validators.md) - شرح express-validator, تجميع الأخطاء, تنظيف الملفات
13. [اختبارات الخادم](./server/13-testing.md) - E2E والمستودعات والاختبار الشامل

---

### 📱 شروحات العميل (Client/App)

#### **البنية الأساسية**
1. [هيكل التطبيق الرئيسي](./client/01-app-structure.md) - شرح `App.tsx`
2. [التكامل مع الخادم](./client/02-api-integration.md) - شرح `axios.ts` و `urls.ts` و `post.types.ts`

#### **إدارة الحالة والسياق**
3. [سياق المصادقة](./client/03-auth-context.md) - شرح `AuthContext.tsx`

#### **الهوكس المخصصة (Custom Hooks)**
4. [هوك معرض الصور](./client/04-photo-gallery-hook.md) - شرح `usePhotoGallery.ts`

#### **هندسة المكونات والاختبارات**
5. [هندسة المكونات وتسمية الملفات](./client/05-component-naming.md) - أفضل الممارسات
6. [اختبارات العميل](./client/06-client-testing.md) - شرح Vitest والاختبارات

#### **الصفحات والمكوّنات التفصيلية**
7. [صفحات الدخول والتسجيل](./client/07-pages-auth.md) - شرح `Login.tsx` و`Register.tsx` (Formik, Yup, IonAlert, Preferences)
8. [صفحات المنشورات](./client/08-pages-posts.md) - شرح `AllPosts`, `PostDetail`, `CreatePost`, `UpdatePost`, `MyPosts`, `GetPost`, `main.tsx`
9. [المكوّنات](./client/09-components.md) - شرح `PostCard`, `Like`, `CommentForm`, `CommentList`, `UserAvatar`, `EditableField`, `LocationPicker`, `TextEditor`, `Header`, `Menu`
10. [الأدوات والأنواع](./client/10-utils-types.md) - شرح `postsEvents.ts` (Custom Event) و`user.types.ts` (TypeScript Interfaces)

---

## 📖 كيفية استخدام هذه الشروحات

### 1. **للمبتدئين الكاملين**
```text
دليل المفاهيم  // إعداد الخادم  // الاتصال بقاعدة البيانات → JWT → ...
```

### 2. **لمن يعرف الأساسيات**
```text
اذهب مباشرة للملف الذي تريد فهمه
```

### 3. **أثناء القراءة**
- ✅ اقرأ ببطء - لا تتعجل
- ✅ جرب الأمثلة في الكود
- ✅ اصنع ملاحظاتك الخاصة
- ✅ ارجع للشروحات عند الحاجة

---

## 🎯 الأهداف التعليمية

بعد قراءة هذه الشروحات ستفهم:

### Backend:
- ✅ كيفية بناء **REST API** بـ Express و Node.js
- ✅ نظام **المصادقة** باستخدام JWT
- ✅ التعامل مع **قاعدة البيانات** PostgreSQL باستخدام Sequelize
- ✅ **رفع وإدارة** الملفات والصور
- ✅ **Design Patterns**: Singleton, Factory, Strategy

### Frontend:
- ✅ بناء تطبيق موبايل بـ **Ionic React**
- ✅ إدارة الحالة باستخدام **Context API**
- ✅ التعامل مع **الكاميرا** ومعرض الصور في Capacitor
- ✅ **React Hooks** و Custom Hooks
- ✅ **التوجيه** (Routing) في React
- ✅ **التكامل مع الخادم** (Axios, URL Constants, TypeScript Types)
- ✅ **هندسة المكونات** وأفضل ممارسات تسمية الملفات
- ✅ **الاختبارات** بـ Vitest (37 اختبار وحدة + E2E)

---

## 💡 نصائح للتعلم الفعال

### ✅ افعل:
- خذ وقتك في الفهم
- جرب الكود بيدك
- اصنع مشروع صغير بنفسك
- اطرح الأسئلة

### ❌ لا تفعل:
- تتعجل في القراءة
- تنسخ الكود بدون فهم
- تقفز بين الموضوعات بدون ترتيب
- تحاول حفظ كل شيء (ارجع للشروحات عند الحاجة)

---

## 🔗 روابط إضافية

### التعلم الذاتي:
- [دليل المفاهيم](./concepts-guide.md) - جميع المفاهيم في مكان واحد

### التوثيق الرسمي:
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Ionic Framework](https://ionicframework.com/docs/)
- [Capacitor](https://capacitorjs.com/docs/)
- [Sequelize ORM](https://sequelize.org/)

---

## 📊 خريطة التعلم الموصى بها

```text
1. دليل المفاهيم الأساسية  // ابدأ هنا!
   ↓
2. الخادم (Server):
   إعداد الخادم  // قاعدة البيانات → JWT → Middleware
   ↓
3. نظام الملفات:
   رفع الملفات  // التخزين المحلي  // خدمة التخزين
   ↓
4. التطبيق (Client):
   هيكل التطبيق  // التكامل مع الخادم  // سياق المصادقة  // هوك الصور
   ↓
5. الهندسة والاختبارات:
   هندسة المكونات  // اختبارات العميل
   ↓
5. 🎉 الآن أنت مستعد للبناء!
```

---

## 📝 ملاحظات مهمة

- **اللغة**: جميع الشروحات بالعربية، أسماء الملفات بالإنجليزية
- **الأسلوب**: تعليمي بسيط مناسب للمبتدئين
- **الأمثلة**: كل شرح يحتوي على أمثلة عملية
- **الكود**: يمكنك نسخه وتجربته مباشرة

---

## 🤝 المساهمة

لاحظت خطأ؟ لديك اقتراح لتحسين الشرح؟
- افتح Issue في المشروع
- أو اقترح التعديل مباشرة

---

**📅 آخر تحديث**: فبراير 2026  
**📧 للأسئلة**: راجع الشروحات أو اطرح سؤالك في Issues
