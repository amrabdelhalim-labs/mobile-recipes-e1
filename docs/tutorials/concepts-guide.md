# دليل سريع للمفاهيم الأساسية

## 📚 المفاهيم المستخدمة في المشروع

---

## 🎯 مفاهيم Backend (الخادم)

### 1. **REST API**
- طريقة للتواصل بين التطبيق والخادم
- يستخدم HTTP Methods:
  - `GET`: جلب البيانات
  - `POST`: إنشاء جديد
  - `PUT`: تحديث كامل
  - `PATCH`: تحديث جزئي
  - `DELETE`: حذف

**مثال**:
```javascript
GET    /api/posts        // جلب جميع المنشورات
POST   /api/posts        // إنشاء منشور جديد
GET    /api/posts/:id    // جلب منشور محدد
PUT    /api/posts/:id    // تحديث منشور
DELETE /api/posts/:id    // حذف منشور
```

---

### 2. **Middleware**
- دوال تُشغل **قبل** الوصول للـ Controller
- **الاستخدامات**:
  - التحقق من المصادقة
  - التحقق من الصلاحيات
  - التحقق من صحة البيانات
  - تسجيل الطلبات (Logging)

**مثال**:
```javascript
router.post('/posts', isAuthenticated, validatePost, createPost);
//                    ↑ Middleware 1  ↑ Middleware 2  ↑ Controller
```

---

### 3. **JWT (JSON Web Token)**
- رمز مشفر يحمل معلومات المستخدم
- **البنية**: `header.payload.signature`
- **الاستخدام**: مصادقة المستخدمين بدون Sessions

**مثال**:
```javascript
const token = jwt.generate({ id: user.id, email: user.email });
// تسجيل الدخول
res.json({ token });

// في الطلبات اللاحقة
headers: {
  'Authorization': 'Bearer ' + token
}
```

---

### 4. **ORM (Object-Relational Mapping)**
- تحويل جداول قاعدة البيانات إلى كائنات JavaScript
- **المستخدم**: Sequelize

**مثال**:
```javascript
const user = await query('SELECT * FROM users WHERE id = ?', [userId]);
// بدون ORM (SQL)

// مع ORM
const user = await User.findByPk(userId);
```

---

### 5. **MVC Pattern**
- **Model**: النماذج (قاعدة البيانات)
- **View**: واجهة المستخدم (في مشروعنا: React)
- **Controller**: المنطق والمعالجة

---

### 6. **CORS**
- Cross-Origin Resource Sharing
- يسمح للتطبيق بالوصول للخادم من نطاق مختلف
- **مثال**: التطبيق في `localhost:8100` والخادم في `localhost:3000`

---

### 7. **Design Patterns المستخدمة**

#### أ. **Singleton Pattern**
```javascript
class StorageService {
  static instance = null;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new StorageService();
    }
    return this.instance;
  }
}
```

#### ب. **Factory Pattern**
```javascript
class StorageService {
  static createStrategy() {
    switch (type) {
      case 'local': return new LocalStrategy();
      case 's3': return new S3Strategy();
    }
  }
}
```

#### ج. **Strategy Pattern**
```javascript
interface StorageStrategy {
  uploadFile(file): Promise<Result>
  deleteFile(file): Promise<boolean>
}

class LocalStrategy implements StorageStrategy { ... }
class S3Strategy implements StorageStrategy { ... }
```

---

## 📱 مفاهيم Frontend (التطبيق)

### 1. **React Hooks**
- دوال خاصة تضيف إمكانيات لـ Functional Components

**الأساسية**:
```javascript
const [count, setCount] = useState(0);
// حالة

// تأثير جانبي
useEffect(() => {
  console.log('Component mounted');
}, []);

// مرجع
const inputRef = useRef(null);
```

---

### 2. **Context API**
- مشاركة البيانات بين المكونات بدون Prop Drilling

**مثال**:
```javascript
const AuthContext = createContext();
// إنشاء

// توفير
<AuthContext.Provider value={{ user, logout }}>
  <App />
</AuthContext.Provider>

// استخدام
const { user, logout } = useContext(AuthContext);
```

---

### 3. **Custom Hooks**
- إعادة استخدام المنطق بين المكونات

**مثال**:
```javascript
function usePhotoGallery() {
  const [photo, setPhoto] = useState(null);
  
  const takePhoto = async () => {
    const result = await Camera.getPhoto();
    setPhoto(result.webPath);
  };
  
  return { photo, takePhoto };
}

// الاستخدام
const { photo, takePhoto } = usePhotoGallery();
```

---

### 4. **React Router**
- التوجيه بين الصفحات

**مثال**:
```javascript
<Route exact path="/login">
  <Login />
</Route>

<Route path="/posts/:id">
  <PostDetail />
</Route>

<Redirect from="/" to="/home" />
```

---

### 5. **Ionic Components**
- مكونات جاهزة لتطبيقات الموبايل

**أمثلة**:
```jsx
<IonButton>زر</IonButton>
<IonCard>كرت</IonCard>
<IonList>قائمة</IonList>
<IonLoading isOpen={true} />
<IonToast isOpen={true} message="رسالة" />
```

---

### 6. **Capacitor**
- منصة لبناء تطبيقات موبايل مع Web Technologies

**الإمكانيات**:
- **Camera**: الكاميرا ومعرض الصور
- **Storage**: التخزين المحلي
- **Geolocation**: الموقع الجغرافي
- **Push Notifications**: الإشعارات

---

## 🔄 مفاهيم عامة

### 1. **Async/Await**
```javascript
fetch('/api/posts')
// القديم (Promises)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// الحديث (Async/Await)
try {
  const res = await fetch('/api/posts');
  const data = await res.json();
  console.log(data);
} catch (err) {
  console.error(err);
}
```

---

### 2. **Destructuring**
```javascript
const [first, second] = [1, 2, 3];
// المصفوفات

// الكائنات
const { name, age } = user;

// في المعاملات
function MyComponent({ title, onClose }) {
  // ...
}
```

---

### 3. **Spread Operator**
```javascript
const newArray = [...oldArray, newItem];
// نسخ المصفوفة

// نسخ الكائن
const newUser = { ...user, name: 'أحمد' };

// دمج الكائنات
const merged = { ...obj1, ...obj2 };
```

---

### 4. **Optional Chaining**
```javascript
if (user && user.profile && user.profile.image) {
// بدلاً من
  console.log(user.profile.image);
}

// استخدم
console.log(user?.profile?.image);
```

---

### 5. **Nullish Coalescing**
```javascript
const name = user.name || 'افتراضي';  // ❌ يعتبر '' و 0 كـ false
// بدلاً من

// استخدم
const name = user.name ?? 'افتراضي';  // ✅ فقط null أو undefined
```

---

### 6. **Template Literals**
```javascript
const message = 'مرحباً ' + name + ', عمرك ' + age;
// بدلاً من

// استخدم
const message = `مرحباً ${name}, عمرك ${age}`;
```

---

## 🛡️ مفاهيم الأمان

### 1. **Hash Password**
```javascript
user.password = '123456';
// ❌ لا تخزن كلمات المرور مباشرة

// ✅ استخدم hashing
const hashedPassword = await bcrypt.hash(password, 10);
```

---

### 2. **Environment Variables**
```javascript
const secret = 'my-secret-key-123';
// ❌ لا تكتب المعلومات الحساسة في الكود

// ✅ استخدم .env
const secret = process.env.JWT_SECRET;
```

---

### 3. **Input Validation**
```javascript
if (!title || typeof title !== 'string' || !title.trim()) {
// ✅ تحقق دائماً من المدخلات
  return res.status(400).json({ message: 'العنوان مطلوب' });
}
```

---

### 4. **SQL Injection Prevention**
```javascript
const query = `SELECT * FROM users WHERE id = ${userId}`;
// ❌ لا تستخدم string concatenation

// ✅ استخدم Parameterized Queries أو ORM
const user = await User.findByPk(userId);
```

---

## 📊 HTTP Status Codes

| الكود | المعنى | متى يُستخدم |
|------|--------|-------------|
| 200 | OK | نجاح عام |
| 201 | Created | تم الإنشاء بنجاح |
| 400 | Bad Request | خطأ في البيانات المرسلة |
| 401 | Unauthorized | غير مصادق عليه (لا token أو منتهي) |
| 403 | Forbidden | مصادق عليه لكن لا يملك الصلاحية |
| 404 | Not Found | المورد غير موجود |
| 500 | Internal Server Error | خطأ في الخادم |

---

## 🎨 Best Practices

### 1. **DRY (Don't Repeat Yourself)**
```javascript
const user1 = await User.findByPk(1);
// ❌ تكرار
const user2 = await User.findByPk(2);

// ✅ دالة
const getUser = (id) => User.findByPk(id);
const user1 = await getUser(1);
const user2 = await getUser(2);
```

---

### 2. **Single Responsibility**
```javascript
function createAndUploadPost(data, files) {
// ❌ دالة تفعل كل شيء
  // إنشاء منشور
  // رفع صور
  // إرسال إشعارات
  // ...
}

// ✅ دوال منفصلة
function createPost(data) { ... }
function uploadImages(files) { ... }
function sendNotifications(users) { ... }
```

---

### 3. **Error Handling**
```javascript
const user = await User.findByPk(userId);
// ❌ بدون معالجة أخطاء
res.json(user);

// ✅ مع معالجة
try {
  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }
  res.json(user);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'خطأ في الخادم' });
}
```

---

## 🔍 أدوات Debugging

### 1. **Console Methods**
```javascript
console.log('قيمة:', value);
console.error('خطأ:', error);
console.warn('تحذير:', warning);
console.table([user1, user2]);  // عرض كجدول
console.time('operation');
// ... code ...
console.timeEnd('operation');  // يطبع الوقت المستغرق
```

---

### 2. **Network Tab**
- افتح Developer Tools (F12)
- تبويب Network
- شاهد جميع الطلبات والاستجابات

---

### 3. **React DevTools**
- إضافة للمتصفح
- فحص المكونات والـ State

---

## 📚 مصادر للتعلم

- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Ionic**: https://ionicframework.com/docs/
- **Capacitor**: https://capacitorjs.com/docs/
- **Sequelize**: https://sequelize.org/
- **JWT**: https://jwt.io/

---

هذا الدليل يغطي المفاهيم الأساسية المستخدمة في المشروع!
