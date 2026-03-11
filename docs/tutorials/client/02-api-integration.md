# شرح طبقة التكامل مع الخادم (API Integration)

## 📋 نظرة عامة

طبقة التكامل مع الخادم تتكون من **ثلاثة ملفات** تعمل معاً لضمان تواصل سليم بين التطبيق والسيرفر:

| الملف | الوظيفة |
|-------|---------|
| `config/urls.ts` | ثوابت الروابط التي تُطابق مسارات السيرفر |
| `config/axios.ts` | إعداد مكتبة Axios مع إرفاق Token تلقائياً |
| `types/post.types.ts` | واجهات TypeScript تُطابق شكل استجابة السيرفر |

---

## 🤔 لماذا نحتاج طبقة تكامل منظمة؟

### ❌ بدون تنظيم:

```typescript
const res1 = await axios.get('http://localhost:3000/posts');
// في كل صفحة نكتب الرابط يدوياً... 😫
const res2 = await axios.get('http://localhost:3000/posts/5');
const res3 = await axios.post('http://localhost:3000/posts/create', data);

// مشاكل:
// 1. إذا تغيّر عنوان السيرفر → نُغيّر في 50 مكان!
// 2. إذا تغيّر مسار → نبحث في كل الملفات!
// 3. Token يجب إضافته يدوياً في كل طلب!
```

### ✅ بتنظيم:

```typescript
import api from '../config/axios';        // Axios مُجهّز مع Token
// نستورد من مكان واحد
import { GET_ALL_POSTS } from '../config/urls'; // الرابط كثابت

const res = await api.get(GET_ALL_POSTS);
// ✅ الرابط في مكان واحد
// ✅ Token يُضاف تلقائياً
// ✅ إذا تغيّر شيء → نُغيّر في مكان واحد فقط!
```

---

## 📚 الملف الأول: ثوابت الروابط (`config/urls.ts`)

```typescript
// API URLs matching server routes
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Account routes (/account)
export const REGISTER_URL = 'account/register';
export const LOGIN_URL = 'account/login';
export const PROFILE_URL = 'account/profile';
export const PROFILE_UPDATE_INFO_URL = 'account/profile/info';
export const PROFILE_UPDATE_IMAGE_URL = 'account/profile/image';
export const PROFILE_RESET_IMAGE_URL = 'account/profile/image/reset';
export const PROFILE_DELETE_URL = 'account/profile';

// Post routes (/posts)
export const GET_ALL_POSTS = 'posts';
export const GET_MY_POSTS = 'posts/me';
export const CREATE_POST = 'posts/create';
export const GET_POST_BY_ID = (id: string | number) => `posts/${id}`;
export const UPDATE_POST = (id: string | number) => `posts/${id}`;
export const DELETE_POST = (id: string | number) => `posts/${id}`;

// Comment routes (/comments)
export const GET_MY_COMMENTS = 'comments/me';
export const ADD_COMMENT = (postId: string | number) => `comments/${postId}`;
export const UPDATE_COMMENT = (id: string | number) => `comments/${id}`;
export const DELETE_COMMENT = (id: string | number) => `comments/${id}`;

// Like routes (/likes)
export const TOGGLE_LIKE = (postId: string | number) => `likes/${postId}`;
export const GET_MY_LIKES = 'likes/me';
export const GET_POST_LIKES = (postId: string | number) => `likes/${postId}`;
```

---

### 🔍 شرح تفصيلي

#### 1️⃣ **عنوان API الأساسي**

```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

| الجزء | الشرح |
|-------|-------|
| `import.meta.env` | متغيرات البيئة في Vite |
| `VITE_API_URL` | متغير بيئة مخصص (يُعرّف في `.env`) |
| `\|\| 'http://localhost:3000'` | القيمة الافتراضية للتطوير المحلي |

**مثال** ملف `.env`:
```text
VITE_API_URL=https://api.myapp.com
```

#### 2️⃣ **مسارات ثابتة**

```typescript
export const GET_ALL_POSTS = 'posts';
export const GET_MY_POSTS = 'posts/me';
```

**ملاحظة مهمة**: المسارات **لا تبدأ بـ `/`** لأن Axios يضيفها تلقائياً مع `baseURL`.

```typescript
// Axios يبني الرابط الكامل تلقائياً:
// baseURL + '/' + path
// 'http://localhost:3000' + '/' + 'posts'
// = 'http://localhost:3000/posts' ✅
```

#### 3️⃣ **مسارات ديناميكية (دوال)**

```typescript
export const GET_POST_BY_ID = (id: string | number) => `posts/${id}`;
```

**لماذا دالة وليست ثابتاً؟**
لأن المسار يحتاج معرّف يتغيّر:

```typescript
GET_POST_BY_ID(5)    // → 'posts/5'
// استخدام:
GET_POST_BY_ID('42') // → 'posts/42'
DELETE_POST(10)      // → 'posts/10'
ADD_COMMENT(3)       // → 'comments/3'
```

**لماذا `string | number`؟**
لأن المعرّف قد يأتي من:
- **مصفوفة TypeScript**: `number`
- **معامل URL**: `string` (مثل `useParams()`)

---

## 📚 الملف الثاني: إعداد Axios (`config/axios.ts`)

```typescript
import axios from "axios";
import { Preferences } from "@capacitor/preferences";
import { API_URL } from "./urls";

const api = axios.create({
  baseURL: API_URL,
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});

// إضافة Bearer token تلقائيًا لجميع الطلبات إذا كان موجودًا
api.interceptors.request.use(
  async (config) => {
    try {
      const { value } = await Preferences.get({ key: "accessToken" });
      if (value) {
        // Token مخزن مع Bearer prefix بالفعل
        config.headers.Authorization = value;
      }
    } catch (error) {
      console.error("Failed to get token from storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
```

---

### 🔍 شرح تفصيلي

#### 1️⃣ **إنشاء مثيل Axios مخصص**

```typescript
const api = axios.create({
  baseURL: API_URL,
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});
```

| الخاصية | القيمة | الشرح |
|---------|--------|-------|
| `baseURL` | عنوان السيرفر | يُضاف تلقائياً قبل كل مسار |
| `responseType` | `"json"` | Axios يحلل الاستجابة كـ JSON |
| `Content-Type` | `"application/json"` | نُخبر السيرفر أن البيانات JSON |

**لماذا `axios.create()` وليس `axios` مباشرة؟**

```typescript
axios.defaults.baseURL = 'http://localhost:3000';
// ❌ الاستخدام المباشر — يؤثر على كل الطلبات في التطبيق

// ✅ مثيل مخصص — إعدادات منفصلة لكل API
const api = axios.create({ baseURL: 'http://localhost:3000' });
const analytics = axios.create({ baseURL: 'http://analytics.com' });
```

#### 2️⃣ **اعتراض الطلبات (Request Interceptor)**

```typescript
api.interceptors.request.use(
  async (config) => {
    const { value } = await Preferences.get({ key: "accessToken" });
    if (value) {
      config.headers.Authorization = value;
    }
    return config;
  },
);
```

**ما هو Interceptor؟**

هو وسيط يعمل **قبل** إرسال كل طلب:

```text
المكوّن يُرسل طلب → [Interceptor يضيف Token]  // الطلب يُرسل للسيرفر
```

**التدفق**:
```text
2. Interceptor: هل يوجد Token مخزّن؟
   ↓
1. المكون: api.get('posts')
   ↓
3. نعم → config.headers.Authorization = 'Bearer eyJ...'
   لا  // لا شيء (الطلب يُرسل بدون Token)
   ↓
4. الطلب يُرسل للسيرفر
```

**لماذا `Preferences` وليس `localStorage`؟**
- `localStorage` يعمل فقط في المتصفح
- `Preferences` من Capacitor يعمل على **الموبايل والويب** معاً

---

## 📚 الملف الثالث: أنواع TypeScript (`types/post.types.ts`)

```typescript
import type { RawDraftContentState } from 'draft-js';
import type { UserBasic } from './user.types';

export type PostUser = UserBasic;

export interface PostImage {
    id: number;
    imageUrl: string;
}

export interface PostCommentRef {
    id: number;
}

export interface PostComment {
    id: number;
    text: string;
    createdAt: string;
    UserId: number;
    PostId: number;
    User: PostUser;
}

export type PostSteps = string[] | RawDraftContentState;

export interface Post {
    id: number;
    title: string;
    content: string;
    steps: PostSteps | null;
    country: string | null;
    region: string | null;
    createdAt: string;
    updatedAt: string;
    UserId: number;
    User: PostUser;
    images: PostImage[];       // ← تطابق as: 'images' في السيرفر
    Comments: PostCommentRef[];
    likesCount: number;
    isLiked: boolean;
}

export interface PostDetail extends Omit<Post, 'Comments'> {
    Comments: PostComment[];   // تعليقات كاملة مع بيانات المستخدم
}

export interface Pagination {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    limit: number;
}

export interface PostsResponse {
    posts: Post[];
    pagination: Pagination;
}
```

---

### 🔍 شرح الأنواع

#### 1️⃣ **مطابقة أسماء الحقول مع السيرفر**

الاسم في العميل **يجب** أن يطابق اسم الحقل في استجابة السيرفر:

```typescript
Post.hasMany(Post_Image, { as: 'images' });
// السيرفر: posts.model.js
//                          ↑ الاسم المستعار

// العميل: post.types.ts
export interface Post {
    images: PostImage[];   // ← يجب أن يطابق 'images'
}
```

> ⚠️ **تنبيه**: إذا كان السيرفر يستخدم `as: 'images'` وأنت كتبت `Post_Images` → البيانات لن تظهر!

#### 2️⃣ **التمييز بين Post و PostDetail**

```typescript
Comments: PostCommentRef[]  // [{ id: 1 }, { id: 2 }]
// التعليقات تكون مراجع فقط (عدد)
// ─── قائمة المنشورات (getAllPosts) ───

// ─── منشور واحد (getPostById) ───
// التعليقات تكون كاملة مع بيانات المستخدم
Comments: PostComment[]     // [{ id: 1, text: '...', User: {...} }]
```

```typescript
// Omit يأخذ كل حقول Post ما عدا Comments
export interface PostDetail extends Omit<Post, 'Comments'> {
    Comments: PostComment[];  // ← نعيد تعريفه بنوع مختلف
}
```

#### 3️⃣ **PostSteps: دعم تنسيقين**

```typescript
export type PostSteps = string[] | RawDraftContentState;
```

**لماذا نوعين؟**

| التنسيق | المثال | الاستخدام |
|---------|--------|----------|
| `string[]` | `['اغسل الأرز', 'اطبخ اللحم']` | التنسيق الأصلي البسيط |
| `RawDraftContentState` | `{ blocks: [...], entityMap: {} }` | محرر النصوص الغني (Draft.js) |

```typescript
if (Array.isArray(steps)) {
// التحقق من النوع:
    // النوع القديم: مصفوفة نصوص
    steps.forEach(step => console.log(step));
} else {
    // النوع الجديد: Draft.js
    steps.blocks.forEach(block => console.log(block.text));
}
```

---

## 🔄 تدفق طلب API كامل

```text
   const { data } = await api.get(GET_ALL_POSTS);
1. المكون يستدعي:
   ↓
2. urls.ts يُرجع المسار:
   GET_ALL_POSTS = 'posts'
   ↓
3. axios.ts يبني طلب كامل:
   GET http://localhost:3000/posts
   Headers: {
     Content-Type: application/json,
     Authorization: Bearer eyJ...  // من Interceptor
   }
   ↓
4. السيرفر يرد:
   { posts: [...], pagination: {...} }
   ↓
5. TypeScript يتحقق:
   const response: PostsResponse = data;  ← ✅ الأنواع تتطابق
```

---

## 🎯 النقاط المهمة

✅ **الروابط في مكان واحد** — تغيير المسار يتم في ملف واحد فقط  
✅ **Token يُضاف تلقائياً** — لا حاجة لإضافته في كل طلب  
✅ **الأنواع تطابق السيرفر** — TypeScript يكشف الأخطاء مبكراً  
✅ **المسارات بدون `/` بادئة** — Axios يضيفها مع baseURL  
✅ **دوال للمسارات الديناميكية** — `GET_POST_BY_ID(5)` بدلاً من `'posts/' + id`  

---

**📖 الخطوة السابقة**: [هيكل التطبيق الرئيسي](./01-app-structure.md)  
**📖 الخطوة التالية**: [سياق المصادقة](./03-auth-context.md)
