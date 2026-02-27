# الدرس التاسع: مكوّنات التطبيق 🧩

> **هدف الدرس:** تفهم كيف تعمل مكوّنات وصفاتي القابلة لإعادة الاستخدام — من بطاقة الوصفة إلى محرر النصوص الغني، مروراً بمكوّنات التعليقات والإعجاب والموقع الجغرافي.

---

## 1. لماذا نُفصل المكوّنات؟

```
❌ بدون مكوّنات:
PostDetail.tsx  ← 800 سطر (كود التعليقات + الإعجاب + بطاقة المعلومات + ...)
MyPosts.tsx     ← 600 سطر (كود البطاقة مكرر من PostDetail)

✅ مع مكوّنات:
PostDetail.tsx + MyPosts.tsx يستخدمان نفس PostCard + CommentList + Like
→ التغيير في المكوّن يطبق في كل الأماكن تلقائياً
```

---

## 2. مكوّن بطاقة الوصفة — `components/PostCard/PostCard.tsx`

```tsx
interface PostCardProps {
  post: Post;
  showAuthor?: boolean;  // عرض بيانات الكاتب — default: true
  routerLink?: string;   // رابط الانتقال عند الضغط
  onOptions?: (post: Post) => void;  // callback زر ⋮ (يظهر فقط إن مُرِّر)
}
```

### 2.1 الصورة الغلاف

```tsx
const coverImage = post.images?.[0]?.imageUrl
  ? getProfileImageUrl(post.images[0].imageUrl)
  : 'https://ionicframework.com/docs/img/demos/card-media.png';
```
- `post.images?.[0]` ← `?.` هنا لأن `images` قد تكون `undefined`
- `getProfileImageUrl(...)` ← من AuthContext — يُحوّل المسار النسبي لـ URL كامل
- الصورة الاحتياطية: صورة افتراضية من Ionic إذا لم توجد صور

### 2.2 زر الخيارات (⋮)

```tsx
{onOptions && (
  <IonButton
    fill="clear"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onOptions(post);
    }}
  >
    <IonIcon icon={ellipsisVertical} />
  </IonButton>
)}
```
- `e.stopPropagation()` ← يمنع انتشار الحدث للبطاقة (لئلا تنتقل للصفحة عند الضغط على ⋮)
- `{onOptions && (...)}` ← الزر يظهر **فقط** إذا مُرِّر `onOptions`
  - `AllPosts.tsx` لا تمرره → لا يوجد زر خيارات
  - `MyPosts.tsx` تمرره → يظهر زر الخيارات

---

## 3. مكوّن الإعجاب — `components/Like/Like.tsx`

### 3.1 Optimistic Update

```tsx
const toggleLike = useCallback(async () => {
  if (isLoading) return;
  setIsLoading(true);

  // حفظ القيم القديمة للـ Rollback
  const prevLiked = isLiked;
  const prevCount = likesCount;

  // تحديث فوري (قبل انتظار السيرفر)
  const newLiked = !isLiked;
  const newCount = newLiked ? likesCount + 1 : likesCount - 1;
  setIsLiked(newLiked);
  setLikesCount(newCount);

  try {
    const { data } = await api.post(TOGGLE_LIKE(postId));
    // مزامنة مع استجابة السيرفر (قد تختلف)
    setIsLiked(data.isLiked);
    setLikesCount(data.likesCount);
    onToggle?.(data.isLiked, data.likesCount);
    emitPostsChanged();
  } catch {
    // Rollback إذا فشل الطلب
    setIsLiked(prevLiked);
    setLikesCount(prevCount);
  } finally {
    setIsLoading(false);
  }
}, [isLoading, isLiked, likesCount, postId, onToggle]);
```

**Optimistic Update** = "تحديث متفائل":
```
المستخدم يضغط ← عكس الحالة فوراً (بدون انتظار)
              ← الطلب يذهب للسيرفر في الخلفية
              ← نجح: مزامنة مع بيانات السيرفر
              ← فشل: إرجاع الحالة القديمة
```
يجعل التطبيق يبدو **سريعاً** حتى مع اتصال بطيء.

- `onToggle?.()` ← `?.` = استدعاء اختياري — لا يرمي خطأ إذا `onToggle` غير موجود

---

## 4. مكوّنا التعليقات — `CommentForm.tsx` و `CommentList.tsx`

### 4.1 `CommentForm` — إضافة تعليق

```tsx
const handleSubmit = useCallback(async () => {
  const trimmed = text.trim();
  if (!trimmed) {
    presentToast({ message: 'اكتب تعليقاً أولاً', ... });
    return;
  }

  const { data } = await api.post(ADD_COMMENT(postId), { text: trimmed });
  setText('');
  onAdded(data.comment);  // إضافة فورية للقائمة في PostDetail
}, [text, postId, onAdded, presentToast]);
```
- `onAdded(data.comment)` ← يُمرَّر من `PostDetail` — يُضيف التعليق للقائمة المحلية دون إعادة جلب

### 4.2 `CommentList` — عرض التعليقات

```tsx
interface CommentListProps {
  comments: PostComment[];
  currentUserId: number | null;
  onDelete: (commentId: number) => void;
  isLoading?: boolean;
}
```

```tsx
{isLoading
  ? [1, 2, 3].map((i) => <CommentSkeleton key={i} />)  // عرض Skeleton أثناء التحميل
  : comments.map((comment) => (
      <IonItem key={comment.id}>
        {/* زر الحذف فقط لتعليقات المستخدم الحالي */}
        {comment.userId === currentUserId && (
          <IonButton onClick={() => confirmDelete(comment.id)}>
            <IonIcon icon={trashOutline} />
          </IonButton>
        )}
      </IonItem>
    ))
}
```
- `CommentSkeleton` ← مكوّن داخلي يعرض مستطيلات رمادية متحركة بدل التعليقات (Loading State)
- `comment.userId === currentUserId` ← التحقق المحلي: هل هذا تعليقك؟

---

## 5. مكوّن الملف الشخصي — `components/UserProfile/`

### 5.1 `UserAvatar.tsx` — صورة المستخدم

```tsx
useEffect(() => {
  if (!blobUrl) return;

  const uploadPhoto = async () => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('profileImage', blob, 'profile.jpg');

    await api.put(PROFILE_UPDATE_IMAGE_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await fetchProfile();
  };

  uploadPhoto();
}, [blobUrl]);
```
- عند اختيار صورة جديدة → `usePhotoGallery` يُحدِّث `blobUrl`
- هذا الـ `useEffect` يراقب `blobUrl` → يرفع الصورة تلقائياً عند تغييرها

```tsx
const profileImageUrl = useMemo(
  () => (user?.ImageUrl ? getProfileImageUrl(user.ImageUrl) : null),
  [user?.ImageUrl]
);
```
`useMemo` ← يتجنب إعادة بناء URL في كل رسم.

### 5.2 `EditableField.tsx` — حقل قابل للتعديل

```tsx
interface EditableFieldProps {
  label: string;
  value: string;
  type?: 'text' | 'password';
  readOnly?: boolean;
  minLength?: number;
  onSave: (newValue: string) => Promise<boolean>;
}
```

```tsx
const [editing, setEditing] = useState(false);
const [editValue, setEditValue] = useState(value);
const [showConfirm, setShowConfirm] = useState(false);
```

تدفق التعديل:
```
المستخدم يضغط أيقونة التعديل ← editing = true
يكتب القيمة الجديدة ← editValue تتحدث
يضغط ✓ ← يتحقق محلياً (minLength) ← يعرض Alert تأكيد
يؤكد ← onSave(newValue) ← السيرفر يحدث
نجح ← editing = false
فشل ← يعرض رسالة خطأ
```

- `onSave` تُرجع `Promise<boolean>` → ويمكن للمكوّن معرفة هل نجح الحفظ دون معرفة تفاصيل الطلب

---

## 6. مكوّن الموقع — `components/Location/LocationPicker.tsx`

```tsx
const fetchLocation = useCallback(async () => {
  // 1. جلب إحداثيات الجهاز
  const coordinates = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15000,
  });
  const { latitude, longitude } = coordinates.coords;

  // 2. تحويل الإحداثيات لأسماء (Reverse Geocoding)
  const { data } = await axios.get(NOMINATIM_URL, {
    params: {
      lat: latitude,
      lon: longitude,
      format: 'json',
      'accept-language': 'ar',  // استجابة بالعربية
    },
  });

  const country = data.address.country ?? '';
  const region = data.address.state ?? data.address.county ?? '';

  setCountry(country);
  setRegion(region);
  onLocationChange({ country, region });
}, [onLocationChange]);
```
- `Geolocation.getCurrentPosition()` ← Capacitor API للحصول على الموقع
- `Nominatim` ← API مجاني من OpenStreetMap لتحويل إحداثيات → أسماء
- `'accept-language': 'ar'` ← الاستجابة تأتي بأسماء عربية

---

## 7. مكوّن محرر النصوص — `components/TextEditor/TextEditor.tsx`

```tsx
interface TextEditorProps {
  onChange: (rawJson: string) => void;   // يُرسل JSON string لـ CreatePost
  editorState: EditorState;              // حالة المحرر (من CreatePost)
  onEditorStateChange: (state: EditorState) => void; // تحديث الحالة
}
```

```tsx
const handleKeyCommand = useCallback(
  (command: DraftEditorCommand, currentState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(currentState, command);
    if (newState) {
      onEditorStateChange(newState);
      return 'handled';
    }
    return 'not-handled';
  },
  [onEditorStateChange]
);
```
- `RichUtils.handleKeyCommand()` ← Draft.js → يتعامل مع `Ctrl+B` (Bold) و`Ctrl+I` (Italic) تلقائياً

```tsx
const handleEditorChange = useCallback(
  (state: EditorState) => {
    onEditorStateChange(state);
    const raw = convertToRaw(state.getCurrentContent());
    onChange(JSON.stringify(raw));  // يُرسل JSON للمكوّن الأب
  },
  [onEditorStateChange, onChange]
);
```
- `convertToRaw()` ← يحوّل الحالة الداخلية لكائن JSON قابل للحفظ
- `JSON.stringify(raw)` ← يتحوّل لنص للإرسال للسيرفر

---

## 8. باقي المكوّنات

### `components/Header/Header.tsx`

```tsx
interface HeaderProps {
  title?: string;
  showMenuButton?: boolean;  // عرض زر فتح القائمة الجانبية
  defaultHref?: string;       // رابط زر الرجوع
}
```
يُوحِّد شريط العنوان في جميع الصفحات.

### `components/Menu/Menu.tsx`

القائمة الجانبية التي تظهر عند الضغط على زر الهامبرغر — روابط للصفحات الرئيسية + زر تسجيل الخروج.

### `pages/Profile.tsx`

```tsx
const handleUpdateField = async (field: 'name' | 'password', newValue: string) => {
  await api.put(PROFILE_UPDATE_INFO_URL, { [field]: newValue });
  await fetchProfile();  // تحديث البيانات في AuthContext
};
```
- `{ [field]: newValue }` ← مفتاح ديناميكي — إذا `field = 'name'` → `{ name: newValue }`

```tsx
const handleDeleteAccount = async () => {
  await api.delete(PROFILE_DELETE_URL);
  await logout();
  history.replace(`/${LOGIN_URL}`);
};
```
حذف الحساب → تسجيل الخروج تلقائياً.

### `pages/NotFound.tsx`

صفحة 404 — تظهر عند كتابة رابط غير موجود.

---

## 9. خلاصة — أنماط المكوّنات

| النمط | المكان | الهدف |
|-------|--------|-------|
| Props اختيارية `?:` | PostCard, Header | تخصيص السلوك بدون كود مكرر |
| `e.stopPropagation()` | PostCard ⋮ | منع انتشار الحدث |
| Optimistic Update | Like | استجابة فورية + Rollback |
| `isLoading ? Skeleton : Content` | CommentList | تجربة مستخدم أفضل |
| `useEffect([blobUrl])` | UserAvatar | رد فعل تلقائي على تغيير البيانات |
| `useMemo` | UserAvatar | تجنب عمليات حساب مكررة |
| `Promise<boolean>` من onSave | EditableField | اتصال آمن مع الصفحة الأم |
| Capacitor Geolocation | LocationPicker | الوصول لموقع الجهاز |
| Draft.js convertToRaw | TextEditor | تحويل المحرر الغني لـ JSON |

---

*الدرس التاسع من اثني عشر — [← الدرس الثامن: صفحات الوصفات](./08-pages-posts.md) | [الدرس العاشر: الأدوات والأنواع →](./10-utils-types.md)*
