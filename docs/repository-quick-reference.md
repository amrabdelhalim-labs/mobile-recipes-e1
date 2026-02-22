# Repository Pattern - دليل سريع مرجعي

## الاستخدام السريع

### استيراد Repositories
```javascript
import repositories from '../repositories/index.js';

// أو من أمريكا نفس الشيء:
import { repositories } from '../repositories/index.js';
```

---

## عمليات المستخدم (User)

```javascript
// البحث
await repositories.user.findByPk(1)              // معرّف
await repositories.user.findByEmail('test@example.com')
await repositories.user.findAll()                // الكل
await repositories.user.findWithPosts(1, 10)     // مع المنشورات

// الإنشاء
await repositories.user.create({
  name: 'أحمد',
  email: 'ahmed@example.com',
  password: 'hashed_password'
})

// التحديث
await repositories.user.update(1, { name: 'محمد' })
await repositories.user.updateProfile(1, { name, email, password })
await repositories.user.updateImage(1, '/images/photo.jpg')

// الحذف
await repositories.user.delete(1)

// التحقق
await repositories.user.emailExists('test@example.com')
await repositories.user.exists(1)
```

---

## عمليات المنشورات (Post)

```javascript
// البحث
await repositories.post.findAll({ limit: 10 })
await repositories.post.findByPk(1)
await repositories.post.findWithDetails(1)      // مع جميع العلاقات
await repositories.post.findByUser(userId, 1, 10)
await repositories.post.findAllWithUser(1, 10)
await repositories.post.search('chocolate', 1, 10)
await repositories.post.findByLocation('Egypt', 'Cairo', 1, 10)

// الإنشاء
await repositories.post.create({
  title: 'كيكة الشوكولاتة',
  content: 'وصفة سهلة...',
  UserId: 1
})

// الإنشاء مع صور
await repositories.post.createWithImages(
  {
    title: 'الكيكة',
    content: '...',
    UserId: 1
  },
  [{ imageUrl: 'url1' }, { imageUrl: 'url2' }]
)

// التحديث
await repositories.post.update(1, { title: 'عنوان جديد' })
await repositories.post.updateContent(1, { title, content, steps })

// الحذف
await repositories.post.delete(1)

// معلومات
await repositories.post.getImageCount(1)
await repositories.post.findTrending(10)
```

---

## عمليات التعليقات (Comment)

```javascript
// البحث
await repositories.comment.findByPost(postId, 1, 20)
await repositories.comment.findByUser(userId, 1, 20)
await repositories.comment.findByPk(1)

// الإنشاء
await repositories.comment.createComment(userId, postId, 'رائع!')

// التحديث
await repositories.comment.updateText(1, 'نص جديد')

// الحذف
await repositories.comment.delete(1)

// المعلومات
await repositories.comment.countByPost(postId)
```

---

## عمليات الإعجابات (Like)

```javascript
// البحث
await repositories.like.findByPost(postId, 1, 20)    // من يحب?
await repositories.like.findByUser(userId, 1, 20)   // ماذا يحب?
await repositories.like.findUserLike(userId, postId)

// إدارة الإعجاب
await repositories.like.toggleLike(userId, postId)  // إضافة/إزالة

// التحقق
await repositories.like.isLikedByUser(userId, postId)

// المعلومات
await repositories.like.countByPost(postId)
await repositories.like.countByUser(userId)
await repositories.like.getTopPosts(10)
```

---

## عمليات صور المنشورات (PostImage)

```javascript
// البحث
await repositories.postImage.findByPost(postId)

// الإنشاء
await repositories.postImage.create({ imageUrl, PostId })
await repositories.postImage.createBulk(postId, ['url1', 'url2'])

// التحديث
await repositories.postImage.updateUrl(imageId, 'new-url')

// الحذف
await repositories.postImage.delete(imageId)
await repositories.postImage.deleteByIds([id1, id2, id3])

// المعلومات
await repositories.postImage.countByPost(postId)
await repositories.postImage.getImageUrlsByPost(postId)  // للحذف من Storage
```

---

## الـ Pagination

جميع العمليات التي تُرجع نتائج متعددة توفر pagination:

```javascript
const result = await repositories.post.findAllWithUser(page, limit);

// النتيجة:
{
  rows: [...],              // البيانات الفعلية
  count: 100,              // إجمالي العدد
  page: 1,                 // الصفحة الحالية
  totalPages: 10           // إجمالي الصفحات
}
```

---

## معالجة الأخطاء

```javascript
try {
  const user = await repositories.user.findByEmail('test@example.com');
  
  if (!user) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }
  
  // استخدم البيانات
} catch (error) {
  console.error(error);
  return res.status(500).json({ message: 'خطأ في الخادم' });
}
```

---

## أمثلة Controllers كاملة

### مثال 1: تسجيل الدخول

```javascript
import repositories from '../repositories/index.js';
import bcrypt from 'bcrypt';
import jwt from '../utilities/jwt.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // استخدام Repository
    const user = await repositories.user.findByEmailWithRelations(email);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ message: 'بيانات غير صحيحة' });
    }
    
    const token = jwt.generate({ id: user.id, email: user.email });
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'خطأ' });
  }
};
```

### مثال 2: إنشاء منشور

```javascript
export const createPost = async (req, res) => {
  try {
    const { title, content, steps } = req.body;
    const userId = req.currentUser.id;
    const uploadedImageUrls = req.uploadedImages || [];
    
    // إنشاء مع Repositories
    const post = await repositories.post.createWithImages(
      { title, content, steps, UserId: userId },
      uploadedImageUrls.map(url => ({ imageUrl: url }))
    );
    
    res.status(201).json({ message: 'تم الإنشاء', post });
  } catch (error) {
    res.status(500).json({ message: 'خطأ' });
  }
};
```

### مثال 3: الحصول على المنشورات

```javascript
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await repositories.post.findAllWithUser(page, limit);
    
    res.json({
      posts: result.rows,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        total: result.count
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ' });
  }
};
```

---

## نصائح مهمة

### ✅ افعل:
- استخدم Repository في جميع Controllers
- أنشئ عمليات مخصصة في Repository عند الحاجة
- تعامل مع الأخطاء في Controller
- استخدم pagination للبيانات الكبيرة

### ❌ لا تفعل:
- لا تستخدم Model مباشرة في Controller
- لا تكرر العمليات - اكتبها في Repository
- لا تخلط منطق العمل مع الوصول للبيانات
- لا تستخدم Sequelize مباشرة إلا في Repository

---

## ملاحظات الأداء

- **Pagination دائماً:** استخدم pagination للبيانات الكبيرة لا تجلب الكل
- **Includes انتقائية:** استخدم فقط العلاقات التي تحتاجها
- **Raw queries:** استخدم `raw: true` عندما لا تحتاج الـ getters/setters
- **Caching:** يمكن إضافة caching على مستوى Repository بسهولة

---

**تذكر:** هذا النمط جعل الكود أنظف وأسهل للصيانة! 🚀
