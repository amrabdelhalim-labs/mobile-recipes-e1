# شرح سياق المصادقة (AuthContext.tsx)

## 📋 نظرة عامة

ملف `AuthContext.tsx` يدير **حالة تسجيل الدخول** في التطبيق بالكامل.

---

## 🤔 ما هو Context في React؟

**Context** = سياق = **طريقة لمشاركة البيانات** بين المكونات بدون تمريرها يدوياً.

### المشكلة بدون Context:

```tsx
<App>                        {/* المصدر: token, user */}
  <Navbar token={token} user={user} />
  <Main token={token} user={user}>
    <Profile user={user} />
    <Posts token={token} />
  </Main>
</App>
// تمرير البيانات في كل مستوى! 😫
```

### الحل مع Context:

```tsx
<AuthContextProvider>      {/* المصدر: token, user */}
  <App>
    <Navbar />              {/* يأخذ البيانات من Context مباشرة */}
    <Main>
      <Profile />           {/* يأخذ البيانات من Context مباشرة */}
      <Posts />             {/* يأخذ البيانات من Context مباشرة */}
    </Main>
  </App>
</AuthContextProvider>
```

---

## 📚 الكود الكامل

```tsx
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { IonLoading } from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import api from '../config/axios';
import { PROFILE_URL, API_URL } from '../config/urls';
import { AuthContext, type UserProfile } from './auth.types';

interface AuthContextProviderProps {
    children: ReactNode;
}

const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [showLoading, setShowLoading] = useState(true);
    const [jwt, setJwt] = useState<string | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);

    // بناء رابط صورة الملف الشخصي الكامل
    const getProfileImageUrl = useCallback((imageUrl?: string | null): string => {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${API_URL}${imageUrl}`;
    }, []);

    // جلب بيانات المستخدم من السيرفر
    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get(PROFILE_URL);
            setUser(res.data.user);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    }, []);

    useEffect(() => {
        getAuthenticated();
    }, []);

    const getAuthenticated = async () => {
        try {
            const { value } = await Preferences.get({ key: 'accessToken' });
            if (value) {
                setLoggedIn(true);
                setJwt(value);
                try {
                    const res = await api.get(PROFILE_URL);
                    setUser(res.data.user);
                } catch {
                    await Preferences.remove({ key: 'accessToken' });
                    setLoggedIn(false);
                    setJwt(null);
                    setUser(null);
                }
            } else {
                setLoggedIn(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setLoggedIn(false);
        } finally {
            setShowLoading(false);
        }
    };

    const logout = async () => {
        try {
            await Preferences.remove({ key: 'accessToken' });
            setLoggedIn(false);
            setJwt(null);
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (showLoading) {
        return <IonLoading isOpen={showLoading} message="جار التحميل..." />;
    }

    return (
        <AuthContext.Provider value={{
            loggedIn, setLoggedIn,
            jwt, setJwt,
            user, setUser,
            logout, fetchProfile,
            getProfileImageUrl,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContextProvider;
```

---

## 🔧 القسم الأول: الحالة (State)

```tsx
const [loggedIn, setLoggedIn] = useState(false);
const [showLoading, setShowLoading] = useState(true);
const [jwt, setJwt] = useState<string | null>(null);
const [user, setUser] = useState<UserProfile | null>(null);
```

### الشرح:

#### 1. **`loggedIn`**
```tsx
const [loggedIn, setLoggedIn] = useState(false);
```
- **القيمة**: `true` أو `false`
- **الاستخدام**: هل المستخدم مسجل دخوله؟

#### 2. **`showLoading`**
```tsx
const [showLoading, setShowLoading] = useState(true);
```
- **القيمة**: `true` أو `false`
- **الاستخدام**: عرض شاشة التحميل أثناء فحص Token المحفوظ

#### 3. **`jwt`**
```tsx
const [jwt, setJwt] = useState<string | null>(null);
```
- **القيمة**: Token أو `null`
- **الاستخدام**: حفظ JWT Token للطلبات المصادق عليها

#### 4. **`user`**
```tsx
const [user, setUser] = useState<UserProfile | null>(null);
```
- **القيمة**: كائن معلومات المستخدم أو `null`
- **مثال**:
```tsx
{
  id: 123,
  name: "أحمد",
  email: "ahmed@example.com",
  ImageUrl: "/images/profile.jpg"
}
```

---

## 🖼️ القسم الثاني: بناء رابط الصورة

```tsx
const getProfileImageUrl = useCallback((imageUrl?: string | null): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl}`;
}, []);
```

### الشرح:

#### **`useCallback`**
- يحفظ الدالة في الذاكرة
- لا ينشئها من جديد في كل Render

#### **المنطق**:

```tsx
// 1. إذا لا توجد صورة
if (!imageUrl) return '';

// 2. إذا كانت URL كامل
if (imageUrl.startsWith('http')) 
  return imageUrl;  // 'https://cloudinary.com/image.jpg'

// 3. إذا كان مسار نسبي
return `${API_URL}${imageUrl}`;  
// 'http://localhost:3000' + '/images/photo.jpg'
// = 'http://localhost:3000/images/photo.jpg'
```

**مثال**:
```tsx
getProfileImageUrl('/images/user123.jpg')
// → 'http://localhost:3000/images/user123.jpg'

getProfileImageUrl('https://cdn.com/photo.jpg')
// → 'https://cdn.com/photo.jpg'

getProfileImageUrl(null)
// → ''
```

---

## 📡 القسم الثالث: جلب معلومات المستخدم

```tsx
const fetchProfile = useCallback(async () => {
    try {
        const res = await api.get(PROFILE_URL);
        setUser(res.data.user);
    } catch (error) {
        console.error('Failed to fetch profile:', error);
    }
}, []);
```

### الشرح:

**متى تُستخدم؟**
- بعد تسجيل الدخول
- بعد تحديث الملف الشخصي
- لتحديث البيانات

**مثال**:
```tsx
// في صفحة Profile
const { fetchProfile } = useContext(AuthContext);

const handleUpdateProfile = async () => {
  await api.put('/users/profile', updatedData);
  await fetchProfile();  // تحديث البيانات
};
```

---

## 🔍 القسم الرابع: التحقق من المصادقة

```tsx
useEffect(() => {
    getAuthenticated();
}, []);
```

**الشرح**:
- يُشغل `getAuthenticated()` مرة واحدة عند بدء التطبيق
- `[]` = بدون dependencies → يشتغل مرة واحدة فقط

---

### دالة `getAuthenticated`:

```tsx
const getAuthenticated = async () => {
    try {
        // 1. قراءة Token المحفوظ
        const { value } = await Preferences.get({ key: 'accessToken' });
        
        if (value) {
            // 2. Token موجود
            setLoggedIn(true);
            setJwt(value);
            
            try {
                // 3. جلب معلومات المستخدم
                const res = await api.get(PROFILE_URL);
                setUser(res.data.user);
            } catch {
                // 4. Token غير صالح - تنظيف
                await Preferences.remove({ key: 'accessToken' });
                setLoggedIn(false);
                setJwt(null);
                setUser(null);
            }
        } else {
            // 5. Token غير موجود
            setLoggedIn(false);
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        setLoggedIn(false);
    } finally {
        // 6. إخفاء شاشة التحميل
        setShowLoading(false);
    }
};
```

### الشرح خطوة بخطوة:

#### 1️⃣ **قراءة Token**
```tsx
const { value } = await Preferences.get({ key: 'accessToken' });
```
- **`Preferences`** = مكتبة Capacitor لحفظ البيانات محلياً
- مثل `localStorage` لكن تعمل على الموبايل

#### 2️⃣ **Token موجود**
```tsx
if (value) {
    setLoggedIn(true);
    setJwt(value);
```
- أول شيء: نفترض أنه مسجل دخوله

#### 3️⃣ **التحقق من Token**
```tsx
const res = await api.get(PROFILE_URL);
setUser(res.data.user);
```
- نجرب جلب البيانات من الخادم
- إذا نجح → Token صالح ✅

#### 4️⃣ **Token غير صالح**
```tsx
catch {
    await Preferences.remove({ key: 'accessToken' });
    setLoggedIn(false);
    setJwt(null);
    setUser(null);
}
```
- إذا فشل → Token منتهي أو مزور ❌
- نحذفه وننظف الحالة

#### 5️⃣ **Token غير موجود**
```tsx
else {
    setLoggedIn(false);
}
```
- المستخدم لم يسجل دخوله من قبل

#### 6️⃣ **إخفاء التحميل**
```tsx
finally {
    setShowLoading(false);
}
```
- في جميع الأحوال، نخفي شاشة التحميل

---

## 🚪 القسم الخامس: تسجيل الخروج

```tsx
const logout = async () => {
    try {
        await Preferences.remove({ key: 'accessToken' });
        setLoggedIn(false);
        setJwt(null);
        setUser(null);
    } catch (error) {
        console.error('Logout failed:', error);
    }
};
```

### الشرح:

**ما يفعله**:
1. حذف Token من التخزين المحلي
2. تعيين `loggedIn` إلى `false`
3. مسح JWT
4. مسح معلومات المستخدم

**مثال استخدام**:
```tsx
const { logout } = useContext(AuthContext);

const handleLogout = async () => {
  await logout();
  history.push('/account/login');
};
```

---

## ⏳ القسم السادس: شاشة التحميل

```tsx
if (showLoading) {
    return <IonLoading isOpen={showLoading} message="جار التحميل..." />;
}
```

### الشرح:

**متى تظهر؟**
- عند بدء التطبيق لأول مرة
- أثناء فحص Token المحفوظ

**لماذا؟**
- لتجنب وميض الشاشة (Flash)
- تجربة مستخدم أفضل

---

## 📤 القسم السابع: توفير Context

```tsx
return (
    <AuthContext.Provider value={{
        loggedIn, setLoggedIn,
        jwt, setJwt,
        user, setUser,
        logout, fetchProfile,
        getProfileImageUrl,
    }}>
        {children}
    </AuthContext.Provider>
);
```

### الشرح:

**ما يوفره للمكونات الأخرى**:

| الخاصية | النوع | الوصف |
|---------|-------|-------|
| `loggedIn` | boolean | هل مسجل دخوله؟ |
| `setLoggedIn` | function | تغيير حالة تسجيل الدخول |
| `jwt` | string \| null | Token |
| `setJwt` | function | تحديث Token |
| `user` | UserProfile \| null | معلومات المستخدم |
| `setUser` | function | تحديث معلومات المستخدم |
| `logout` | function | تسجيل الخروج |
| `fetchProfile` | function | جلب معلومات المستخدم |
| `getProfileImageUrl` | function | بناء رابط الصورة |

---

## 💡 مثال استخدام في مكون

```tsx
import { useContext } from 'react';
import { AuthContext } from '../context/auth.types';

const ProfilePage = () => {
  const { loggedIn, user, logout, getProfileImageUrl } = useContext(AuthContext);

  if (!loggedIn) {
    return <p>الرجاء تسجيل الدخول</p>;
  }

  return (
    <div>
      <img src={getProfileImageUrl(user?.ImageUrl)} alt="Profile" />
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      <button onClick={logout}>تسجيل الخروج</button>
    </div>
  );
};
```

---

## 🔄 تدفق تسجيل الدخول الكامل

```
1. المستخدم يكتب email و password
   ↓
2. POST /api/auth/login
   ↓
3. الخادم يرجع { token: "..." }
   ↓
4. حفظ Token في Preferences
   Preferences.set({ key: 'accessToken', value: token })
   ↓
5. تحديث Context
   setLoggedIn(true)
   setJwt(token)
   ↓
6. جلب معلومات المستخدم
   fetchProfile()
   ↓
7. ✅ تسجيل دخول ناجح
```

---

## 🎯 النقاط المهمة

✅ **AuthContext** يشارك حالة المصادقة مع كل التطبيق  
✅ **Preferences** يحفظ Token محلياً (يبقى بعد إغلاق التطبيق)  
✅ **`getAuthenticated()`** يفحص Token عند بدء التطبيق  
✅ **`fetchProfile()`** يجلب أحدث معلومات المستخدم  
✅ **`logout()`** ينظف كل شيء ويعيد للحالة الأولية  

---

**📖 الخطوة التالية**: [هوك معرض الصور](./04-photo-gallery-hook.md)
