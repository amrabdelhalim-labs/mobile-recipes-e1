# شرح هيكل التطبيق الرئيسي (App.tsx)

## 📋 نظرة عامة

ملف `App.tsx` هو **نقطة البداية** لتطبيق Ionic React. يحتوي على البنية الأساسية والتوجيه (Routing).

---

## 📚 الكود الكامل

```tsx
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import AppTabs from './AppTabs';
import Menu from './components/Menu/Menu';
import AuthContextProvider from './context/AuthContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
import '@ionic/react/css/palettes/dark.class.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthContextProvider>
      <IonReactRouter basename={import.meta.env.BASE_URL}>
        <Menu />
        <IonRouterOutlet id="menu">
          <Route exact path="/account/login">
            <Login />
          </Route>
          <Route exact path="/account/register">
            <Register />
          </Route>
          <Route path="/tabs">
            <AppTabs />
          </Route>
          <Route exact path="/">
            <Redirect to="/tabs/home" />
          </Route>
          <Route exact path="/not-found">
            <NotFound />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthContextProvider>
  </IonApp>
);

export default App;
```

---

## 🎨 القسم الأول: استيراد Ionic CSS

```tsx
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
```

### الشرح:
- **`core.css`**: CSS أساسي لجميع مكونات Ionic
- **`normalize.css`**: توحيد مظهر العناصر في جميع المتصفحات
- **`structure.css`**: البنية الأساسية للتطبيق
- **`typography.css`**: أنماط الخطوط والنصوص

⚠️ **مهم**: هذه الملفات **إلزامية** - بدونها لن يعمل Ionic بشكل صحيح!

---

## 🎨 القسم الثاني: CSS الاختياري

```tsx
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
```

### الشرح:
- **Utility Classes** (كلاسات مساعدة)
- تسهل التنسيق بدون كتابة CSS مخصص

**مثال**:
```tsx
<div className="ion-padding">  {/* padding تلقائي */}
  <p className="ion-text-center">  {/* نص في المنتصف */}
    مرحباً
  </p>
</div>
```

---

## 🌙 القسم الثالث: الوضع الداكن

```tsx
import '@ionic/react/css/palettes/dark.class.css';
```

### الشرح:
- يفعل **Dark Mode** (الوضع الداكن/الليلي)
- يتفعل تلقائياً عند إضافة class `dark` لـ `<html>`

**كيف يعمل؟**
```javascript
document.documentElement.classList.add('dark');
// تفعيل

// تعطيل
document.documentElement.classList.remove('dark');
```

**خيارات أخرى**:
```tsx
import '@ionic/react/css/palettes/dark.always.css';
// الوضع الداكن دائماً

// حسب نظام التشغيل
import '@ionic/react/css/palettes/dark.system.css';
```

---

## ⚙️ القسم الرابع: إعداد Ionic

```tsx
setupIonicReact();
```

### الشرح:
- يُشغل Ionic ويهيئه
- يُستدعى **مرة واحدة** في بداية التطبيق

**ما يفعله**:
- تهيئة Gestures (الإيماءات)
- إعداد الانتقالات (Animations)
- تفعيل الوضع المناسب (iOS/Android/PWA)

**خيارات إضافية**:
```tsx
setupIonicReact({
  mode: 'ios',  // فرض وضع iOS
  animated: false,  // تعطيل الانتقالات
});
```

---

## 📦 القسم الخامس: المكونات الرئيسية

### 1️⃣ **IonApp**

```tsx
<IonApp>
  {/* كل شيء هنا */}
</IonApp>
```

**الشرح**:
- **الحاوية الرئيسية** للتطبيق
- يجب أن تكون أول مكون

---

### 2️⃣ **AuthContextProvider**

```tsx
<AuthContextProvider>
  {/* التطبيق */}
</AuthContextProvider>
```

**الشرح**:
- يوفر **سياق المصادقة** (Authentication Context)
- يتيح لجميع المكونات الوصول لمعلومات المستخدم

**ما يوفره**:
- `loggedIn`: هل المستخدم مسجل دخوله؟
- `user`: معلومات المستخدم
- `jwt`: Token المصادقة
- `logout()`: تسجيل الخروج
- `fetchProfile()`: جلب معلومات المستخدم

**مثال استخدام**:
```tsx
import { useContext } from 'react';
import { AuthContext } from './context/auth.types';

const MyComponent = () => {
  const { loggedIn, user } = useContext(AuthContext);
  
  if (loggedIn) {
    return <p>مرحباً {user?.name}</p>;
  }
  return <p>الرجاء تسجيل الدخول</p>;
};
```

---

### 3️⃣ **IonReactRouter**

```tsx
<IonReactRouter basename={import.meta.env.BASE_URL}>
  {/* المسارات */}
</IonReactRouter>
```

**الشرح**:
- **نظام التوجيه** (Router) من Ionic
- مبني على React Router

**`basename`**:
- الجزء الثابت من URL
- **مثال**: إذا كان التطبيق في `https://example.com/app/`
  - `basename="/app"`

---

### 4️⃣ **Menu**

```tsx
<Menu />
```

**الشرح**:
- **القائمة الجانبية** (Side Menu)
- تظهر عند السحب من اليسار أو الضغط على أيقونة القائمة

**محتوياتها**:
- روابط التصفح
- معلومات المستخدم
- زر تسجيل الخروج

---

### 5️⃣ **IonRouterOutlet**

```tsx
<IonRouterOutlet id="menu">
  {/* المسارات */}
</IonRouterOutlet>
```

**الشرح**:
- **مكان عرض الصفحات**
- `id="menu"`: يربطها بالقائمة الجانبية

---

## 🛣️ القسم السادس: المسارات (Routes)

### 1️⃣ **مسار تسجيل الدخول**

```tsx
<Route exact path="/account/login">
  <Login />
</Route>
```

**الشرح**:
- **المسار**: `/account/login`
- **المكون**: `<Login />`
- **`exact`**: يجب أن يطابق المسار بالضبط

---

### 2️⃣ **مسار التسجيل**

```tsx
<Route exact path="/account/register">
  <Register />
</Route>
```

---

### 3️⃣ **مسارات التبويبات**

```tsx
<Route path="/tabs">
  <AppTabs />
</Route>
```

**الشرح**:
- **بدون `exact`** → يشمل جميع المسارات التي تبدأ بـ `/tabs`
- **مثال**:
  - `/tabs/home`
  - `/tabs/profile`
  - `/tabs/my-posts`

**`<AppTabs />`** تحتوي على:
- نظام التبويبات (Tabs)
- المسارات الفرعية

---

### 4️⃣ **إعادة التوجيه الافتراضي**

```tsx
<Route exact path="/">
  <Redirect to="/tabs/home" />
</Route>
```

**الشرح**:
- عند زيارة `/` (الصفحة الرئيسية)
- يُعيد التوجيه تلقائياً إلى `/tabs/home`

---

### 5️⃣ **صفحة غير موجودة (404)**

```tsx
<Route exact path="/not-found">
  <NotFound />
</Route>

<Route>
  <NotFound />
</Route>
```

**الشرح**:
- **الأول**: صريح `/not-found`
- **الثاني**: أي مسار غير محدد أعلاه (Catch-all)

**مثال**:
```text
/unknown-page  →  <NotFound />
/xyz123        →  <NotFound />
```

---

## 🔄 تدفق التطبيق

```text
1. المستخدم يفتح التطبيق
   ↓
2. يتحقق AuthContext من وجود Token محفوظ
   ↓
3. إذا موجود → loggedIn = true
   إذا لا → loggedIn = false
   ↓
4. عرض واجهة المستخدم:
   ├─ مسجل دخوله  // يذهب لـ /tabs/home
   └─ غير مسجل  // يذهب لـ /account/login
```

---

## 💡 أمثلة عملية

### مثال 1: إضافة مسار جديد

```tsx
<Route exact path="/settings">
// إضافة صفحة الإعدادات
  <Settings />
</Route>
```

### مثال 2: حماية مسار

```tsx
import { useContext } from 'react';
import { AuthContext } from './context/auth.types';
import { Redirect } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { loggedIn } = useContext(AuthContext);
  
  if (!loggedIn) {
    return <Redirect to="/account/login" />;
  }
  
  return children;
};

// استخدام
<Route path="/tabs">
  <PrivateRoute>
    <AppTabs />
  </PrivateRoute>
</Route>
```

---

## 🎯 النقاط المهمة

✅ **`App.tsx`** = نقطة البداية الرئيسية للتطبيق  
✅ **Ionic CSS** ضروري للمكونات  
✅ **AuthContextProvider** يوفر حالة المصادقة لكل التطبيق  
✅ **IonReactRouter** يدير التوجيه والمسارات  
✅ **Routes** تحدد أي صفحة تظهر لأي مسار  

---

## 🔗 العلاقة مع ملفات أخرى

```text
App.tsx
├── AuthContextProvider (context/AuthContext.tsx)
├── Menu (components/Menu/Menu.tsx)
├── AppTabs (AppTabs.tsx)
├── Login (pages/Login.tsx)
├── Register (pages/Register.tsx)
└── NotFound (pages/NotFound.tsx)
```

---

**📖 الخطوة التالية**: [نظام التبويبات](./02-app-tabs.md)
