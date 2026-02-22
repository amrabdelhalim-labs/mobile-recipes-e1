# شرح الاتصال بقاعدة البيانات (database.js)

## 📋 نظرة عامة

ملف `database.js` يتولى مسؤولية **الاتصال بقاعدة بيانات PostgreSQL** باستخدام مكتبة Sequelize ORM.

---

## 📚 الكود الكامل

```javascript
import { Sequelize } from 'sequelize';

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
      }
    );

export const db = sequelize;
export default sequelize;
```

---

## 🤔 ما هو Sequelize؟

**Sequelize** هو **ORM** = Object-Relational Mapping

### مثال للتوضيح:

#### ❌ بدون Sequelize (SQL مباشر):
```javascript
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
```

#### ✅ مع Sequelize (JavaScript):
```javascript
const user = await User.findByPk(userId);
```

### الفوائد:
- ✅ كتابة أقل
- ✅ حماية من SQL Injection
- ✅ يعمل مع قواعد بيانات مختلفة (PostgreSQL, MySQL, SQL Server)

---

## 🔀 القسم الأول: الشرط الثلاثي

```javascript
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { ... })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, ...);
```

### الشرح:
يدعم **طريقتين** للاتصال بقاعدة البيانات:

#### **الطريقة الأولى**: رابط واحد (`DATABASE_URL`)
```
DATABASE_URL=postgres://user:password@host:5432/database_name
```
- **متى؟** في الإنتاج (Production) مثل Heroku أو Railway
- **الميزة**: رابط واحد يحتوي على كل المعلومات

#### **الطريقة الثانية**: معلومات منفصلة
```
DB_NAME=recipes_db
DB_USER=postgres
DB_PASS=mypassword
DB_HOST=localhost
DB_PORT=5432
```
- **متى؟** في التطوير (Development) المحلي
- **الميزة**: أسهل في التعديل

---

## 🌐 القسم الثاني: الاتصال عبر DATABASE_URL

```javascript
new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
})
```

### الشرح التفصيلي:

#### 1. **Dialect**:
```javascript
dialect: 'postgres',
```
- نوع قاعدة البيانات (PostgreSQL)
- خيارات أخرى: `mysql`, `sqlite`, `mssql`

#### 2. **Protocol**:
```javascript
protocol: 'postgres',
```
- البروتوكول المستخدم للاتصال

#### 3. **Logging** (التسجيل):
```javascript
logging: process.env.NODE_ENV === 'development' ? console.log : false,
```
- **في Development**: يطبع استعلامات SQL في Console
- **في Production**: لا يطبع شيئاً (لتحسين الأداء)

💡 **مثال في Development**:
```sql
Executing (default): SELECT * FROM "posts" WHERE "id" = 1;
```

#### 4. **SSL Configuration**:
```javascript
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
},
```

**الشرح**:
- **`require: true`**: يجب استخدام SSL (اتصال مشفر)
- **`rejectUnauthorized: false`**: قبول الشهادات غير الموثوقة

⚠️ **لماذا `rejectUnauthorized: false`؟**
- بعض خدمات الاستضافة (مثل Heroku) تستخدم شهادات Self-Signed
- في الإنتاج الحقيقي، يفضل استخدام `true` مع شهادة صحيحة

---

## 💻 القسم الثالث: الاتصال المحلي

```javascript
new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
)
```

### الشرح:

#### 1. **المعاملات الثلاثة الأولى**:
```javascript
process.env.DB_NAME,    // اسم قاعدة البيانات
process.env.DB_USER,    // اسم المستخدم
process.env.DB_PASS,    // كلمة المرور
```

#### 2. **الخيارات**:
```javascript
{
  host: process.env.DB_HOST,           // عنوان الخادم (localhost)
  port: process.env.DB_PORT || 5432,   // المنفذ (5432 افتراضي لـ PostgreSQL)
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
}
```

💡 **ملاحظة**: لا نحتاج SSL في الاتصال المحلي

---

## 📤 القسم الرابع: التصدير

```javascript
export const db = sequelize;
export default sequelize;
```

### الشرح:
يصدر الاتصال ليستخدمه باقي الملفات:

#### الطريقة الأولى (Default Export):
```javascript
import db from './utilities/database.js';
```

#### الطريقة الثانية (Named Export):
```javascript
import { db } from './utilities/database.js';
```

---

## 🔄 كيف يعمل الاتصال؟

```
1. قراءة المتغيرات من .env
   ↓
2. هل DATABASE_URL موجود؟
   ├─ نعم → استخدم الطريقة الأولى (مع SSL)
   └─ لا → استخدم الطريقة الثانية (معلومات منفصلة)
   ↓
3. إنشاء كائن Sequelize
   ↓
4. تصدير الكائن للاستخدام في app.js والنماذج
```

---

## 💡 أمثلة عملية

### مثال 1: ملف `.env` في Development
```env
DB_NAME=recipes_db
DB_USER=postgres
DB_PASS=mypassword123
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
```

**النتيجة**: يستخدم الطريقة الثانية (اتصال محلي)

### مثال 2: ملف `.env` في Production
```env
DATABASE_URL=postgres://user:pass@db.example.com:5432/mydb?sslmode=require
NODE_ENV=production
```

**النتيجة**: يستخدم الطريقة الأولى (مع SSL)

---

## 🧪 اختبار الاتصال

في ملف `app.js`:
```javascript
await db.authenticate();
console.log('✅ Database connection established successfully');
```

### ماذا يفعل `authenticate()`؟
- يحاول الاتصال بقاعدة البيانات
- إذا نجح → يتابع التشغيل ✅
- إذا فشل → يرمي خطأ ويتوقف ❌

---

## ⚙️ الإعدادات المتقدمة

### 1. **Connection Pool** (مجموعة الاتصالات):
```javascript
new Sequelize(DATABASE_URL, {
  pool: {
    max: 5,      // الحد الأقصى للاتصالات المتزامنة
    min: 0,      // الحد الأدنى
    acquire: 30000,  // وقت الانتظار قبل الفشل (30 ثانية)
    idle: 10000,     // وقت قطع الاتصالات الخاملة (10 ثواني)
  }
})
```

### 2. **Timezone**:
```javascript
new Sequelize(DATABASE_URL, {
  timezone: '+03:00',  // توقيت السعودية
})
```

### 3. **تعطيل Logging تماماً**:
```javascript
new Sequelize(DATABASE_URL, {
  logging: false,
})
```

---

## ❓ أسئلة شائعة

### 1. **لماذا نستخدم Sequelize بدلاً من SQL مباشر؟**
- أسهل وأسرع في الكتابة
- حماية تلقائية من SQL Injection
- يعمل مع قواعد بيانات مختلفة

### 2. **ما الفرق بين `db` و `sequelize`؟**
لا فرق، هما نفس الشيء - مجرد طريقتين للتصدير.

### 3. **هل يجب استخدام SSL دائماً؟**
- في Production: نعم ✅
- في Development المحلي: لا (اختياري)

### 4. **ماذا لو نسيت إضافة معلومات قاعدة البيانات في `.env`؟**
سيظهر خطأ:
```
SequelizeConnectionError: password authentication failed
```

---

## 🎯 النقاط المهمة

✅ **Sequelize ORM** يسهل التعامل مع قاعدة البيانات  
✅ يدعم **طريقتين** للاتصال (URL واحد أو معلومات منفصلة)  
✅ **SSL** ضروري في Production للأمان  
✅ **Logging** مفيد في Development لرؤية استعلامات SQL  
✅ يجب دائماً استخدام **متغيرات البيئة** (لا تكتب كلمات المرور في الكود!)  

---

## 🔗 علاقته بملفات أخرى

- **app.js**: يستورد `db` ويستخدم `authenticate()` و `sync()`
- **Models** (users.model.js, posts.model.js): تستخدم `sequelize` لتعريف الجداول
- **Controllers**: تستخدم النماذج (Models) التي تعتمد على هذا الاتصال

---

**📖 الخطوة التالية**: [نظام JWT للمصادقة](./03-jwt-authentication.md)
