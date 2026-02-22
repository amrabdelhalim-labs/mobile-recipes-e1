# شرح وسيط المصادقة (user.middleware.js)

## 📋 نظرة عامة

ملف `user.middleware.js` يحتوي على **Middleware** يحمي المسارات ويتحقق من أن المستخدم مسجل دخوله.

---

## 🤔 ما هو Middleware؟

**Middleware** = وسيط = **حارس أمن** يفحص كل شخص قبل دخوله

### مثال تشبيهي:
- تريد الدخول لقاعة VIP في المطار
- الحارس يفحص بطاقتك
- إذا صحيحة → يسمح لك بالدخول ✅
- إذا مزورة أو منتهية → يمنعك ❌

---

## 📚 الكود الكامل

```javascript
import * as jwt from "../utilities/jwt.js";

const isAuthenticated = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "رمز غير صالح" });
        };

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token);
        if (!decoded) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        req.currentUser = decoded;
        return next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "غير مصرح" });
    };
};

export { isAuthenticated };
```

---

## 🔍 الشرح خطوة بخطوة

### 1️⃣ **معاملات الدالة**

```javascript
const isAuthenticated = (req, res, next) => {
```

#### الشرح:
- **`req`** (Request): معلومات الطلب الوارد
- **`res`** (Response): للرد على الطلب
- **`next`**: دالة للانتقال للخطوة التالية

💡 **Middleware** دائماً له هذه المعاملات الثلاثة!

---

### 2️⃣ **قراءة رأس المصادقة (Authorization Header)**

```javascript
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "رمز غير صالح" });
};
```

#### الشرح:

**ما هو Authorization Header؟**
- رأس HTTP يحمل Token المصادقة
- **الشكل**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**الفحص**:
```javascript
if (!authHeader)  // لا يوجد رأس مصادقة
```
```javascript
if (!authHeader.startsWith('Bearer '))  // لا يبدأ بـ "Bearer "
```

**مثال صحيح**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**مثال خاطئ**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  // ❌ ناقص "Bearer "
Authorization: Token eyJhbGciOiJ...  // ❌ "Token" بدلاً من "Bearer"
```

**كود الحالة 401**:
```javascript
res.status(401)  // Unauthorized = غير مصرح
```

---

### 3️⃣ **استخراج Token**

```javascript
const token = authHeader.split(' ')[1];
```

#### الشرح:

**مثال**:
```javascript
const authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// تقسيم النص عند المسافة
authHeader.split(' ')
// النتيجة: ["Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]

// أخذ العنصر الثاني [1]
const token = authHeader.split(' ')[1];
// النتيجة: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4️⃣ **التحقق من Token**

```javascript
const decoded = jwt.verify(token);
if (!decoded) {
    return res.status(401).json({ message: "غير مصرح" });
}
```

#### الشرح:

**ما يحدث في `jwt.verify()`**:
- يفك تشفير Token
- يتحقق من صحته وصلاحيته
- يرجع البيانات المشفرة

**إذا نجح** ✅:
```javascript
decoded = {
  id: 123,
  email: 'user@example.com',
  username: 'ahmed',
  iat: 1609459200,
  exp: 1612051200
}
```

**إذا فشل** ❌:
```javascript
decoded = null
```

**أسباب الفشل**:
- Token مزور
- Token منتهي الصلاحية
- Token معطوب

---

### 5️⃣ **حفظ معلومات المستخدم**

```javascript
req.currentUser = decoded;
```

#### الشرح:

نضيف معلومات المستخدم إلى كائن `req` لاستخدامها في المسارات اللاحقة.

**مثال**:
```javascript
req.currentUser = {
  id: 123,
  email: 'user@example.com',
  username: 'ahmed',
  // ...
}
```

الآن يمكن لأي Controller الوصول لمعلومات المستخدم:
```javascript
const userId = req.currentUser.id;
```

---

### 6️⃣ **السماح بالمرور**

```javascript
return next();
```

#### الشرح:

- **`next()`**: دالة تنقل التحكم للخطوة التالية (Controller)
- بدونها، سيتوقف الطلب عند Middleware!

**مثال**:
```javascript
app.get('/api/profile', isAuthenticated, (req, res) => {
  // إذا وصل الكود هنا → المستخدم مصادق عليه ✅
  res.json({ user: req.currentUser });
});
```

---

### 7️⃣ **معالجة الأخطاء**

```javascript
catch (error) {
    console.error(error);
    return res.status(401).json({ message: "غير مصرح" });
}
```

#### الشرح:

إذا حدث أي خطأ غير متوقع:
- نطبعه في Console
- نرجع رسالة "غير مصرح"

---

## 🔄 كيف يعمل في السياق الكامل؟

### الخطوة 1: المستخدم يسجل دخوله
```javascript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**النتيجة**:
```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### الخطوة 2: المستخدم يحفظ Token
```javascript
// في التطبيق
localStorage.setItem('token', token);
```

### الخطوة 3: طلب محمي
```javascript
// GET /api/posts/my-posts
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### الخطوة 4: المرور عبر Middleware
```javascript
// في routes/post.routes.js
router.get('/my-posts', isAuthenticated, getMyPosts);
//                      ↑ هنا يتم الفحص أولاً
```

### الخطوة 5: الوصول للـ Controller
```javascript
// في post.controller.js
const getMyPosts = async (req, res) => {
  const userId = req.currentUser.id;  // ✅ متاح لأننا مررنا بـ Middleware
  const posts = await Post.findAll({ where: { UserId: userId } });
  res.json(posts);
};
```

---

## 💡 أمثلة عملية

### مثال 1: طلب بدون Token
```javascript
// Request
GET /api/posts/my-posts
// بدون Authorization Header

// Response
{
  "message": "رمز غير صالح"
}
// Status: 401
```

### مثال 2: Token خاطئ
```javascript
// Request
GET /api/posts/my-posts
Authorization: Bearer invalid_token_123

// Response
{
  "message": "غير مصرح"
}
// Status: 401
```

### مثال 3: Token صحيح
```javascript
// Request
GET /api/posts/my-posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response
[
  { id: 1, title: "وصفة كبسة", ... },
  { id: 2, title: "وصفة معصوب", ... }
]
// Status: 200
```

---

## 🛡️ استخدامات Middleware

### 1. **حماية مسار واحد**:
```javascript
router.post('/posts', isAuthenticated, createPost);
```

### 2. **حماية عدة مسارات**:
```javascript
router.post('/posts', isAuthenticated, createPost);
router.put('/posts/:id', isAuthenticated, updatePost);
router.delete('/posts/:id', isAuthenticated, deletePost);
```

### 3. **حماية جميع مسارات ملف**:
```javascript
// في أول routes/post.routes.js
router.use(isAuthenticated);

// الآن جميع المسارات محمية تلقائياً
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
```

---

## ⚙️ تحسينات محتملة

### 1. **Middleware للصلاحيات**:
```javascript
const isAdmin = (req, res, next) => {
  if (req.currentUser.role !== 'admin') {
    return res.status(403).json({ message: 'ممنوع - للمديرين فقط' });
  }
  next();
};

router.delete('/users/:id', isAuthenticated, isAdmin, deleteUser);
```

### 2. **Middleware للتحقق من الملكية**:
```javascript
const isPostOwner = async (req, res, next) => {
  const post = await Post.findByPk(req.params.id);
  if (post.UserId !== req.currentUser.id) {
    return res.status(403).json({ message: 'غير مصرح - ليست منشورتك' });
  }
  next();
};

router.delete('/posts/:id', isAuthenticated, isPostOwner, deletePost);
```

---

## ❓ أسئلة شائعة

### 1. **لماذا نستخدم "Bearer" قبل Token؟**
"Bearer" = حامل  
معناها: "هذا Token يُحمل من قبل المستخدم"  
إنه معيار HTTP للمصادقة (RFC 6750).

### 2. **ماذا لو نسيت `next()`؟**
```javascript
const isAuthenticated = (req, res, next) => {
  // ... تحقق من Token
  req.currentUser = decoded;
  // ❌ نسيت next()
};
```
النتيجة: الطلب يتجمد ولا يرد أبداً! 🥶

### 3. **هل يمكن استخدام عدة Middlewares؟**
نعم!
```javascript
router.post('/admin/posts', isAuthenticated, isAdmin, createPost);
//                           ↑ الأول       ↑ الثاني  ↑ الأخير
```

### 4. **ما الفرق بين 401 و 403؟**
- **401 Unauthorized**: لست مسجل دخول
- **403 Forbidden**: أنت مسجل دخول لكن لا تملك الصلاحية

---

## 🎯 النقاط المهمة

✅ **Middleware** = حارس يفحص المستخدمين  
✅ يتحقق من وجود Token صحيح في `Authorization Header`  
✅ يضيف معلومات المستخدم إلى `req.currentUser`  
✅ يستخدم `next()` للسماح بالمرور  
✅ يرجع 401 إذا فشل التحقق  

---

## 🔗 علاقته بملفات أخرى

- **jwt.js**: يستورد منه `verify()` للتحقق من Token
- **routes/*.js**: يستخدم في جميع المسارات المحمية
- **controllers/*.js**: يستخدم `req.currentUser` للوصول لمعلومات المستخدم

---

**📖 الخطوة التالية**: [نظام رفع الملفات](./05-file-upload-system.md)
