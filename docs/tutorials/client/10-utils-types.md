# الدرس العاشر: الأدوات والأنواع 🛠️

> **هدف الدرس:** تفهم كيف يُنشئ وصفاتي نظام أحداث مخصص لتزامن الصفحات، وكيف تُعرِّف TypeScript أنواع البيانات المشتركة.

---

## 1. نظام أحداث المنشورات — `utils/postsEvents.ts`

### 1.1 المشكلة التي يحلها

```text
المستخدم يحذف وصفة في MyPosts
         ↓
كيف تعرف AllPosts أنها بحاجة للتحديث؟
```

الصفحتان لا تتواصلان مباشرة — `AllPosts` و`MyPosts` مكوّنات منفصلة لا تتشارك بيانات مباشرة. الحل: **نظام أحداث** عبر `window`.

```typescript
export const POSTS_CHANGED_EVENT = 'posts:changed';
```
ثابت باسم الحدث — استخدام ثابت بدلاً من كتابة النص مباشرة يمنع الأخطاء الإملائية.

### 1.2 إطلاق الحدث

```typescript
export const emitPostsChanged = () => {
  window.dispatchEvent(new CustomEvent(POSTS_CHANGED_EVENT));
};
```
- `window.dispatchEvent(...)` ← يُطلق الحدث على مستوى النافذة (متاح لكل المكوّنات)
- `new CustomEvent(...)` ← إنشاء حدث مخصص باسم محدد

**أين تُستدعى؟**
- `MyPosts.tsx` → عند حذف وصفة
- `Like.tsx` → عند تغيير الإعجاب
- `CreatePost.tsx` و`UpdatePost.tsx` → عند الإنشاء/التعديل
- `PostDetail.tsx` → عند حذف تعليق

### 1.3 الاستماع للحدث

```typescript
export const onPostsChanged = (handler: () => void) => {
  const listener = () => handler();
  window.addEventListener(POSTS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(POSTS_CHANGED_EVENT, listener);
};
```
- `window.addEventListener(...)` ← يُسجِّل مستمعاً للحدث
- `return () => window.removeEventListener(...)` ← تُرجع دالة تنظيف!

```typescript
useEffect(() => {
// في AllPosts.tsx:
  return onPostsChanged(() => {
    fetchPosts(1, true);
  });
}, [fetchPosts]);
```
`useEffect` يستدعي دالة التنظيف عند إزالة المكوّن ← يمنع **memory leak** (مستمعات تبقى بعد إزالة الصفحة).

### 1.4 ماذا يحدث عند إطلاق الحدث؟

```text
emitPostsChanged()
         ↓
المستخدم يحذف وصفة في MyPosts
         ↓
window يُطلق 'posts:changed'
         ↓ (لحظي — بدون انتظار)
AllPosts لها مستمع  // تستدعي fetchPosts(1, true)
         ↓
القائمة تتحدث بدون أي تواصل مباشر بين الصفحتين
```

---

## 2. أنواع TypeScript — `types/user.types.ts`

```typescript
export interface UserProfile {
/** بيانات المستخدم الكاملة (بدون كلمة المرور) */
  id: number;
  name: string;
  email: string;
  ImageUrl: string;
  createdAt: string;
  updatedAt: string;
}
```
`interface` = تعريف شكل كائن في TypeScript — مثل "قالب" يجب أن يتبعه أي كائن.

```typescript
export interface UserBasic {
/** بيانات المستخدم المختصرة (تُستخدم في المنشورات والتعليقات) */
  id: number;
  name: string;
  ImageUrl: string;
}
```
`UserBasic` ← نسخة مصغرة تُستخدم عند تضمين بيانات الكاتب في المنشور.

### 2.1 أين تُستخدم الأنواع؟

```typescript
const [user, setUser] = useState<UserProfile | null>(null);
// في AuthContext.tsx:

// في PostCard.tsx:
const { getProfileImageUrl } = useContext<AuthContextType>(AuthContext);
```
TypeScript يسطحف الأخطاء **قبل** تشغيل التطبيق:

```typescript
// ❌ TypeScript يُحذِّر:
user.nonExistentField  // خطأ: لا يوجد هذا الحقل في UserProfile

// ✅ صحيح:
user.ImageUrl  // موجود في UserProfile
```

---

## 3. ملف `types/post.types.ts` — ملاحظة

هذا الملف مشروح في [درس API Integration (02)](./02-api-integration.md). يتضمن `Post`, `PostDetail`, `PostComment`, `PostSteps`, `PostsResponse`.

---

## 4. ملف `main.tsx`

```typescript
moment.locale('ar');           // تعريب التواريخ ("منذ 5 دقائق" مثلاً)
defineCustomElements(window);  // تفعيل Capacitor Camera API في المتصفح
root.render(<App />);          // تثبيت التطبيق
```

- `moment.locale('ar')` ← يجب استدعاؤه **مرة واحدة** في البداية قبل أي استخدام لـ moment
- `defineCustomElements(window)` ← مطلوب لـ PWA (عندما يعمل التطبيق كتطبيق ويب)

---

## 5. علاقة الملفات ببعضها

```text
utils/postsEvents.ts ←─── AllPosts.tsx (يستمع لـ onPostsChanged)
                    ←─── MyPosts.tsx (يُطلق emitPostsChanged)
                    ←─── Like.tsx (يُطلق emitPostsChanged)
                    ←─── CreatePost.tsx (يُطلق emitPostsChanged)
                    ←─── UpdatePost.tsx (يُطلق emitPostsChanged)

types/user.types.ts ←─── AuthContext.tsx (يستخدم UserProfile)
types/post.types.ts ←─── AllPosts.tsx,  PostDetail.tsx, ... (يستخدم Post, PostDetail)
```

---

*الدرس العاشر من اثني عشر — [← الدرس التاسع: المكوّنات](./09-components.md) | [الدرس الحادي عشر: صفحة الملف الشخصي →](./11-profile-page.md)*
