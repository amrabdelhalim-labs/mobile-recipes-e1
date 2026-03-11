# الدرس التاسع: المتحكمات — قلب منطق الخادم 🎮

> **هدف الدرس:** تفهم ما هي المتحكمات (Controllers)، وكيف تستقبل الطلبات من المستخدم وتعالجها وترد عليها، وذلك بشرح تفصيلي سطر بسطر لكل دالة في مشروع وصفاتي.

---

## 1. ما هي المتحكمات؟

### التشبيه البسيط:

تخيّل مطعماً:

```text
الزبون (المستخدم)  // يطلب من النادل (Route)  // النادل يعطي الطلب للطباخ (Controller)
الطباخ يتحقق من المكونات (DB/Repository)  // يجهز الطبق  // النادل يقدّمه للزبون
```

في الكود:

```text
HTTP Request → Route → Controller → Repository  // قاعدة البيانات → HTTP Response
```

### ما الذي يفعله المتحكم تحديداً؟

| المهمة | المثال |
|--------|--------|
| استقبال البيانات من الطلب | `req.body`, `req.params`, `req.query` |
| التحقق من صحة البيانات | هل الإيميل صحيح؟ هل الحقل فارغ؟ |
| التحقق من صلاحية المستخدم | هل هو مسجل دخول؟ هل يملك الإذن؟ |
| التواصل مع قاعدة البيانات | عبر Repository Pattern |
| إرسال الرد المناسب | `res.status(200).json({...})` |
| معالجة الأخطاء | `try/catch` وإرسال 500 عند الفشل |

---

## 2. هيكل ملفات المتحكمات في المشروع

```text
server/controllers/
├── user.controller.js  // إدارة المستخدمين (تسجيل, دخول, ملف شخصي)
├── post.controller.js  // إدارة منشورات الوصفات
├── comment.controller.js  // إدارة التعليقات على الوصفات
└── like.controller.js  // إدارة الإعجابات
```

---

## 3. متحكم المستخدمين — `user.controller.js`

### السطور الأولى: الاستيرادات

```javascript
import bcrypt from 'bcrypt';
import * as jwt from '../utilities/jwt.js';
import { getStorageService } from '../utilities/files.js';
import { getRepositoryManager } from '../repositories/index.js';
```

**شرح كل سطر:**

| السطر | الشرح |
|-------|-------|
| `import bcrypt from 'bcrypt'` | مكتبة لتشفير كلمة المرور — لا نخزنها أبداً كنص عادي |
| `import * as jwt from '../utilities/jwt.js'` | أدوات JWT لإنشاء والتحقق من التوكن — درسناها في الدرس الثالث |
| `import { getStorageService }` | خدمة رفع الصور وحذفها — درسناها في الدرس السابع |
| `import { getRepositoryManager }` | مدير المستودعات للتواصل مع قاعدة البيانات — درسناه في الدرس الثامن |

```javascript
const DEFAULT_PROFILE_IMAGE = 'default-profile.svg';
```

**ثابت** يحمل اسم الصورة الافتراضية. نستخدمه لاحقاً لنتحقق هل الصورة الحالية هي الافتراضية أم لا.

---

### 3.1 دالة `register` — تسجيل مستخدم جديد

```javascript
const register = async (req, res) => {
```
- `async` ← لأن العملية تنتظر قاعدة البيانات (عمليات غير متزامنة)
- `req` ← الطلب الوارد من المستخدم (Request)
- `res` ← الرد الذي سنرسله للمستخدم (Response)

```javascript
  try {
```
نبدأ بـ `try` لأننا نتوقع أن يحدث خطأ في أي لحظة (انقطاع DB، بيانات خاطئة...) فنعالجه بشكل نظيف.

```javascript
    const { name, email, password } = req.body;
```
- `req.body` ← البيانات التي أرسلها المستخدم في جسم الطلب (JSON)
- نستخرج: `name` (الاسم)، `email` (الإيميل)، `password` (كلمة المرور)
- **Destructuring** = طريقة مختصرة لاستخراج قيم من كائن

```javascript
    const repositories = getRepositoryManager();
```
نحصل على مدير المستودعات — وهو بوابتنا للتحدث مع قاعدة البيانات.

```javascript
    const existingUser = await repositories.user.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'الإيميل مستخدم بالفعل' });
    }
```
- نبحث في قاعدة البيانات: هل هناك مستخدم بهذا الإيميل مسبقاً؟
- إذا وُجد (`existingUser` ليس null) → نرفض الطلب برسالة خطأ
- `status(400)` ← خطأ من جانب المستخدم (Bad Request)
- `return` مهمة هنا! لأنها توقف الدالة وتمنع تنفيذ الكود التالي

```javascript
    const hashedPassword = await bcrypt.hash(password, 10);
```
- `bcrypt.hash()` ← تحوّل كلمة المرور العادية إلى نص مشفر لا يمكن عكسه
- `10` ← عدد جولات التشفير (أكبر = أأمن لكن أبطأ)
- مثال: `"123456"` ← `"$2b$10$xyz...abc"` (60 حرف مشفر)
- **لماذا؟** لو سُرّبت قاعدة البيانات، لا أحد يعرف كلمات المرور الأصلية

```javascript
    await repositories.user.create({
      name,
      email,
      password: hashedPassword,
    });
```
- نحفظ المستخدم الجديد في قاعدة البيانات
- نخزّن كلمة المرور **المشفرة** فقط، ليس الأصلية

```javascript
    console.log(`User registered: ${name} ${email}`);
    return res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
```
- `console.log` ← نسجل في الخادم من سجّل (مفيد للتشخيص)
- `status(201)` ← "Created" = تم إنشاء مورد جديد بنجاح
- **لماذا 201 وليس 200؟** `200` = نجاح عام، `201` = نجح الإنشاء تحديداً

```javascript
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
```
- إذا حدث أي خطأ غير متوقع (انقطع الاتصال بالـ DB مثلاً)
- `console.error` ← يطبع الخطأ التفصيلي في سجل الخادم
- `status(500)` ← خطأ من جانب الخادم (Internal Server Error)
- **لا نكشف تفاصيل الخطأ للمستخدم** — أمان وخصوصية

---

### 3.2 دالة `login` — تسجيل الدخول

```javascript
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
```
نستخرج الإيميل وكلمة المرور من جسم الطلب.

```javascript
    const repositories = getRepositoryManager();
    const user = await repositories.user.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }
```
- نبحث عن المستخدم بالإيميل
- إذا لم نجده (`!user`) → نرفض الطلب
- **لاحظ الرسالة:** نقول "الإيميل أو كلمة المرور" وليس "الإيميل غير موجود" — **هذا مقصود!**
- لو قلنا "الإيميل غير موجود"، المهاجم سيعرف أن هذا الإيميل غير مسجل، فيجرب إيميلات أخرى

```javascript
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }
```
- `bcrypt.compare()` ← تقارن كلمة المرور الواردة بالمشفرة في قاعدة البيانات
- إذا لم تتطابق (`!isPasswordValid`) → نرفض بنفس الرسالة الغامضة

```javascript
    const token = jwt.generate({ id: user.id, email: user.email });
    return res.status(200).json({ token });
```
- ننشئ JWT Token يحمل داخله `id` المستخدم و `email`
- نرسل التوكن للمستخدم — سيستخدمه في كل طلب لاحق ليثبت هويته
- `status(200)` ← نجاح

---

### 3.3 دالة `getProfile` — عرض الملف الشخصي

```javascript
const getProfile = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }
```
- `req.currentUser` ← وسيط المصادقة (الدرس الرابع) وضع هنا بيانات المستخدم المسجل دخوله
- `?.id` ← Optional Chaining: إذا كان `currentUser` غير موجود، لا تعطِ خطأ، فقط أعطِ `undefined`
- `status(401)` ← Unauthorized = غير مصرح له

```javascript
    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
```
- `findByPk()` ← Find By Primary Key = ابحث بالـ ID
- `status(404)` ← Not Found = لم يُوجد

```javascript
    const sanitizeUser = user.toJSON();
    delete sanitizeUser.password;
```
- `toJSON()` ← تحوّل كائن Sequelize (ORM) إلى كائن JavaScript عادي
- `delete sanitizeUser.password` ← نحذف حقل كلمة المرور **قبل الإرسال**
- **هذا إجراء أمني مهم جداً!** لا نرسل كلمة المرور أبداً حتى المشفرة

```javascript
    return res.status(200).json({ user: sanitizeUser });
```
نرسل بيانات المستخدم المنظفة (بدون كلمة مرور).

---

### 3.4 دالة `updateImage` — تحديث صورة الملف الشخصي

```javascript
const updateImage = async (req, res) => {
  let uploadedFile = null;
```
نعرّف متغيراً خارج `try` ليكون متاحاً في `catch` أيضاً — سنحتاجه للتنظيف عند الخطأ.

```javascript
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم تحميل صورة' });
    }
```
- `req.file` ← يوضعه Multer (وسيط رفع الملفات) تلقائياً عندما يُرفع ملف
- إذا لم يرفع المستخدم صورة → نرفض الطلب

```javascript
    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const previousImageUrl = user.ImageUrl;
```
نحفظ رابط الصورة القديمة — سنحذفها بعد رفع الجديدة.

```javascript
    const storage = getStorageService();

    // Upload new image
    const uploadResult = await storage.uploadFile(req.file);
    uploadedFile = uploadResult;
```
- نرتب خدمة التخزين
- نرفع الصورة الجديدة (إلى السيرفر المحلي أو Cloudinary)
- نحفظ نتيجة الرفع في `uploadedFile` — مهم للتنظيف عند الخطأ

```javascript
    // Update database
    await repositories.user.update(userId, { ImageUrl: uploadResult.url });
```
نحدث رابط الصورة في قاعدة البيانات بالرابط الجديد.

```javascript
    const sanitizeUser = user.toJSON();
    delete sanitizeUser.password;

    // Delete old image
    if (previousImageUrl && !previousImageUrl.includes(DEFAULT_PROFILE_IMAGE)) {
      await storage.deleteFile(previousImageUrl).catch((err) => {
        console.error('Failed to delete old profile picture:', err);
      });
    }
```
- قبل الحذف نتحقق من شرطين:
  1. `previousImageUrl` ← هل كانت هناك صورة أصلاً؟
  2. `!previousImageUrl.includes(DEFAULT_PROFILE_IMAGE)` ← هل الصورة القديمة **ليست** الافتراضية؟
- لا نحذف الصورة الافتراضية لأنها مشتركة بين كل المستخدمين
- `.catch((err) => ...)` ← حتى لو فشل الحذف، لا نوقف العملية ولا نرسل خطأ للمستخدم

```javascript
    return res.status(200).json({
      message: 'تم تحديث صورة الملف الشخصي بنجاح',
      user: sanitizeUser,
    });
  } catch (error) {
    console.error('Error updating profile image:', error);

    // Cleanup uploaded image on error
    if (uploadedFile) {
      const storage = getStorageService();
      await storage.deleteFile(uploadedFile.filename).catch((err) => {
        console.error('Failed to cleanup uploaded image:', err);
      });
    }

    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
```
**منطق التنظيف عند الخطأ:**
- لو رفعنا الصورة بنجاح ثم فشل تحديث قاعدة البيانات → الصورة موجودة في التخزين لكن لم تُسجَّل
- لذا نحذفها من التخزين لتجنب ملفات "يتيمة" تضيع في السيرفر

---

### 3.5 دالة `resetImage` — إعادة الصورة الافتراضية

```javascript
const resetImage = async (req, res) => {
  try {
    // ...التحقق من المستخدم...

    const previousImageUrl = user.ImageUrl;

    const newImageUrl =
      process.env.DEFAULT_PROFILE_IMAGE_URL || `/images/${DEFAULT_PROFILE_IMAGE}`;
```
- `process.env.DEFAULT_PROFILE_IMAGE_URL` ← على السيرفر الحقيقي (Heroku) نضع رابط Cloudinary للصورة الافتراضية
- `|| `/images/${DEFAULT_PROFILE_IMAGE}`` ← في التطوير المحلي نستخدم المسار المحلي
- الـ `||` يعني: "إذا لم يوجد الأول، استخدم الثاني"

```javascript
    await repositories.user.update(userId, { ImageUrl: newImageUrl });

    // ...نظف الصورة القديمة...

    return res.status(200).json({
      message: 'تمت إعادة الصورة الافتراضية بنجاح',
      user: sanitizeUser,
    });
```
نحدث قاعدة البيانات بالرابط الافتراضي، ونحذف الصورة القديمة إن وُجدت.

---

### 3.6 دالة `updateInfo` — تحديث بيانات المستخدم

```javascript
const updateInfo = async (req, res) => {
  try {
    // ...التحقق من المستخدم...

    const payload = req.body || {};
    const updates = {};
```
- `req.body || {}` ← لو أرسل المستخدم جسماً فارغاً، نستخدم كائناً فارغاً
- `const updates = {}` ← سنملأ هذا الكائن فقط بالحقول التي يريد تغييرها

```javascript
    if (payload.name !== undefined) {
      if (typeof payload.name !== 'string' || !payload.name.trim()) {
        return res.status(400).json({ message: 'الاسم غير صالح' });
      }
      updates.name = payload.name.trim();
    }
```
- `!== undefined` ← المستخدم أرسل الحقل (حتى لو كان فارغاً)
- `typeof payload.name !== 'string'` ← هل هو نص؟
- `!payload.name.trim()` ← هل بعد حذف المسافات لم يتبقَّ شيء؟
- `.trim()` ← تحذف المسافات من البداية والنهاية: `"  أحمد  "` ← `"أحمد"`

```javascript
    if (payload.password !== undefined) {
      if (typeof payload.password !== 'string' || !payload.password) {
        return res.status(400).json({ message: 'كلمة المرور غير صالحة' });
      }
      const hashedPassword = await bcrypt.hash(payload.password, 10);
      updates.password = hashedPassword;
    }
```
إذا يريد تغيير كلمة المرور → نشفرها قبل الحفظ.

```javascript
    if (!updates.name && !updates.password) {
      return res.status(400).json({ message: 'لا توجد بيانات لتحديثها' });
    }
```
إذا لم يرسل المستخدم **أي** شيء للتغيير → نرفض الطلب برسالة واضحة.

```javascript
    await repositories.user.update(userId, updates);
```
نحدث فقط الحقول الموجودة في `updates` — ليس كل شيء.

---

### 3.7 دالة `deleteUser` — حذف الحساب

هذه الدالة الأكثر تعقيداً لأنها تحذف **كل شيء** مرتبط بالمستخدم.

```javascript
const deleteUser = async (req, res) => {
  try {
    // ...التحقق من المستخدم...

    const userImageUrl = user.ImageUrl;

    // Collect user's post images for deletion
    const userPosts = await repositories.post.findByUser(userId, 1, 1000);
    const filesToDelete = [];
```
- نجمع كل منشورات المستخدم (حتى 1000 منشور)
- `filesToDelete` ← قائمة بكل الملفات التي سنحذفها من التخزين

```javascript
    // Collect post images
    for (const post of userPosts.rows) {
      if (post.images && post.images.length > 0) {
        for (const img of post.images) {
          filesToDelete.push(img.imageUrl);
        }
      }
    }
```
- نمرّ على كل منشور
- ثم على كل صورة في كل منشور
- ونضيف رابطها لقائمة الحذف

```javascript
    // Add profile image
    if (userImageUrl && !userImageUrl.includes(DEFAULT_PROFILE_IMAGE)) {
      filesToDelete.push(userImageUrl);
    }
```
نضيف صورة الملف الشخصي للحذف (إذا لم تكن الافتراضية).

```javascript
    // Delete user (CASCADE will delete posts, comments, and likes)
    await repositories.user.delete(userId);
```
- نحذف المستخدم من قاعدة البيانات
- **CASCADE** = قاعدة البيانات ستحذف تلقائياً كل المنشورات والتعليقات والإعجابات المرتبطة به
- هذا مُعرَّف في تصميم قاعدة البيانات نفسها

```javascript
    // Delete files from storage
    if (filesToDelete.length > 0) {
      const storage = getStorageService();
      await storage.deleteFiles(filesToDelete).catch((err) => {
        console.error('Failed to delete user files from storage:', err);
      });
    }

    return res.status(200).json({ message: 'تم حذف الحساب بنجاح' });
```
نحذف الملفات من التخزين بعد حذف السجلات من قاعدة البيانات.

**لماذا هذا الترتيب (DB أولاً ثم التخزين)؟**
- لو حذفنا الملفات أولاً ثم فشل حذف DB → الملفات اختفت ولكن السجلات بقيت (كارثة!)
- لو حذفنا DB أولاً ثم فشل حذف التخزين → الملفات ستبقى في التخزين (أهون بكثير)

---

## 4. متحكم المنشورات — `post.controller.js`

### 4.1 دالة `newPost` — إنشاء وصفة جديدة

```javascript
const newPost = async (req, res) => {
  const uploadedFiles = [];
```
قائمة خارج `try` للتنظيف عند الخطأ — نفس فكسة `updateImage`.

```javascript
    const { title, content, steps, country, region } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'العنوان مطلوب' });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'المحتوى مطلوب' });
    }

    // At least one image is required
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'يجب إرفاق صورة واحدة على الأقل' });
    }
```
- `req.files` ← (جمع) لأن المنشور يمكن أن يحوي **عدة صور**
- `req.file` ← (مفرد) للصور المفردة كصورة الملف الشخصي

```javascript
    let parsedSteps = null;
    if (steps !== undefined && steps !== null && steps !== '') {
      if (typeof steps === 'string') {
        try {
          parsedSteps = JSON.parse(steps);
        } catch {
          return res.status(400).json({ message: 'صيغة الخطوات غير صحيحة' });
        }
      } else if (Array.isArray(steps) || (typeof steps === 'object' && steps !== null)) {
        parsedSteps = steps;
      }
    }
```
- `steps` هي خطوات الوصفة — يمكن أن تصل كـ:
  - **نص JSON**: `'[{"step": 1, "text": "اقطع البصل"}]'` → نحوّله لكائن بـ `JSON.parse`
  - **مصفوفة جاهزة**: `[{...}, {...}]` → نستخدمها مباشرة
  - **غير موجود**: `null` → اختياري

```javascript
    const sanitizedCountry = country && typeof country === 'string' ? country.trim() : null;
    const sanitizedRegion = region && typeof region === 'string' ? region.trim() : null;
```
- **Ternary Operator**: `شرط ? قيمة_إذا_صح : قيمة_إذا_خطأ`
- البلد والمنطقة اختياريان → إذا لم يُرسلا نحفظ `null`

```javascript
    const storage = getStorageService();
    const uploadResults = await storage.uploadFiles(req.files);
    uploadResults.forEach((result) => uploadedFiles.push(result));
```
- نرفع كل الصور دفعة واحدة بـ `uploadFiles` (بالجمع)
- `forEach` ← ندور على كل نتيجة ونضيفها للقائمة

```javascript
    const images = uploadResults.map((result) => ({ imageUrl: result.url }));
```
- `map` ← تحوّل مصفوفة لمصفوفة أخرى بنفس العدد
- من: `[{ url: 'http://...jpg', filename: '...' }]`
- إلى: `[{ imageUrl: 'http://...jpg' }]`
- هذا الشكل هو ما تتوقعه قاعدة البيانات

```javascript
    const fullPost = await repositories.post.createWithImages(
      {
        title: title.trim(),
        content: content.trim(),
        steps: parsedSteps,
        country: sanitizedCountry,
        region: sanitizedRegion,
        UserId: userId,
      },
      images
    );

    return res.status(201).json({ message: 'تم إنشاء المنشور بنجاح', post: fullPost });
```
`createWithImages` ← دالة مستودع تنشئ المنشور **وصوره** في عملية واحدة (Transaction).

---

### 4.2 دالة `getAllPosts` — عرض جميع الوصفات

```javascript
const getAllPosts = async (req, res) => {
  try {
    const currentUserId = req.currentUser?.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
```
- `req.query` ← معاملات URL مثل `?page=2&limit=20`
- `parseInt()` ← تحوّل النص `"2"` إلى رقم `2`
- `|| 1` ← إذا لم يُرسل، افتراضياً الصفحة الأولى
- `Math.max(..., 1)` ← الحد الأدنى 1 (لا صفحة 0 أو سالبة)
- `Math.min(..., 50)` ← الحد الأقصى 50 (لا نرسل 1000 منشور دفعة واحدة!)

```javascript
    const result = await repositories.post.findAllWithUser(page, limit);
    const posts = result.rows;
    const count = result.count;
```
- `findAllWithUser` ← تجلب المنشورات مع بيانات صاحبها (Join)
- `rows` ← المنشورات في هذه الصفحة
- `count` ← **إجمالي** عدد المنشورات في قاعدة البيانات

```javascript
    const postIds = posts.map((post) => post.id);
    let likesMap = {};

    if (postIds.length > 0) {
      for (const postId of postIds) {
        const likesCount = await repositories.like.countByPost(postId);
        likesMap[postId] = likesCount;
      }
    }
```
- `postIds` ← قائمة بمعرّفات المنشورات: `[1, 2, 3, ...]`
- `likesMap` ← كائن يربط كل ID بعدد إعجاباته: `{ 1: 5, 2: 12, 3: 0 }`
- نحصل على عدد الإعجابات لكل منشور على حدة

```javascript
    let userLikesSet = new Set();
    if (currentUserId && postIds.length > 0) {
      for (const postId of postIds) {
        const isLiked = await repositories.like.isLikedByUser(currentUserId, postId);
        if (isLiked) {
          userLikesSet.add(postId);
        }
      }
    }
```
- `Set` ← مجموعة من القيم **فريدة** — أسرع من المصفوفة للبحث
- نفحص: هل أعجب **هذا المستخدم** بكل منشور؟
- `userLikesSet` سيحتوي فقط على IDs المنشورات التي أعجبه

```javascript
    const postsWithLikes = posts.map((post) => ({
      ...post.toJSON(),
      likesCount: likesMap[post.id] || 0,
      isLiked: userLikesSet.has(post.id),
    }));
```
- `...post.toJSON()` ← **Spread Operator** = ننسخ كل حقول المنشور
- نضيف إليها: `likesCount` و `isLiked`
- `likesMap[post.id] || 0` ← إذا لم يوجد في الـ Map (0 إعجابات) أرجع صفراً
- `userLikesSet.has(post.id)` ← هل المعرّف موجود في المجموعة؟ (true/false)

```javascript
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      posts: postsWithLikes,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts: count,
        limit,
      },
    });
```
- `Math.ceil()` ← التقريب للأعلى: 23 منشور ÷ 10 = 2.3 → 3 صفحات
- `pagination` ← معلومات الصفحات للـ Frontend ليعرف هل يعرض "تحميل المزيد"

---

### 4.3 دوال `getMyPosts` و `getPostById`

تتبع نفس النمط تماماً مع اختلاف بسيط:

| الدالة | الفرق |
|--------|-------|
| `getMyPosts` | تجلب منشورات المستخدم الحالي فقط (`findByUser`) |
| `getPostById` | تجلب منشوراً واحداً بمعرّفه (`findWithDetails`) |

```javascript
const getPostById = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'معرف المنشور غير صالح' });
    }
```
- `req.params.id` ← من URL مثل `/posts/42` → `id = "42"` (نص!)
- `parseInt()` ← نحوّله لرقم
- `isNaN()` ← (is Not a Number) للتحقق أن التحويل نجح

---

### 4.4 دالة `updatePost` — تعديل وصفة

```javascript
    if (post.UserId !== userId) {
      return res.status(403).json({ message: 'غير مسموح بتعديل هذا المنشور' });
    }
```
- `status(403)` ← Forbidden = المستخدم مصادق عليه **لكن** ليس له إذن
- الفرق بين 401 و 403:
  - `401` = أنت لم تُسَجِّل دخول
  - `403` = أنت مسجل دخول لكن هذا ليس ملكك

```javascript
    let imagesToDelete = [];
    if (deletedImages !== undefined && deletedImages !== null && deletedImages !== '') {
      // ...تحليل imagesToDelete...

      if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
        const { default: models } = await import('../models/index.js');
        const existingImages = await models.Post_Image.findAll({
          where: { id: imagesToDelete, PostId: postId },
        });
```
- `await import(...)` ← استيراد ديناميكي (Dynamic Import) = يستورد عند الحاجة فقط
- `findAll({ where: { id: imagesToDelete, PostId: postId } })` ← التحقق أن هذه الصور تنتمي لهذا المنشور (أمان!)

---

### 4.5 دالة `deletePost` — حذف وصفة

```javascript
    if (post.UserId !== userId) {
      return res.status(403).json({ message: 'غير مسموح بحذف هذا المنشور' });
    }

    const { default: models } = await import('../models/index.js');
    const postWithImages = await models.Post.findByPk(postId, {
      include: [{ model: models.Post_Image }],
    });
```
- `include` ← Eager Loading في Sequelize: يجلب المنشور مع صوره في استعلام واحد (Join)
- نحتاج روابط الصور لنحذفها من التخزين

```javascript
    // CASCADE will delete comments, likes, and images automatically
    await repositories.post.delete(postId);
```
CASCADE يتولى حذف كل المرتبطات من قاعدة البيانات تلقائياً.

---

## 5. متحكم التعليقات — `comment.controller.js`

### 5.1 دالة `addComment` — إضافة تعليق

```javascript
const addComment = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const postId = parseInt(req.params.postId);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'معرف المنشور غير صالح' });
    }
```
`postId` يأتي من URL مثل `/posts/5/comments`.

```javascript
    const repositories = getRepositoryManager();
    const post = await repositories.post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }
```
نتحقق أن المنشور موجود فعلاً قبل إضافة تعليق عليه — لا تعليقات على الفراغ!

```javascript
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'نص التعليق مطلوب' });
    }

    const fullComment = await repositories.comment.createComment(userId, postId, text.trim());

    return res.status(201).json({ message: 'تم إضافة التعليق بنجاح', comment: fullComment });
```
`createComment` ← تنشئ التعليق وتجلبه مع بيانات صاحبه (اسمه، صورته).

---

### 5.2 دالة `updateComment` — تعديل تعليق

```javascript
    const comment = await repositories.comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'التعليق غير موجود' });
    }

    if (comment.UserId !== userId) {
      return res.status(403).json({ message: 'غير مسموح بتعديل هذا التعليق' });
    }
```
نتحقق من **وجود** التعليق ثم من **الملكية** — نفس نمط المنشور.

```javascript
    await repositories.comment.updateText(commentId, text.trim());

    // Fetch updated comment with user details
    const updatedComment = await repositories.comment.findByPk(commentId);

    return res.status(200).json({ message: 'تم تعديل التعليق بنجاح', comment: updatedComment });
```
بعد التحديث نجلب التعليق من جديد لنرسل النسخة المحدثة للمستخدم.

---

### 5.3 دالة `deleteComment` و `getMyComments`

```javascript
const deleteComment = async (req, res) => {
  // ...نفس التحقق المعتاد...
  await repositories.comment.delete(commentId);
  return res.status(200).json({ message: 'تم حذف التعليق بنجاح' });
};
```

```javascript
const getMyComments = async (req, res) => {
  // ...pagination مثل getAllPosts...
  const result = await repositories.comment.findByUser(userId, page, limit);
  return res.status(200).json({
    comments,
    pagination: { currentPage: page, totalPages, totalComments: count, limit },
  });
};
```

---

## 6. متحكم الإعجابات — `like.controller.js`

### 6.1 دالة `toggleLike` — تفعيل/إلغاء الإعجاب

```javascript
const toggleLike = async (req, res) => {
  try {
    // ...التحقق المعتاد...

    const result = await repositories.like.toggleLike(userId, postId);

    return res.status(200).json({
      message: result.isLiked ? 'تم تسجيل الإعجاب' : 'تم إلغاء الإعجاب',
      isLiked: result.isLiked,
      likesCount: result.likesCount,
    });
```
- `toggleLike` ← المستودع يتحقق: هل أعجب المستخدم بهذا المنشور؟
  - إذا **نعم** → يحذف الإعجاب (إلغاء)
  - إذا **لا** → يضيف إعجاباً جديداً
- `result.isLiked ? '...' : '...'` ← Ternary: رسالة مختلفة حسب النتيجة

---

### 6.2 دالة `getPostLikes` — عرض من أعجب بمنشور

```javascript
    const result = await repositories.like.findByPost(postId, page, limit);
    const likes = result.rows;
    const count = result.count;

    const users = likes.map((like) => like.User);
```
- `findByPost` ← تجلب سجلات الإعجاب مع بيانات المستخدمين
- `likes.map((like) => like.User)` ← نستخرج فقط كائن المستخدم من كل سجل إعجاب
- النتيجة: قائمة بالمستخدمين الذين أعجبوا بالمنشور

---

### 6.3 دالة `getMyLikes` — عرض المنشورات التي أعجبت بها

```javascript
    const result = await repositories.like.findByUser(userId, page, limit);
    const likes = result.rows;

    const posts = likes.map((like) => like.Post);
```
نفس الفكرة لكن عكسياً — نستخرج المنشور من كل سجل إعجاب.

---

## 7. خلاصة — جدول المتحكمات الكامل

### متحكم المستخدمين

| الدالة | الطريقة | المسار | تسجيل دخول؟ | الوصف |
|--------|---------|--------|-------------|-------|
| `register` | POST | `/auth/register` | ❌ | إنشاء حساب جديد |
| `login` | POST | `/auth/login` | ❌ | تسجيل الدخول والحصول على توكن |
| `getProfile` | GET | `/users/me` | ✅ | عرض الملف الشخصي |
| `updateImage` | PUT | `/users/me/image` | ✅ | تغيير صورة الملف الشخصي |
| `resetImage` | DELETE | `/users/me/image` | ✅ | إعادة الصورة الافتراضية |
| `updateInfo` | PUT | `/users/me` | ✅ | تغيير الاسم أو كلمة المرور |
| `deleteUser` | DELETE | `/users/me` | ✅ | حذف الحساب بشكل كامل |

### متحكم المنشورات

| الدالة | الطريقة | المسار | صاحب الطلب فقط؟ | الوصف |
|--------|---------|--------|-----------------|-------|
| `newPost` | POST | `/posts` | — | نشر وصفة جديدة |
| `getAllPosts` | GET | `/posts` | — | جلب جميع الوصفات (Paginated) |
| `getMyPosts` | GET | `/posts/me` | — | جلب وصفاتي أنا |
| `getPostById` | GET | `/posts/:id` | — | جلب وصفة واحدة |
| `updatePost` | PUT | `/posts/:id` | ✅ | تعديل وصفة |
| `deletePost` | DELETE | `/posts/:id` | ✅ | حذف وصفة |

### متحكم التعليقات

| الدالة | الطريقة | الوصف |
|--------|---------|-------|
| `addComment` | POST | إضافة تعليق على وصفة |
| `updateComment` | PUT | تعديل تعليق |
| `deleteComment` | DELETE | حذف تعليق |
| `getMyComments` | GET | عرض تعليقاتي |

### متحكم الإعجابات

| الدالة | الطريقة | الوصف |
|--------|---------|-------|
| `toggleLike` | POST | إعجاب/إلغاء إعجاب |
| `getPostLikes` | GET | من أعجب بالمنشور |
| `getMyLikes` | GET | المنشورات التي أعجبتني |

---

## 8. نمط التحقق المتكرر — اعرفه مرة واحدة

لاحظ أن كل دالة تتبع **نفس التسلسل**:

```text
1. التحقق من المصادقة      req.currentUser?.id
         ↓
2. التحقق من المُدخلات      req.body / req.params / req.query
         ↓
3. التحقق من الوجود        findByPk → 404
         ↓
4. التحقق من الملكية        UserId !== userId → 403
         ↓
5. تنفيذ العملية           create / update / delete
         ↓
6. إرسال الرد              res.status(...).json({...})
```

هذا النمط يجعل الكود:
- **متسقاً** — كل دالة تبدو مألوفة
- **آمناً** — لا عملية تنفَّذ قبل التحقق
- **سهل الصيانة** — عارف أين تبحث عن أي منطق

---

*الدرس التاسع من ثلاثة عشر — [← الدرس الثامن: نمط المستودع](./08-repository-pattern.md) | [الدرس العاشر: النماذج →](./10-models.md)*
