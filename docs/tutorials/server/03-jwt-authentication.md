# شرح نظام JWT للمصادقة (jwt.js)

## 📋 نظرة عامة

ملف `jwt.js` يدير **JSON Web Tokens** للمصادقة والتحقق من هوية المستخدمين.

---

## 🤔 ما هو JWT؟

**JWT** = JSON Web Token = رمز رقمي مشفر

### مثال للتوضيح:

#### التشبيه التقليدي:
- تذهب للمطعم → تدفع → يعطونك **تذكرة برقم**
- عندما يجهز طلبك → تعرض التذكرة → يتحققون منها → يعطوك الطعام

#### في البرمجة:
- تسجل دخول → ترسل username/password → الخادم يعطيك **JWT**
- في كل طلب لاحق → ترسل JWT → الخادم يتحقق منه → يعيد البيانات

---

## 📚 الكود الكامل

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  console.warn('JWT_SECRET is not set; using a development fallback');
}

const SECRET = JWT_SECRET || 'dev_jwt_secret';

const generate = payload => {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
};

const verify = token => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  };
};

export { generate, verify };
```

---

## 🔐 القسم الأول: المفتاح السري (Secret Key)

```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  console.warn('JWT_SECRET is not set; using a development fallback');
}

const SECRET = JWT_SECRET || 'dev_jwt_secret';
```

### الشرح التفصيلي:

#### 1. **قراءة المفتاح από `.env`**:
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
```

💡 **مثال في ملف `.env`**:
```env
JWT_SECRET=my_super_secret_key_12345
```

#### 2. **الفحص الأمني**:
```javascript
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  console.warn('JWT_SECRET is not set; using a development fallback');
}
```

**ما يحدث**:
- **في Production**: إذا لم يوجد `JWT_SECRET` → يتوقف التطبيق ❌
- **في Development**: يظهر تحذير فقط ⚠️

**لماذا؟**
- في Production: المفتاح السري **ضروري** للأمان
- في Development: يمكن استخدام مفتاح افتراضي للتسهيل

#### 3. **المفتاح النهائي**:
```javascript
const SECRET = JWT_SECRET || 'dev_jwt_secret';
```
- إذا وُجد `JWT_SECRET` → استخدمه
- وإلا → استخدم `'dev_jwt_secret'` (للتطوير فقط)

---

## ✍️ القسم الثاني: توليد Token جديد

```javascript
const generate = payload => {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
};
```

### الشرح:

#### 1. **المعاملات**:

**`payload`**: البيانات التي نريد تشفيرها
```javascript
{
  id: 123,
  email: 'user@example.com',
  username: 'ahmed'
}
```

**`SECRET`**: المفتاح السري للتشفير

**`options`**: خيارات إضافية
```javascript
{ expiresIn: '30d' }  // ينتهي بعد 30 يوماً
```

#### 2. **الناتج**:
```javascript
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDk0NTkyMDB9.8Kx2Q3uXk7KqC9X3kE5qY2_ZJ3K8Q5tN2C"
```

هذا هو **JWT Token** - نص طويل مشفر!

---

## 🔍 القسم الثالث: التحقق من Token

```javascript
const verify = token => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  };
};
```

### الشرح:

#### 1. **المعامل**:
```javascript
token  // JWT Token الذي أرسله المستخدم
```

#### 2. **المحاولة**:
```javascript
try {
  return jwt.verify(token, SECRET);
}
```

**ما يفعله `jwt.verify()`**:
- يفك تشفير Token
- يتحقق من صحته
- يرجع البيانات المشفرة (payload)

#### 3. **في حالة النجاح** ✅:
```javascript
{
  id: 123,
  email: 'user@example.com',
  username: 'ahmed',
  iat: 1609459200,    // تاريخ الإنشاء
  exp: 1612051200     // تاريخ الانتهاء
}
```

#### 4. **في حالة الفشل** ❌:
```javascript
catch (error) {
  return null;
}
```

**أسباب الفشل**:
- Token مزور (معدل)
- Token منتهي الصلاحية
- Token تالف (ناقص أو محرف)

---

## 🔄 كيف يعمل النظام الكامل؟

### 1. **تسجيل الدخول**:
```javascript
// في user.controller.js
const token = jwt.generate({
  id: user.id,
  email: user.email,
  username: user.username
});

res.json({ token });
```

**ماذا حدث؟**
- المستخدم أدخل email وpassword صحيحين
- الخادم أنشأ JWT Token
- أرسل Token للمستخدم

### 2. **المستخدم يحفظ Token**:
```javascript
// في التطبيق (Client)
localStorage.setItem('token', token);
// أو
Preferences.set({ key: 'accessToken', value: token });
```

### 3. **طلبات لاحقة**:
```javascript
// في كل طلب للخادم
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 4. **التحقق في الخادم**:
```javascript
// في user.middleware.js
const token = req.headers.authorization.split(' ')[1];
const decoded = jwt.verify(token);

if (decoded) {
  req.currentUser = decoded;  // ✅ مصادق عليه
  next();
} else {
  res.status(401).json({ message: 'غير مصرح' });  // ❌ مرفوض
}
```

---

## 🔐 بنية JWT Token

JWT يتكون من **3 أجزاء** مفصولة بنقطة (`.`):

```
xxxxx.yyyyy.zzzzz
```

### الجزء الأول: Header (الرأس)
```json
{
  "alg": "HS256",    // خوارزمية التشفير
  "typ": "JWT"       // النوع
}
```

### الجزء الثاني: Payload (البيانات)
```json
{
  "id": 123,
  "email": "user@example.com",
  "iat": 1609459200,   // issued at (تاريخ الإنشاء)
  "exp": 1612051200    // expires (تاريخ الانتهاء)
}
```

### الجزء الثالث: Signature (التوقيع)
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET
)
```

**الغرض**: التأكد من أن Token لم يُعدل

---

## 💡 أمثلة عملية

### مثال 1: إنشاء Token
```javascript
import { generate } from './utilities/jwt.js';

const user = { id: 5, email: 'ali@example.com' };
const token = generate(user);

console.log(token);
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### مثال 2: التحقق من Token صحيح
```javascript
import { verify } from './utilities/jwt.js';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const decoded = verify(token);

console.log(decoded);
// { id: 5, email: 'ali@example.com', iat: ..., exp: ... }
```

### مثال 3: التحقق من Token خاطئ
```javascript
const fakeToken = 'invalid_token_123';
const decoded = verify(fakeToken);

console.log(decoded);
// null
```

---

## ⏰ صلاحية Token

```javascript
{ expiresIn: '30d' }
```

### خيارات أخرى:
```javascript
{ expiresIn: '1h' }      // ساعة واحدة
{ expiresIn: '7d' }      // 7 أيام
{ expiresIn: '15m' }     // 15 دقيقة
{ expiresIn: 60 }        // 60 ثانية
```

### لماذا 30 يوماً؟
- ✅ المستخدم لا يحتاج لتسجيل الدخول باستمرار
- ✅ أمان جيد (ليس أبدياً)
- ⚠️ في التطبيقات الحساسة: استخدم مدة أقصر (مثل ساعة)

---

## 🛡️ الأمان

### ✅ ممارسات جيدة:
1. **استخدم `JWT_SECRET` قوي**:
```env
JWT_SECRET=Kj8#mP2$qR@5vN!9xL&3wT^7bF
```

2. **لا تخزن معلومات حساسة**:
```javascript
// ❌ سيء
generate({ id: 1, password: 'secret123' });

// ✅ جيد
generate({ id: 1, email: 'user@example.com' });
```

3. **استخدم HTTPS** لنقل Token

### ❌ مخاطر:
- Token مكشوف (في URL أو console) → يمكن سرقته
- `JWT_SECRET` مكشوف → يمكن تزوير Tokens
- Token بدون صلاحية → يبقى صالحاً للأبد

---

## ❓ أسئلة شائعة

### 1. **هل JWT آمن؟**
نعم، إذا:
- استخدمت `JWT_SECRET` قوي
- نقلته عبر HTTPS
- لم تخزن معلومات حساسة فيه

### 2. **هل يمكن حذف Token قبل انتهاء صلاحيته؟**
لا، JWT stateless (لا يُحفظ في الخادم).  
**الحل**: استخدم "blacklist" لتخزين Tokens الملغاة.

### 3. **ما الفرق بين JWT و Sessions؟**
- **JWT**: بدون حالة (stateless) - لا يحتاج تخزين في الخادم
- **Sessions**: بحالة (stateful) - يُخزن في الخادم

### 4. **لماذا نرجع `null` بدلاً من رمي خطأ في `verify()`؟**
لنجعل التعامل مع الفشل أسهل في الكود:
```javascript
if (verify(token)) {
  // نجح
} else {
  // فشل
}
```

---

## 🎯 النقاط المهمة

✅ **JWT** = رمز مشفر يحمل معلومات المستخدم  
✅ **generate()** = إنشاء Token جديد عند تسجيل الدخول  
✅ **verify()** = التحقق من Token في كل طلب  
✅ **JWT_SECRET** يجب أن يكون قوي وسري  
✅ Token ينتهي بعد 30 يوماً تلقائياً  

---

**📖 الخطوة التالية**: [وسيط المصادقة](./04-auth-middleware.md)
