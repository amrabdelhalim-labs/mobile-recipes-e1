# الدرس الحادي عشر: المسارات (Routes) 🗺️

> **هدف الدرس:** تفهم كيف تعمل المسارات (Routes) كجدول محتويات للخادم — تُعرِّف أي URL يذهب لأي متحكم، وما الوسائط التي تمرّ عليها أولاً.

---

## 1. ما هي المسارات؟

### التشبيه البسيط:

تخيّل مبنى فيه عدة شبابيك خدمة:

```
الزبون يأتي للباب الرئيسي (URL: /posts/create)
         ↓
الحارس (Router) يقرأ التذكرة (HTTP Method: POST)
         ↓
يرسله لشباك الوصفات (post.routes.js) → غرفة 3 (controller.newPost)
```

في الكود:
```
HTTP Request  →  app.js (الباب الرئيسي)
                   ↓ router.use('/posts', postRouter)
             post.routes.js (شباك الوصفات)
                   ↓ router.post('/create', ...)
             post.controller.js → newPost()
```

---

## 2. ملف التوجيه الرئيسي — `routes/index.js`

```javascript
import express from 'express';
import userRouter from './user.routes.js';
import postRouter from './post.routes.js';
import commentRouter from './comment.routes.js';
import likeRouter from './like.routes.js';
```
نستورد كل المُوجِّهات الفرعية.

```javascript
const router = express.Router();
```
`express.Router()` ← ينشئ مُوجِّهاً فرعياً — كمجموعة من المسارات يمكن ضمّها

```javascript
router.use('/account', userRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);
router.use('/likes', likeRouter);
```
- كل `router.use('/prefix', subRouter)` يربط **بادئة URL** بمُوجِّه فرعي
- مثال: طلب `POST /posts/create` → `postRouter` → يبحث عن `/create`

| البادئة | المُوجِّه | ما يشمل |
|---------|----------|---------|
| `/account` | `userRouter` | تسجيل، دخول، ملف شخصي |
| `/posts` | `postRouter` | الوصفات CRUD |
| `/comments` | `commentRouter` | التعليقات CRUD |
| `/likes` | `likeRouter` | الإعجابات |

```javascript
export default router;
```
نُصدّر المُوجِّه الرئيسي — `app.js` سيستخدمه هكذا:
```javascript
app.use('/api', router);
// الآن كل route تبدأ بـ /api
// /api/account/register
// /api/posts/create
```

---

## 3. مسارات المستخدمين — `user.routes.js`

```javascript
import express from 'express';
import * as controller from '../controllers/user.controller.js';
import * as validator from '../validators/user.validator.js';
import * as middleware from '../middlewares/user.middleware.js';
import { validateRequest } from '../middlewares/validator.middleware.js';
import { upload } from '../utilities/files.js';
```

| الاستيراد | الدور |
|-----------|-------|
| `controller` | الدوال التي تُعالج الطلب |
| `validator` | قواعد التحقق من البيانات |
| `middleware` | وسيط المصادقة |
| `validateRequest` | ينفّذ التحقق ويرسل الأخطاء |
| `upload` | وسيط Multer لرفع الملفات |

```javascript
const router = express.Router();
```
مُوجِّه جديد خاص بمسارات المستخدمين.

### تسجيل حساب جديد:

```javascript
router.post('/register', validator.register, validateRequest, controller.register);
```

الطلب يمرّ عبر **سلسلة من الوسائط** بهذا الترتيب:

```
POST /account/register
        ↓
validator.register       ← يُعرِّف قواعد التحقق (هل email صحيح؟ هل name ≥ 3 أحرف؟)
        ↓
validateRequest          ← يُنفِّذ التحقق ويُرسل 400 إذا فشل
        ↓
controller.register      ← يُكمل العملية (hash + save + response)
```

**لماذا الترتيب مهم؟**
لو وضعنا `controller.register` قبل التحقق → ستُنفَّذ العملية حتى لو البيانات خاطئة!

### تسجيل الدخول:

```javascript
router.post('/login', validator.login, validateRequest, controller.login);
```
نفس النمط — تحقق أولاً ثم المنطق.

### عرض الملف الشخصي (يتطلب تسجيل دخول):

```javascript
router.get('/profile', middleware.isAuthenticated, controller.getProfile);
```
- `middleware.isAuthenticated` ← يتحقق من JWT Token في الـ Header
- إذا فشل التحقق → يرسل `401 Unauthorized` ولا يصل للمتحكم
- إذا نجح → يضع `req.currentUser` ويمرّر للمتحكم

### تحديث صورة الملف الشخصي:

```javascript
router.put(
  '/profile/image',
  middleware.isAuthenticated,
  upload.single('profileImage'),
  controller.updateImage
);
```

ثلاثة وسائط قبل المتحكم:
```
isAuthenticated    ← هل مسجل دخول؟
       ↓
upload.single('profileImage')  ← يستقبل ملفاً واحداً باسم الحقل 'profileImage'
       ↓
controller.updateImage  ← يجد الملف في req.file
```

### إعادة الصورة الافتراضية:

```javascript
router.put('/profile/image/reset', middleware.isAuthenticated, controller.resetImage);
```
لا `upload` هنا لأننا لا نرفع ملفاً — فقط نُعيد الرابط الافتراضي.

### تحديث المعلومات الشخصية:

```javascript
router.put(
  '/profile/info',
  middleware.isAuthenticated,
  validator.updateInfo,
  validateRequest,
  controller.updateInfo
);
```
المصادقة + التحقق + التنفيذ.

### حذف الحساب:

```javascript
router.delete('/profile', middleware.isAuthenticated, controller.deleteUser);
```
`router.delete` ← يستجيب لـ HTTP Method `DELETE`.

---

## 4. مسارات الوصفات — `post.routes.js`

```javascript
router.post(
  '/create',
  middleware.isAuthenticated,
  upload.array('postImages', 10),
  validator.newPost,
  validateRequest,
  controller.newPost
);
```

- `upload.array('postImages', 10)` ← يستقبل **مصفوفة** من الملفات (حتى 10 صور)
  - `'postImages'` ← اسم الحقل في FormData
  - `10` ← الحد الأقصى لعدد الملفات
- الملفات ستكون في `req.files` (جمع)

```javascript
router.get('/', middleware.isAuthenticated, controller.getAllPosts);
```
`router.get('/')` ← الجذر `/posts` — يُرجع كل الوصفات.

```javascript
router.get('/me', middleware.isAuthenticated, controller.getMyPosts);
router.get('/:id', middleware.isAuthenticated, controller.getPostById);
```
- `/me` ← وصفاتي أنا خصيصاً
- `/:id` ← معامل ديناميكي — أي رقم في URL يُحفَظ في `req.params.id`

**ترتيب مهم:** `/me` يجب أن يكون **قبل** `/:id` — وإلا Express يعامل `me` كـ ID!

```javascript
router.put(
  '/:id',
  middleware.isAuthenticated,
  upload.array('postImages', 10),
  validator.updatePost,
  validateRequest,
  controller.updatePost
);

router.delete('/:id', middleware.isAuthenticated, controller.deletePost);
```

---

## 5. مسارات التعليقات — `comment.routes.js`

```javascript
router.get('/me', middleware.isAuthenticated, controller.getMyComments);
```
تعليقاتي أنا — لاحظ أنها `GET` وليس `POST`.

```javascript
router.post(
  '/:postId',
  middleware.isAuthenticated,
  validator.addComment,
  validateRequest,
  controller.addComment
);
```
- `/:postId` ← على أي وصفة التعليق؟ يُخزَّن في `req.params.postId`
- URL مثال: `POST /comments/5` ← تعليق على الوصفة رقم 5

```javascript
router.put(
  '/:id',
  middleware.isAuthenticated,
  validator.updateComment,
  validateRequest,
  controller.updateComment
);

router.delete('/:id', middleware.isAuthenticated, controller.deleteComment);
```
- `/:id` ← معرّف التعليق نفسه للتعديل/الحذف

---

## 6. مسارات الإعجابات — `like.routes.js`

```javascript
import express from 'express';
import * as controller from '../controllers/like.controller.js';
import * as middleware from '../middlewares/user.middleware.js';

const router = express.Router();

router.post('/:postId', middleware.isAuthenticated, controller.toggleLike);
router.get('/me', middleware.isAuthenticated, controller.getMyLikes);
router.get('/:postId', middleware.isAuthenticated, controller.getPostLikes);

export default router;
```

**ملاحظة:** لا يوجد `validator` هنا — الإعجاب لا يحتاج بيانات (فقط الـ `postId` من URL).

| المسار | الوصف |
|--------|-------|
| `POST /likes/:postId` | إعجاب/إلغاء إعجاب |
| `GET /likes/me` | المنشورات التي أعجبتني |
| `GET /likes/:postId` | من أعجب بهذه الوصفة |

---

## 7. خريطة جميع المسارات

```
الخادم (app.js)
└── /api (routes/index.js)
    ├── /account (user.routes.js)
    │   ├── POST   /register      ← validator + controller
    │   ├── POST   /login         ← validator + controller
    │   ├── GET    /profile       ← auth + controller
    │   ├── PUT    /profile/image ← auth + upload + controller
    │   ├── PUT    /profile/image/reset ← auth + controller
    │   ├── PUT    /profile/info  ← auth + validator + controller
    │   └── DELETE /profile       ← auth + controller
    │
    ├── /posts (post.routes.js)
    │   ├── POST   /create        ← auth + upload[] + validator + controller
    │   ├── GET    /              ← auth + controller
    │   ├── GET    /me            ← auth + controller
    │   ├── GET    /:id           ← auth + controller
    │   ├── PUT    /:id           ← auth + upload[] + validator + controller
    │   └── DELETE /:id           ← auth + controller
    │
    ├── /comments (comment.routes.js)
    │   ├── GET    /me            ← auth + controller
    │   ├── POST   /:postId       ← auth + validator + controller
    │   ├── PUT    /:id           ← auth + validator + controller
    │   └── DELETE /:id           ← auth + controller
    │
    └── /likes (like.routes.js)
        ├── POST   /:postId       ← auth + controller
        ├── GET    /me            ← auth + controller
        └── GET    /:postId       ← auth + controller
```

---

## 8. النمط العام للـ Route الكاملة

```javascript
router.METHOD(
  '/path',
  // --- طبقة 1: المصادقة ---
  middleware.isAuthenticated,    // هل تسجّلت دخول؟ (401 إذا لا)
  // --- طبقة 2: رفع الملفات (اختياري) ---
  upload.single('field'),        // أو upload.array('field', max)
  // --- طبقة 3: التحقق من البيانات ---
  validator.someRule,            // يُعرِّف قواعد التحقق
  validateRequest,               // يُنفِّذ التحقق (400 إذا فشل)
  // --- طبقة 4: المنطق ---
  controller.someFunction        // يُعالج الطلب ويُرسل الرد
);
```

كل طبقة تستدعي `next()` للانتقال للطبقة التالية، أو ترسل رداً وتوقف السلسلة.

---

## 9. خلاصة — HTTP Methods وما تعنيه

| Method | المعنى | مثال |
|--------|--------|------|
| `GET` | اجلب بيانات | جلب قائمة الوصفات |
| `POST` | أنشئ جديداً | إنشاء وصفة / تسجيل |
| `PUT` | حدّث بيانات | تعديل وصفة |
| `PATCH` | حدّث جزئياً | تمييز رسالة كمقروءة |
| `DELETE` | احذف | حذف تعليق |

---

*الدرس الحادي عشر من ثلاثة عشر — [← الدرس العاشر: النماذج](./10-models.md) | [الدرس الثاني عشر: المدققات →](./12-validators.md)*
