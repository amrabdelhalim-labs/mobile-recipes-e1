# شرح هندسة المكونات وتسمية الملفات (Component Architecture)

## 📋 نظرة عامة

يتبع التطبيق معايير **أفضل الممارسات** في تسمية مكونات React، حيث تُسمى المكونات بأسماء **وصفية** تدل على وظيفتها بدلاً من الفعل الذي تقوم به.

---

## 🤔 لماذا تهم تسمية الملفات؟

### ❌ التسمية السيئة (بادئة فعل):

```text
components/
  Comment/
    GetComment.tsx  // فعل! (اجلب) — يبدو كدالة وليس مكوّن
    CreateComment.tsx  // فعل! (أنشئ) — غير واضح الغرض
  Location/
    GetLocation.tsx  // فعل! (اجلب) — أي موقع؟

pages/
    GetPost.tsx  // فعل! — هل هي صفحة أم دالة؟
```

**المشاكل**:
- 😫 الأسماء تبدو كـ **دوال** وليست **مكونات**
- 😫 لا تصف **ماذا يعرض** المكوّن
- 😫 تخلط بين المنطق (جلب) والعرض (واجهة)

### ✅ التسمية الصحيحة (أسماء وصفية):

```text
components/
  Comment/
    CommentList.tsx  // واضح: قائمة التعليقات
    CommentForm.tsx  // واضح: نموذج إضافة تعليق
  Location/
    LocationPicker.tsx  // واضح: أداة اختيار الموقع

pages/
    PostDetail.tsx  // واضح: صفحة تفاصيل المنشور
```

---

## 📚 قواعد التسمية

### القاعدة 1: **PascalCase دائماً**

```text
✅ CommentList.tsx
✅ PostDetail.tsx
✅ LocationPicker.tsx

❌ commentList.tsx
❌ comment-list.tsx
❌ comment_list.tsx
```

### القاعدة 2: **أسماء وصفية (Nouns) وليست أفعال**

```text
✅ CommentList    — "قائمة التعليقات" (ماذا يعرض)
❌ GetComment     — "اجلب التعليق" (ماذا يفعل)

✅ CommentForm    — "نموذج التعليق" (ماذا يعرض)
❌ CreateComment  — "أنشئ تعليق" (ماذا يفعل)

✅ LocationPicker — "أداة اختيار الموقع" (ماذا يعرض)
❌ GetLocation    — "اجلب الموقع" (ماذا يفعل)

✅ PostDetail     — "تفاصيل المنشور" (ماذا يعرض)
❌ GetPost        — "اجلب المنشور" (ماذا يفعل)
```

### القاعدة 3: **اللاحقات الشائعة**

| اللاحقة | الاستخدام | مثال |
|---------|----------|------|
| `List` | عرض قائمة عناصر | `CommentList`, `PostList` |
| `Form` | نموذج إدخال | `CommentForm`, `LoginForm` |
| `Card` | بطاقة عنصر واحد | `PostCard`, `UserCard` |
| `Detail` | صفحة تفاصيل | `PostDetail`, `UserDetail` |
| `Picker` | أداة اختيار | `LocationPicker`, `DatePicker` |
| `Modal` | نافذة منبثقة | `ConfirmModal`, `PhotoModal` |
| `Page` | صفحة كاملة | `PostDetailPage`, `LoginPage` |

### القاعدة 4: **المكوّن يطابق اسم الملف**

```typescript
const CommentList: React.FC<CommentListProps> = ({ ... }) => {
// الملف: CommentList.tsx
//    ↑ نفس اسم الملف
    return ( ... );
};

export default CommentList;
```

### القاعدة 5: **الواجهات تتبع نمط `[ComponentName]Props`**

```typescript
interface CommentListProps { ... }
// ✅ صحيح
interface CommentFormProps { ... }
interface LocationPickerProps { ... }

// ❌ خطأ
interface GetCommentProps { ... }
interface Props { ... }
interface ICommentProps { ... }
```

---

## 🔄 التغييرات التي تمت

### المكوّن 1: `GetComment` → `CommentList`

**الملف**: `components/Comment/CommentList.tsx`

```typescript
/**
 * مكوّن عرض التعليقات (CommentList)
 * ─────────────────────────────────────
 * يعرض قائمة التعليقات الخاصة بمنشور معيّن.
 *
 * يستقبل:
 * ─ comments:     مصفوفة التعليقات الكاملة
 * ─ currentUserId: معرّف المستخدم الحالي (لإظهار زر الحذف لتعليقاته فقط)
 * ─ onDelete:     callback يُنفَّذ عند حذف تعليق
 * ─ isLoading:    حالة التحميل (يعرض Skeleton بدل القائمة)
 */
interface CommentListProps {
    comments: PostComment[];
    currentUserId: number | null;
    onDelete: (commentId: number) => void;
    isLoading?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({ ... }) => {
    // ...
};
```

**لماذا `CommentList`؟**
- يعرض **قائمة** تعليقات ← `List`
- لا "يجلب" شيئاً — البيانات تأتيه عبر Props

---

### المكوّن 2: `CreateComment` → `CommentForm`

**الملف**: `components/Comment/CommentForm.tsx`

```typescript
/**
 * مكوّن إضافة تعليق (CommentForm)
 * ─────────────────────────────────
 * حقل إدخال نص + زر إرسال لإضافة تعليق جديد على منشور.
 */
interface CommentFormProps {
    postId: number;
    onAdded: (comment: PostComment) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ ... }) => {
    // ...
};
```

**لماذا `CommentForm`؟**
- يحتوي على **نموذج** إدخال ← `Form`
- تسمية `Form` أكثر شمولاً من `Create` (قد يُستخدم للتعديل أيضاً)

---

### المكوّن 3: `GetLocation` → `LocationPicker`

**الملف**: `components/Location/LocationPicker.tsx`

```typescript
/**
 * مكون الموقع الجغرافي (LocationPicker)
 * ────────────────────────────────────
 * يستخدم Capacitor Geolocation API لجلب إحداثيات المستخدم الحالية,
 * ثم يستعلم من OpenStreetMap Nominatim API لتحويل الإحداثيات لأسماء.
 */
interface LocationPickerProps {
    onLocationChange: (location: LocationData) => void;
}

const LocationPicker: FC<LocationPickerProps> = ({ ... }) => {
    // ...
};
```

**لماذا `LocationPicker`؟**
- أداة **اختيار** الموقع ← `Picker`
- مثل `DatePicker`, `ColorPicker` — نمط معروف في React

---

### الصفحة 4: `GetPost` → `PostDetailPage`

**الملف**: `pages/PostDetail.tsx`

```typescript
const GetPost: React.FC = () => { ... };
// ─── قبل ───

// ─── بعد ───
const PostDetailPage: React.FC = () => { ... };
```

**لماذا `PostDetailPage`؟**
- صفحة **تفاصيل** المنشور ← `Detail`
- اللاحقة `Page` تُميّزها عن المكوّنات العادية

---

## 📂 هيكل المجلدات النموذجي

```text
src/
├── components/  // مكونات قابلة لإعادة الاستخدام
│   ├── Comment/
│   │   ├── Comment.css
│   │   ├── CommentList.tsx  // عرض قائمة التعليقات
│   │   └── CommentForm.tsx  // نموذج إضافة تعليق
│   ├── Location/
│   │   └── LocationPicker.tsx  // أداة اختيار الموقع
│   ├── PostCard/
│   │   ├── PostCard.css
│   │   └── PostCard.tsx  // بطاقة منشور واحد
│   └── Menu/
│       └── Menu.tsx  // القائمة الجانبية
│
├── pages/  // صفحات كاملة (مرتبطة بـ Routes)
│   ├── AllPosts.tsx  // صفحة جميع المنشورات
│   ├── MyPosts.tsx  // صفحة منشوراتي
│   ├── PostDetail.tsx  // صفحة تفاصيل منشور
│   ├── CreatePost.tsx   ← ⚡ استثناء: Create هنا مقبول لأنها صفحة إنشاء
│   └── UpdatePost.tsx   ← ⚡ استثناء: Update هنا مقبول لأنها صفحة تعديل
│
├── hooks/              ← Custom Hooks
│   └── usePhotoGallery.ts
│
├── config/  // إعدادات
│   ├── axios.ts
│   └── urls.ts
│
├── types/  // واجهات TypeScript
│   ├── post.types.ts
│   └── user.types.ts
│
└── utils/  // دوال مساعدة
    └── postsEvents.ts
```

---

## 💡 تحديث الاستيرادات

عند إعادة تسمية ملف، يجب تحديث **جميع** الملفات التي تستورده:

```typescript
import GetComment from '../Comment/GetComment';
// ─── قبل ───
import CreateComment from '../Comment/CreateComment';
import GetLocation from '../Location/GetLocation';

// ─── بعد ───
import CommentList from '../Comment/CommentList';
import CommentForm from '../Comment/CommentForm';
import LocationPicker from '../Location/LocationPicker';
```

```typescript
<GetComment comments={post.Comments} ... />
// ─── قبل (في JSX) ───
<CreateComment postId={post.id} ... />
<GetLocation onLocationChange={handleLocation} />

// ─── بعد (في JSX) ───
<CommentList comments={post.Comments} ... />
<CommentForm postId={post.id} ... />
<LocationPicker onLocationChange={handleLocation} />
```

> 💡 **نصيحة**: استخدم خاصية **Rename Symbol** في VS Code (اضغط `F2` على اسم المكوّن) لتحديث جميع الاستيرادات تلقائياً.

---

## 🎯 النقاط المهمة

✅ **PascalCase** لأسماء الملفات والمكونات دائماً  
✅ **أسماء وصفية** (ماذا يعرض) وليست أفعال (ماذا يفعل)  
✅ **لاحقات قياسية**: `List`, `Form`, `Card`, `Detail`, `Picker`, `Modal`  
✅ **اسم المكوّن = اسم الملف** للوضوح والاتساق  
✅ **واجهات Props** تتبع `[Name]Props` convention  
✅ **تحديث الاستيرادات** في جميع الملفات المرتبطة عند إعادة التسمية  

---

**📖 الخطوة السابقة**: [هوك معرض الصور](./04-photo-gallery-hook.md)  
**📖 الخطوة التالية**: [اختبارات العميل](./06-client-testing.md)
