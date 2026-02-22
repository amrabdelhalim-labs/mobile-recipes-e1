# شرح إعداد الخادم الرئيسي (app.js)

## 📋 نظرة عامة

ملف `app.js` هو **نقطة البداية الرئيسية** للخادم (Server). يحتوي على جميع إعدادات Express والمسارات والاتصال بقاعدة البيانات.

---

## 📚 القسم الأول: استيراد المكتبات

```javascript
import 'dotenv/config';
import express from 'express';
import router from './routes/index.js';
import cors from 'cors';
import fs from 'node:fs';
import https from 'node:https';
import db from './utilities/database.js';
import { imagesRoot } from './utilities/files.js';
```

### الشرح:
- **`dotenv/config`**: يقرأ ملف `.env` ويضع المتغيرات في `process.env`
- **`express`**: إطار عمل لبناء API
- **`router`**: جميع المسارات (routes) الخاصة بالتطبيق
- **`cors`**: للسماح للتطبيق الأمامي (الموبايل) بالاتصال بالخادم
- **`fs` و `https`**: للتعامل مع HTTPS (بروتوكول آمن)
- **`db`**: الاتصال بقاعدة البيانات
- **`imagesRoot`**: مسار مجلد الصور

---

## 🚀 القسم الثاني: إنشاء التطبيق

```javascript
const app = express();
const PORT = process.env.PORT || 3000;
```

### الشرح:
- **`express()`**: ينشئ تطبيق Express جديد
- **`PORT`**: رقم المنفذ (من `.env` أو 3000 افتراضياً)

💡 **مثال**: إذا كان `PORT=5000` في ملف `.env`، سيعمل الخادم على `http://localhost:5000`

---

## 🌐 القسم الثالث: إعدادات CORS

```javascript
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:8100'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### الشرح التفصيلي:

#### 1. **ما هو CORS؟**
- **CORS** = Cross-Origin Resource Sharing
- يحل مشكلة: "التطبيق في `localhost:8100` يريد الاتصال بخادم في `localhost:3000`"
- المتصفح يمنع هذا بشكل افتراضي للأمان
- نحتاج لتفعيل CORS للسماح بذلك

#### 2. **القائمة المسموحة**:
```javascript
const allowedOrigins = ['http://localhost:5173', 'http://localhost:8100'];
```
- هذه الروابط **فقط** مسموح لها بالاتصال بالخادم
- `5173` = Vite (أداة البناء)
- `8100` = Ionic (تطبيق الموبايل)

#### 3. **الفحص**:
```javascript
if (allowedOrigins.includes(origin)) {
  callback(null, true); // مسموح ✅
} else {
  callback(new Error('Not allowed by CORS')); // ممنوع ❌
}
```

#### 4. **حالة خاصة**:
```javascript
if (!origin) return callback(null, true);
```
- الطلبات بدون `origin` (مثل Postman أو تطبيقات الموبايل الأصلية) مسموحة

---

## 📝 القسم الرابع: Middleware (الوسائط)

```javascript
if (process.env.NODE_ENV === 'development') {
  const { default: morgan } = await import('morgan');
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use('/', router);
app.use('/images', express.static(imagesRoot));
```

### الشرح:

#### 1. **Morgan للتسجيل** (فقط في Development):
```javascript
app.use(morgan('dev'));
```
- يطبع تفاصيل كل طلب HTTP في Console
- **مثال**: `GET /api/posts 200 45ms`

#### 2. **تحليل JSON**:
```javascript
app.use(express.json({ limit: '1mb' }));
```
- يحول البيانات الواردة من JSON إلى كائن JavaScript
- **الحد الأقصى**: 1 ميجابايت

#### 3. **المسارات**:
```javascript
app.use('/', router);
```
- جميع المسارات (`/api/posts`, `/api/users`, إلخ) تأتي من ملف `routes/index.js`

#### 4. **خدمة الصور**:
```javascript
app.use('/images', express.static(imagesRoot));
```
- يجعل مجلد الصور متاحاً عبر الرابط `/images`
- **مثال**: الصورة في `public/images/photo.jpg` متاحة على `http://localhost:3000/images/photo.jpg`

---

## 🏥 القسم الخامس: Health Check

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});
```

### الشرح:
- **الغرض**: التحقق من أن الخادم يعمل بشكل صحيح
- **الاستخدام**: افتح `http://localhost:3000/health` في المتصفح
- **الناتج**:
```json
{
  "status": "OK",
  "message": "Server is running",
  "environment": "development",
  "timestamp": "2026-02-22T10:30:00.000Z"
}
```

💡 **فائدة**: مفيد لأدوات المراقبة (Monitoring) في الإنتاج (Production)

---

## ⚠️ القسم السادس: معالج الأخطاء العام

```javascript
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    if (err.name === 'MulterError') {
        return res.status(400).json({ message: err.message });
    }

    if (err.message === 'يجب أن تكون الملفات من نوع صورة فقط!') {
        return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'خطأ غير متوقع في الخادم' });
});
```

### الشرح:

#### 1. **متى يُستدعى؟**
- عندما يحدث خطأ في أي مكان في التطبيق

#### 2. **أنواع الأخطاء**:

**أ. MulterError** (أخطاء رفع الملفات):
```javascript
if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
}
```
- **مثال**: رفع ملف أكبر من الحد المسموح

**ب. أخطاء نوع الملف**:
```javascript
if (err.message === 'يجب أن تكون الملفات من نوع صورة فقط!') {
    return res.status(400).json({ message: err.message });
}
```
- **مثال**: محاولة رفع ملف PDF بدلاً من صورة

**ج. أخطاء عامة**:
```javascript
return res.status(500).json({ message: 'خطأ غير متوقع في الخادم' });
```
- أي خطأ آخر غير متوقع

#### 3. **التسجيل**:
```javascript
console.error('Error:', err.message);
console.error('Stack:', err.stack);
```
- يطبع تفاصيل الخطأ في Console للمطور

---

## 🗄️ القسم السابع: تشغيل الخادم

```javascript
const initializeServer = async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connection established successfully');
    
    await db.sync({ alter: true });
    console.log('✅ Database synced successfully');
    
    console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
    
    const httpsKeyPath = process.env.HTTPS_KEY_PATH;
    const httpsCertPath = process.env.HTTPS_CERT_PATH;
    const httpsCaPath = process.env.HTTPS_CA_PATH;

    if (httpsKeyPath && httpsCertPath) {
      const tlsOptions = {
        key: fs.readFileSync(httpsKeyPath),
        cert: fs.readFileSync(httpsCertPath),
      };

      if (httpsCaPath) {
        tlsOptions.ca = fs.readFileSync(httpsCaPath);
      }

      https.createServer(tlsOptions, app).listen(PORT, () => {
        console.log(`✅ HTTPS server is running on port ${PORT}`);
      });
    } else {
      app.listen(PORT, () => {
        console.log(`✅ HTTP server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
};

initializeServer();
```

### الشرح التفصيلي:

#### 1. **الاتصال بقاعدة البيانات**:
```javascript
await db.authenticate();
```
- يتحقق من إمكانية الاتصال بـ PostgreSQL
- إذا فشل، يتوقف الخادم ❌

#### 2. **مزامنة الجداول**:
```javascript
await db.sync({ alter: true });
```
- ينشئ أو يحدث جداول قاعدة البيانات
- **`alter: true`**: يحدث الجداول الموجودة بدون حذف البيانات

⚠️ **تحذير**: في الإنتاج (Production)، استخدم Migrations بدلاً من `sync`

#### 3. **HTTPS أو HTTP**:

**أ. إذا كانت شهادات HTTPS موجودة**:
```javascript
if (httpsKeyPath && httpsCertPath) {
  https.createServer(tlsOptions, app).listen(PORT);
}
```
- يشغل خادم HTTPS آمن (🔒)
- يحتاج ملفات: `key.pem` و `cert.pem`

**ب. وإلا**:
```javascript
else {
  app.listen(PORT);
}
```
- يشغل خادم HTTP عادي

#### 4. **معالجة الأخطاء**:
```javascript
catch (error) {
  console.error('❌ Failed to initialize server:', error);
  process.exit(1);
}
```
- إذا فشل التشغيل، يطبع الخطأ ويغلق التطبيق

---

## 📊 ملخص تدفق التنفيذ

```
1. قراءة متغيرات البيئة (.env)
   ↓
2. إنشاء تطبيق Express
   ↓
3. إعداد CORS
   ↓
4. تفعيل Middleware (JSON, Morgan, Routes)
   ↓
5. إضافة Health Check
   ↓
6. إضافة معالج الأخطاء
   ↓
7. الاتصال بقاعدة البيانات
   ↓
8. مزامنة الجداول
   ↓
9. تشغيل الخادم (HTTP أو HTTPS)
   ↓
10. ✅ الخادم جاهز!
```

---

## 💡 أمثلة عملية

### مثال 1: تشغيل الخادم في Development
```bash
npm run dev
```
**الناتج**:
```
✅ Database connection established successfully
✅ Database synced successfully
🌐 CORS allowed origins: http://localhost:5173, http://localhost:8100
✅ HTTP server is running on port 3000
```

### مثال 2: اختبار Health Check
```bash
curl http://localhost:3000/health
```
**الناتج**:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### مثال 3: الحصول على قائمة المنشورات
```bash
curl http://localhost:3000/api/posts
```

---

## ❓ أسئلة شائعة

### 1. **لماذا نستخدم `async/await`؟**
لأن الاتصال بقاعدة البيانات يستغرق وقتاً، نحتاج لانتظار اكتماله.

### 2. **ما الفرق بين HTTP و HTTPS؟**
- **HTTP**: غير مشفر (يمكن قراءة البيانات)
- **HTTPS**: مشفر (آمن) 🔒

### 3. **لماذا `sync({ alter: true })`؟**
لتحديث جداول قاعدة البيانات تلقائياً عند تغيير النماذج (Models).

### 4. **هل يمكن تشغيل الخادم بدون قاعدة بيانات؟**
لا، سيفشل التشغيل إذا لم يتمكن من الاتصال بـ PostgreSQL.

---

## 🎯 النقاط المهمة

✅ **app.js** هو نقطة البداية للخادم  
✅ **CORS** ضروري للسماح للتطبيق الأمامي بالاتصال  
✅ **Middleware** يعالج الطلبات قبل وصولها للمسارات  
✅ **معالج الأخطاء** يمنع تعطل الخادم عند حدوث أخطاء  
✅ **Health Check** مفيد لمراقبة الخادم  

---

**📖 الخطوة التالية**: [الاتصال بقاعدة البيانات](./02-database-connection.md)
