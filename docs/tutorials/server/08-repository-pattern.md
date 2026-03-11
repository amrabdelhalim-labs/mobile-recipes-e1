# الدرس الثامن: نمط المستودع (Repository Pattern) 🏗️

> **هدف الدرس:** فهم كيف يفصل نمط المستودع منطق الوصول إلى قاعدة البيانات عن منطق الأعمال في وصفاتي

---

## المحتويات

## 📚 المحتويات

1. [ما هي المشكلة الأصلية؟](#المشكلة-الأصلية)
2. [كيف يحلها Repository؟](#الحل)
3. [مقارنة عملية تفصيلية](#مقارنة-عملية)
4. [تطبيق على المشروع](#التطبيق-على-المشروع)
5. [حالات الاستخدام](#حالات-الاستخدام)

---

## المشكلة الأصلية

### سيناريو: بدون Repository Pattern

```text
Controllers:

مثال واقعي - تسجيل دخول مستخدم
├── user.controller.js
│   ├── ❌ رمز Sequelize معقد مختلط
│   ├── ❌ معالجة البيانات والتحقق في نفس المكان
│   ├── ❌ علاقات معقدة مباشرة
│   └── ❌ صعوبة في تتبع الأخطاء

المشاكل:
1. كود كثير ومعقد في كل Controller
2. إذا أردنا تغيير قاعدة البيانات - نغير كل Controller!
3. من الصعب إعادة استخدام العمليات في أماكن أخرى
4. الاختبار صعب جداً - نحتاج قاعدة بيانات فعلية
5. كل مبرمج يكتب الكود بطريقة مختلفة
```

### الكود القديم (مشكلة):

```javascript
// controllers/auth.controller.js - بدون Repository
import User from '../models/users.model.js';
import bcrypt from 'bcrypt';
import * as jwt from '../utilities/jwt.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ❌ مختلط مع Sequelize مباشرة
    const user = await User.findOne({
      where: { email },
      include: [
        { association: 'Posts', attributes: ['id', 'title'] },
        { association: 'Comments', attributes: ['id', 'text'] }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'بيانات دخول غير صحيحة' });
    }

    // ❌ منطق التحقق مختلط مع الوصول للبيانات
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'بيانات دخول غير صحيحة' });
    }

    // ❌ منطق التوكن هنا
    const token = jwt.generate({ id: user.id, email: user.email });

    // ❌ معالجة البيانات المخرجة هنا
    const userData = user.toJSON();
    delete userData.password;

    return res.status(200).json({ token, user: userData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
```

---

## الحل

### مع Repository Pattern

```text
Controllers (منطق العمل فقط)

المعمارية الصحيحة:
  // يستخدم
Repositories (وصول للبيانات)
  // يستخدم
Database (Sequelize)
```

### الكود الجديد (حل):

```javascript
// controllers/auth.controller.js - مع Repository
import repositories from '../repositories/index.js';
import bcrypt from 'bcrypt';
import * as jwt from '../utilities/jwt.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ استخدام Repository - بسيط وواضح
    const user = await repositories.user.findByEmailWithRelations(email);

    if (!user) {
      return res.status(400).json({ message: 'بيانات دخول غير صحيحة' });
    }

    // ✅ فقط منطق التحقق
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'بيانات دخول غير صحيحة' });
    }

    // ✅ إنشاء التوكن
    const token = jwt.generate({ id: user.id, email: user.email });

    // ✅ إرسال الرد
    const userData = user.toJSON();
    delete userData.password;

    return res.status(200).json({ token, user: userData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
```

---

## مقارنة عملية

### الفرق في التعقيد

| النقطة | بدون Repository | مع Repository |
|--------|-----------------|---------------|
| **سطور الكود** | 40+ سطر | 15+ سطر |
| **عمليات Sequelize** | مكتوبة في Controller | في Repository |
| **المنطق المختلط** | نعم (مشكلة) | لا (منفصل) |
| **إعادة الاستخدام** | صعب | سهل جداً |
| **الاختبار** | يحتاج DB فعلية | يمكن عمل Mock |

---

### حالات استخدام عملية

#### الحالة 1: تسجيل المستخدم

**بدون Repository:**
```javascript
const register = async (req, res) => {
// ❌ كود معقد وطويل
  const { name, email, password } = req.body;

  // تحقق من البريد موجود؟
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: 'البريد مستخدم بالفعل' });
  }

  // تشفير كلمة المرور
  const hashedPassword = await bcrypt.hash(password, 10);

  // إنشاء المستخدم
  await User.create({
    name,
    email,
    password: hashedPassword
  });

  return res.status(201).json({ message: 'تم إنشاء الحساب' });
};
```

**مع Repository:**
```javascript
const register = async (req, res) => {
// ✅ كود بسيط وواضح
  const { name, email, password } = req.body;

  // تحقق من البريد موجود؟
  const exists = await repositories.user.emailExists(email);
  if (exists) {
    return res.status(400).json({ message: 'البريد مستخدم بالفعل' });
  }

  // تشفير وإنشاء
  const hashedPassword = await bcrypt.hash(password, 10);
  await repositories.user.create({
    name,
    email,
    password: hashedPassword
  });

  return res.status(201).json({ message: 'تم إنشاء الحساب' });
};
```

---

#### الحالة 2: جلب منشورات المستخدم مع التفاصيل

**بدون Repository:**
```javascript
const getMyPosts = async (req, res) => {
// ❌ كود معقد
  const { page, limit } = req.query;
  const userId = req.currentUser.id;
  const offset = (page - 1) * limit;

  // استعلام معقد جداً
  const { count, rows: posts } = await Post.findAndCountAll({
    where: { UserId: userId },
    include: [
      {
        association: 'User',
        attributes: ['id', 'name', 'ImageUrl']
      },
      {
        association: 'images',
        attributes: ['id', 'imageUrl']
      },
      {
        association: 'Comments',
        include: [
          {
            association: 'User',
            attributes: ['id', 'name', 'ImageUrl']
          }
        ]
      },
      {
        association: 'Likes',
        attributes: ['UserId']
      }
    ],
    offset,
    limit,
    order: [['createdAt', 'DESC']],
    distinct: true
  });

  res.json({
    posts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalPosts: count
    }
  });
};
```

**مع Repository:**
```javascript
const getMyPosts = async (req, res) => {
// ✅ كود بسيط جداً
  const { page = 1, limit = 10 } = req.query;
  const userId = req.currentUser.id;

  // عملية واحدة فقط!
  const result = await repositories.post.findByUser(userId, page, limit);

  res.json({
    posts: result.rows,
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      totalPosts: result.count
    }
  });
};
```

---

#### الحالة 3: الاختبار

**بدون Repository - صعب جداً:**
```javascript
describe('Auth Controller', () => {
// ❌ يحتاج database فعلية
  it('should login user', async () => {
    // إنشاء مستخدم حقيقي في DB
    await User.create({
      name: 'Test',
      email: 'test@example.com',
      password: await bcrypt.hash('pass', 10)
    });

    const req = { body: { email: 'test@example.com', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

**مع Repository - سهل جداً:**
```javascript
describe('Auth Controller', () => {
// ✅ يمكن عمل Mock بسهولة
  it('should login user', async () => {
    // Mock Repository
    repositories.user.findByEmailWithRelations = jest.fn()
      .mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('pass', 10)
      });

    const req = { body: { email: 'test@example.com', password: 'pass' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

---

## التطبيق على المشروع

### كيف يعمل كل Repository

#### 1. UserRepository

```javascript
repositories.user.findAll()                      // جميع المستخدمين
// الشروحات الأساسية
repositories.user.findByEmail('test@email.com') // بحث برسالة
repositories.user.emailExists('test@email.com') // تحقق من وجود البريد
repositories.user.findWithPosts(1, 10)          // المستخدم مع منشوراته
repositories.user.create({...})                 // إنشاء مستخدم
repositories.user.updateProfile(id, {...})     // تحديث الملف الشخصي
repositories.user.deleteUser(id)                // حذف (cascade)
```

#### 2. PostRepository

```javascript
repositories.post.findAllWithUser(1, 10)       // جميع المنشورات
repositories.post.findByUser(userId, 1, 10)   // منشورات مستخدم معين
repositories.post.search('query', 1, 10)      // بحث متقدم
repositories.post.findWithDetails(id)         // تفاصيل المنشور
repositories.post.createWithImages({...}, []) // إنشاء مع صور
repositories.post.findTrending(10)            // المنشورات الشهيرة
repositories.post.deletePost(id)              // حذف
```

#### 3. CommentRepository

```javascript
repositories.comment.findByPost(postId, 1, 10)       // تعليقات المنشور
repositories.comment.findByUser(userId, 1, 10)      // تعليقات المستخدم
repositories.comment.createComment(userId, postId) // إنشاء تعليق
repositories.comment.updateText(id, 'new text')    // تحديث
repositories.comment.deleteComment(id)             // حذف
```

#### 4. LikeRepository

```javascript
repositories.like.findByPost(postId, 1, 10)     // من يحب هذا المنشور
repositories.like.findByUser(userId, 1, 10)    // ما الذي يحبه المستخدم
repositories.like.toggleLike(userId, postId)   // إضافة/إزالة إعجاب
repositories.like.isLikedByUser(userId, postId) // هل أعجب به؟
repositories.like.countByPost(postId)          // عدد الإعجابات
```

---

## الفوائد الحقيقية

### 1. **Maintainability - سهولة الصيانة**
```text
مثال: تغيير طريقة البحث
- بدون Repository: تغيير 5-10 Controllers
- مع Repository: تغيير 1 Repository فقط!
```

### 2. **Testability - سهولة الاختبار**
```javascript
jest.mock('../repositories', () => ({
// اختبار Controller بدون الاحتياج لـ Database
  user: {
    findByEmail: jest.fn().mockResolvedValue({ id: 1 })
  }
}));
```

### 3. **Readability - وضوح الكود**
```javascript
const user = await User.findOne({ where: { email }, include: [...] });
// بدلاً من:

// اكتب:
const user = await repositories.user.findByEmail(email);
// ✨ واضح ومباشر!
```

### 4. **DRY - عدم تكرار الكود**
```javascript
- Controller
// استخدم نفس العملية في أماكن مختلفة:
- Middleware
- Scheduled Jobs
- API Integration
```

---

**هذا النمط يستخدم في:**
- ✅ Google, Facebook, Amazon
- ✅ جميع المشاريع الاحترافية
- ✅ المعايير الصناعية (Enterprise Patterns)
- ✅ أفضل الممارسات العالمية
