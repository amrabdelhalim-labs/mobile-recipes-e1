# الدرس العاشر: نماذج البيانات (Models) 🗃️

> **هدف الدرس:** تفهم كيف تُعرِّف نماذج Sequelize شكل الجداول في قاعدة البيانات PostgreSQL، وكيف تترابط الجداول ببعضها عبر العلاقات (Associations).

---

## 1. ما هو النموذج (Model)؟

### التشبيه البسيط:

فكّر في النموذج كـ**مخطط المعمار** قبل بناء منزل:

```
المخطط (Model)  →  يصف شكل الجدول  →  Sequelize يبني الجدول الفعلي في PostgreSQL
```

| المصطلح | المعنى |
|---------|--------|
| **Model** | تعريف شكل الجدول في JavaScript |
| **Table** | الجدول الفعلي في قاعدة البيانات |
| **Field/Column** | عمود في الجدول |
| **Row/Record** | صف = سجل بيانات واحد |
| **DataType** | نوع البيانات (نص، رقم، تاريخ...) |

### هيكل نماذج المشروع:

```
server/models/
├── index.js           ← يجمع كل النماذج ويُعرِّف العلاقات بينها
├── users.model.js     ← جدول المستخدمين
├── posts.model.js     ← جدول الوصفات (المنشورات)
├── comments.model.js  ← جدول التعليقات
├── likes.model.js     ← جدول الإعجابات
└── postImages.model.js ← جدول صور الوصفات
```

---

## 2. نموذج المستخدمين — `users.model.js`

```javascript
import { DataTypes } from 'sequelize';
import db from '../utilities/database.js';
```
- `DataTypes` ← أنواع البيانات من Sequelize: نص، رقم، تاريخ...
- `db` ← الاتصال بقاعدة البيانات الذي أنشأناه في `database.js`

```javascript
const User = db.define(
  'User',
```
- `db.define()` ← نُعرِّف نموذجاً جديداً
- `'User'` ← اسم النموذج — Sequelize سيبني جدولاً اسمه `Users` (يضيف s تلقائياً)

```javascript
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
```
- `type: DataTypes.INTEGER` ← رقم صحيح (1، 2، 3، ...)
- `primaryKey: true` ← هذا الحقل هو **المفتاح الرئيسي** — معرّف فريد لكل صف
- `autoIncrement: true` ← قاعدة البيانات تُولِّد الرقم تلقائياً (لا تُرسله أنت)

```javascript
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
```
- `DataTypes.STRING` ← نص بطول أقصى 255 حرف (VARCHAR 255)
- `allowNull: false` ← **مطلوب** — لا يمكن حفظ صف بدون هذا الحقل

```javascript
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
```
- `unique: true` ← لا يمكن تكرار نفس الإيميل في جدول المستخدمين
- `validate: { isEmail: true }` ← Sequelize يتحقق تلقائياً أن الصيغة `xxx@yyy.zzz`

```javascript
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
```
يُخزَّن **المشفَّر** فقط (bcrypt) — لا الأصلي.

```javascript
    ImageUrl: {
      // Use STRING(500) instead of the default STRING (VARCHAR 255) to safely
      // accommodate Cloudinary CDN URLs which can approach or exceed 255 chars.
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '/images/default-profile.svg',
    },
```
- `DataTypes.STRING(500)` ← نص بطول أقصى **500** حرف — لأن روابط Cloudinary قد تتجاوز 255 حرف
- `defaultValue` ← إذا لم تُرسل قيمة، سيستخدم هذا الافتراضي تلقائياً

```javascript
  { timestamps: true }
);
```
- `timestamps: true` ← Sequelize يُضيف عمودين تلقائيين:
  - `createdAt` ← وقت إنشاء السجل
  - `updatedAt` ← وقت آخر تحديث للسجل

### العلاقات (Associations):

```javascript
User.associate = (models) => {
  User.hasMany(models.Post, { onDelete: 'CASCADE' });
  User.hasMany(models.Comment, { onDelete: 'CASCADE' });
};
```

| الكود | المعنى |
|-------|--------|
| `User.hasMany(models.Post)` | المستخدم **يمتلك** عدة وصفات |
| `User.hasMany(models.Comment)` | المستخدم **يمتلك** عدة تعليقات |
| `onDelete: 'CASCADE'` | إذا حُذف المستخدم → **تُحذَف تلقائياً** كل وصفاته وتعليقاته |

**التشبيه:** المستخدم كملف مجلد — إذا حذفت المجلد، تُحذَف كل المحتويات داخله.

---

## 3. نموذج الوصفات — `posts.model.js`

```javascript
const Post = db.define(
  'Post',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
```
- `DataTypes.TEXT` ← نص **غير محدود الطول** (على عكس STRING المحدود بـ 255/500)
- يُستخدم لحقل `content` لأن وصف الوصفة قد يكون طويلاً جداً

```javascript
    steps: {
      type: DataTypes.JSON,
      allowNull: true,
    },
```
- `DataTypes.JSON` ← يخزن كائن JavaScript مباشرة في قاعدة البيانات
- وصفة قد تحوي خطوات تحضير بشكل بنُية معقدة: `[{ step: 1, text: "..." }, ...]`
- `allowNull: true` ← اختياري، الوصفة قد لا تحوي خطوات

```javascript
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { timestamps: true }
);
```
البلد والمنطقة اختياريان — قد يُضيفهما صاحب الوصفة لتوضيح أصل الطبق.

### علاقات الوصفة:

```javascript
Post.associate = (models) => {
  Post.belongsTo(models.User, { onDelete: 'CASCADE' });
  Post.hasMany(models.Post_Image, {
    onDelete: 'CASCADE',
    as: 'images',
  });
  Post.hasMany(models.Comment, { onDelete: 'CASCADE' });
};
```

| الكود | المعنى |
|-------|--------|
| `Post.belongsTo(models.User)` | كل وصفة **تنتمي** لمستخدم واحد |
| `Post.hasMany(models.Post_Image)` | الوصفة **تمتلك** عدة صور |
| `as: 'images'` | عند جلب الصور استخدم الاسم `images` بدل `Post_Images` |
| `Post.hasMany(models.Comment)` | الوصفة **تمتلك** عدة تعليقات |

**ملاحظة مهمة:** `belongsTo` تُنشئ عمود مفتاح أجنبي `UserId` في جدول `Posts` — ربط كل وصفة بصاحبها.

---

## 4. نموذج التعليقات — `comments.model.js`

```javascript
const Comment = db.define(
  'Comment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { timestamps: true }
);
```
بسيط جداً — حقلان فقط: `id` و `text` (نص التعليق).

```javascript
Comment.associate = (models) => {
  Comment.belongsTo(models.User, { onDelete: 'CASCADE' });
  Comment.belongsTo(models.Post, { onDelete: 'CASCADE' });
};
```
التعليق **ينتمي** لمستخدم واحد ووصفة واحدة في نفس الوقت.

هذا يُنشئ عمودين في جدول التعليقات:
- `UserId` ← من كتب التعليق
- `PostId` ← على أي وصفة التعليق

---

## 5. نموذج الإعجابات — `likes.model.js`

```javascript
const Like = db.define(
  'Like',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  { timestamps: true }
);
```
لاحظ: **لا حقول إضافية!** الإعجاب مجرد ربط بين مستخدم ووصفة.

```javascript
Like.associate = (models) => {
  models.User.belongsToMany(models.Post, { through: models.Like });
  models.Post.belongsToMany(models.User, { through: models.Like });
  Like.belongsTo(models.User, { onDelete: 'CASCADE' });
  Like.belongsTo(models.Post, { onDelete: 'CASCADE' });
};
```

هذا هو نمط **Many-to-Many (كثير-لكثير)**:

```
مستخدم واحد → يُعجب بعدة وصفات
وصفة واحدة → تُعجب عدة مستخدمين
```

الجدول `Like` هو جدول **وِصل (Junction Table)** — يحتوي فقط على:
- `UserId` ← من أعجب
- `PostId` ← بماذا أعجب
- `createdAt` ← متى أعجب

`belongsToMany` من الطرفين يخبر Sequelize بهذه العلاقة المزدوجة.

---

## 6. نموذج صور الوصفات — `postImages.model.js`

```javascript
const Post_Image = db.define(
  'Post_Image',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { timestamps: true }
);

Post_Image.associate = (models) => {
  Post_Image.belongsTo(models.Post, { onDelete: 'CASCADE' });
};
```
كل صورة تحمل:
- `imageUrl` ← رابط الصورة (محلي أو Cloudinary)
- `PostId` ← تنتمي لأي وصفة (علاقة belongsTo)

كل وصفة قد تمتلك عدة صور (1+) — لذا نموذج منفصل لها.

---

## 7. ملف التهيئة — `models/index.js`

```javascript
import User from './users.model.js';
import Post from './posts.model.js';
import Post_Image from './postImages.model.js';
import Comment from './comments.model.js';
import Like from './likes.model.js';
```
نستورد كل النماذج في مكان واحد.

```javascript
const models = {
  User,
  Post,
  Post_Image,
  Comment,
  Like,
};
```
نجمعها في كائن واحد — هذا يمكّننا من تمرير كائن `models` الكامل لدوال `associate`.

```javascript
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});
```
- `Object.values(models)` ← يحوّل الكائن لمصفوفة من النماذج: `[User, Post, ...]`
- `.forEach(...)` ← يمرّ على كل نموذج
- `if (model.associate)` ← هل هذا النموذج عنده دالة `associate`؟
- `model.associate(models)` ← ينفّذها مع تمرير كائن `models` الكامل

**لماذا هذا ضروري؟**

لأن العلاقات تحتاج لمعرفة **كل** النماذج:
```javascript
// داخل User.associate
User.hasMany(models.Post)  ← تحتاج لـ models.Post
User.hasMany(models.Comment)  ← تحتاج لـ models.Comment
```

لو استوردت النموذج مباشرة داخل ملف النموذج → **Circular Import** (استيراد دائري يسبب خطأ). الحل: نُمرّر كائن `models` من الخارج.

```javascript
export default models;
```
نُصدّر الكائن الكامل — أي ملف يحتاج نموذجاً يستورد من هنا.

---

## 8. خريطة العلاقات الكاملة

```
┌─────────────────────────────────────────────────────────────────┐
│                   قاعدة بيانات وصفاتي                          │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │  Users   │───→│    Posts     │←───│    Post_Images     │    │
│  │──────────│    │──────────────│    │────────────────────│    │
│  │ id       │  ↙ │ id           │    │ id                 │    │
│  │ name     │    │ title        │    │ imageUrl           │    │
│  │ email    │    │ content      │    │ PostId (FK)        │    │
│  │ password │    │ steps (JSON) │    └────────────────────┘    │
│  │ ImageUrl │    │ country      │                              │
│  └──────────┘    │ region       │    ┌────────────────────┐    │
│        ↓         │ UserId (FK)  │───→│     Comments       │    │
│        │         └──────────────┘    │────────────────────│    │
│        │                ↕            │ id                 │    │
│        │         ┌──────────────┐    │ text               │    │
│        └────────→│    Likes     │    │ UserId (FK)        │    │
│                  │──────────────│    │ PostId (FK)        │    │
│                  │ id           │    └────────────────────┘    │
│                  │ UserId (FK)  │                              │
│                  │ PostId (FK)  │                              │
│                  └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

**أنواع العلاقات:**

| العلاقة | المعنى | مثال |
|---------|--------|------|
| `hasMany` | الوالد → عدة أطفال | مستخدم → عدة وصفات |
| `belongsTo` | الطفل → والد واحد | وصفة → مستخدم واحد |
| `belongsToMany` | عبر جدول وصل | مستخدم ↔ وصفة عبر Like |

---

## 9. خلاصة — مقارنة DataTypes

| DataType | الاستخدام | مثال |
|---------|-----------|------|
| `INTEGER` | أرقام صحيحة، معرّفات | `id: 1, 2, 3` |
| `STRING` | نص قصير (≤255) | اسم، إيميل |
| `STRING(500)` | نص أطول | روابط Cloudinary |
| `TEXT` | نص بلا حد | محتوى الوصفة |
| `JSON` | كائن JavaScript | خطوات الوصفة |
| `BOOLEAN` | صح/خطأ | `isActive: true` |

---

*الدرس العاشر من ثلاثة عشر — [← الدرس التاسع: المتحكمات](./09-controllers.md) | [الدرس الحادي عشر: المسارات →](./11-routes.md)*
