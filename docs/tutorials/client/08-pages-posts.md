# الدرس الثامن: صفحات الوصفات 📋

> **هدف الدرس:** تفهم كيف تعرض وصفاتي الوصفات وتتيح إنشاءها وتعديلها وحذفها — مع أنماط مثل Infinite Scroll، Pull-to-Refresh، وOptimistic Update.

---

## 1. خريطة صفحات الوصفات

```
/tabs/home          ← AllPosts.tsx   — جميع الوصفات (للاستعراض)
/tabs/my-recipes    ← MyPosts.tsx    — وصفاتي (للإدارة: تعديل/حذف)
/tabs/create        ← CreatePost.tsx — إنشاء وصفة جديدة
/edit/:id           ← UpdatePost.tsx — تعديل وصفة موجودة
/post/:id           ← PostDetail.tsx — تفاصيل وصفة (من AllPosts)
/recipe/:id         ← GetPost.tsx    — تفاصيل وصفة (من MyPosts)
```

---

## 2. نقطة الانطلاق — `main.tsx` و `AppTabs.tsx`

```tsx
// main.tsx
moment.locale('ar');         ← تعريب التواريخ لكل التطبيق
defineCustomElements(window); ← تفعيل Capacitor Camera API
root.render(<App />);
```

```tsx
// AppTabs.tsx — الشريط السفلي (Tab Bar)
<IonTabs>
  <IonRouterOutlet>
    <Route path="/tabs/home" component={AllPosts} />
    <Route path="/tabs/my-recipes" component={MyPosts} />
    <Route path="/tabs/create" component={CreatePost} />
    <Route path="/post/:id" component={PostDetail} />
    <Route path="/recipe/:id" component={GetPost} />
    <Route path="/edit/:id" component={UpdatePost} />
  </IonRouterOutlet>
  <IonTabBar slot="bottom">
    <IonTabButton tab="home" href="/tabs/home">
      <IonIcon icon={homeOutline} />
    </IonTabButton>
    ...
  </IonTabBar>
</IonTabs>
```

---

## 3. صفحة جميع الوصفات — `pages/AllPosts.tsx`

### 3.1 نمط Infinite Scroll

```tsx
const isFetching = useRef(false);

const fetchPosts = useCallback(async (page: number, replace = false) => {
  if (isFetching.current) return;  // منع الطلبات المتزامنة
  isFetching.current = true;
```
- `useRef(false)` ← متغير لا يُعيد رسم المكوّن — مُثالي لحفظ "هل طلب جارٍ؟"
- `if (isFetching.current) return` ← إذا استدعيت `fetchPosts` مرتين سريعاً → الثانية تُهمَل

```tsx
  const res = await api.get<PostsResponse>(GET_ALL_POSTS, {
    params: { page, limit: 10 },
  });

  const { posts: newPosts, pagination } = res.data;

  setPosts((prev) => (replace ? newPosts : [...prev, ...newPosts]));
```
- `replace = true` ← عند Pull-to-Refresh → يستبدل القائمة بالكامل
- `replace = false` ← عند Infinite Scroll → يُضيف للقائمة الموجودة
- `[...prev, ...newPosts]` ← spread operator — يدمج المصفوفتين في واحدة

### 3.2 تحديث تلقائي بأحداث المنشورات

```tsx
useEffect(() => {
  return onPostsChanged(() => {
    fetchPosts(1, true);
  });
}, [fetchPosts]);
```
`onPostsChanged` ← يُسجِّل مستمعاً لحدث `posts:changed`. كلما أضاف/حذف/عدَّل المستخدم وصفة → تُعيد هذه الصفحة تحميل القائمة.

الدالة تُرجع `() => removeEventListener(...)` ← React يستدعيها عند إزالة المكوّن لتنظيف المستمع.

### 3.3 Pull-to-Refresh وInfinite Scroll

```tsx
const handleRefresh = async (event: CustomEvent) => {
  await fetchPosts(1, true);
  event.detail.complete();  // ← يُخفي دوّار التحديث
};

const handleInfinite = async (event: CustomEvent) => {
  if (currentPage >= totalPages) {
    event.detail.complete();
    return;
  }
  await fetchPosts(currentPage + 1);
  event.detail.complete();
};
```

```tsx
<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
  <IonRefresherContent />
</IonRefresher>

<IonInfiniteScroll onIonInfinite={handleInfinite}>
  <IonInfiniteScrollContent />
</IonInfiniteScroll>
```

### 3.4 `useIonViewWillEnter` مقابل `useEffect`

```tsx
useIonViewWillEnter(() => {
  fetchPosts(1, true);
});
```
`useIonViewWillEnter` ← خاص بـ Ionic — يُنفَّذ **في كل مرة** تظهر الصفحة (حتى لو انتقلت للصفحة الأخرى ورجعت).

`useEffect(() => {...}, [])` ← يُنفَّذ مرة واحدة فقط عند التحميل الأول.

---

## 4. صفحة وصفاتي — `pages/MyPosts.tsx`

### 4.1 ActionSheet للخيارات

```tsx
const [showActionSheet, setShowActionSheet] = useState(false);
const [selectedPost, setSelectedPost] = useState<Post | null>(null);
```

```tsx
<PostCard
  post={post}
  showAuthor={false}
  onOptions={(p) => {
    setSelectedPost(p);
    setShowActionSheet(true);
  }}
/>
```

```tsx
<IonActionSheet
  isOpen={showActionSheet}
  buttons={[
    {
      text: 'عرض الوصفة',
      icon: eyeOutline,
      handler: () => history.push(`/recipe/${selectedPost?.id}`),
    },
    {
      text: 'تعديل الوصفة',
      icon: createOutline,
      handler: () => history.push(`/edit/${selectedPost?.id}`),
    },
    {
      text: 'حذف الوصفة',
      icon: trashOutline,
      role: 'destructive',
      handler: () => setShowDeleteAlert(true),
    },
    { text: 'إلغاء', icon: closeOutline, role: 'cancel' },
  ]}
/>
```
`IonActionSheet` ← قائمة خيارات تظهر من أسفل الشاشة.

### 4.2 حذف الوصفة

```tsx
const handleDeletePost = async () => {
  if (!selectedPost) return;
  try {
    await api.delete(DELETE_POST(selectedPost.id));
    setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
    emitPostsChanged();  // إخبار الصفحات الأخرى
  } catch {
    // ...
  }
};
```
- `filter((p) => p.id !== ...)` ← يُزيل الوصفة من القائمة المحلية **فوراً** بدون انتظار إعادة الجلب
- `emitPostsChanged()` ← ينبّه AllPosts لتحديث قائمتها

---

## 5. صفحة إنشاء وصفة — `pages/CreatePost.tsx`

### 5.1 ثوابت التحقق

```tsx
const TITLE_MIN = 3;
const TITLE_MAX = 200;
const CONTENT_MIN = 10;
const MAX_IMAGES = 10;
```
مطابقة لقواعد السيرفر في `validators/post.validator.js`.

### 5.2 إضافة الصور

```tsx
const handleTakePhoto = useCallback(async (source: CameraSource) => {
  if (photos.length >= MAX_IMAGES) {
    presentToast({ message: `الحد الأقصى ${MAX_IMAGES} صور`, ... });
    return;
  }
  await takePhoto(source);
}, [photos.length, takePhoto, presentToast]);
```
`CameraSource` ← نوع Capacitor يحدد المصدر: `CAMERA` أو `PHOTOS` (المعرض).

### 5.3 بناء FormData للإرسال

```tsx
const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('title', title.trim());
  formData.append('content', content.trim());

  if (stepsJson) {
    formData.append('steps', stepsJson);  // JSON string من Draft.js
  }

  if (location.country) formData.append('country', location.country);
  if (location.region) formData.append('region', location.region);

  for (const photoUrl of photos) {
    const res = await fetch(photoUrl);
    const blob = await res.blob();
    formData.append('postImages', blob, `photo-${Date.now()}.jpg`);
  }

  await api.post(CREATE_POST, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```
- `FormData` ← طريقة إرسال ملفات + بيانات في نفس الطلب
- `fetch(photoUrl)` → `blob()` ← تحويل URL محلي (blob://) لبيانات الملف
- `multipart/form-data` ← نوع المحتوى المطلوب لرفع الملفات

---

## 6. صفحة تعديل وصفة — `pages/UpdatePost.tsx`

### 6.1 تحميل البيانات الحالية

```tsx
const { id } = useParams<{ id: string }>();

useEffect(() => {
  const fetchPost = async () => {
    const { data } = await api.get(GET_POST_BY_ID(id));
    const post = data.post;

    setTitle(post.title);
    setContent(post.content);

    // تحويل steps المحفوظة إلى EditorState
    if (post.steps && isDraftContentState(post.steps)) {
      const contentState = convertFromRaw(post.steps);
      setEditorState(EditorState.createWithContent(contentState));
    }

    setExistingImages(post.images ?? []);
    setLocation({ country: post.country ?? '', region: post.region ?? '' });
  };
  fetchPost();
}, [id]);
```
- `useParams()` ← يجلب `:id` من URL مثل `/edit/42` → `id = "42"`
- `convertFromRaw(post.steps)` ← يُحوّل JSON المحفوظ لـ `ContentState` يفهمه محرر Draft.js

### 6.2 إدارة حذف الصور الحالية

```tsx
const [existingImages, setExistingImages] = useState<PostImage[]>([]);
const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

const handleDeleteExistingImage = (imageId: number) => {
  setDeletedImageIds((prev) => [...prev, imageId]);
  setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
};
```
- الصور لا تُحذف من السيرفر فوراً — تُضاف لقائمة `deletedImageIds`
- عند الإرسال: `formData.append('deletedImages', JSON.stringify(deletedImageIds))`

---

## 7. صفحة تفاصيل الوصفة — `pages/PostDetail.tsx` و `GetPost.tsx`

الصفحتان متطابقتان في المنطق — الفرق: `PostDetail` في سياق Tab و`GetPost` خارجه.

### 7.1 عرض مستقل Draft.js → HTML

```tsx
const isDraftContentState = (steps) => {
  return (
    typeof steps === 'object' &&
    !Array.isArray(steps) &&
    'blocks' in steps &&
    Array.isArray(steps.blocks)
  );
};

const stepsHtml = useMemo(() => {
  if (!post.steps) return null;
  if (isDraftContentState(post.steps)) {
    return draftToHtml(post.steps);  // تحويل Draft.js → HTML
  }
  return null;
}, [post.steps]);
```
`useMemo` ← يحفظ نتيجة الحساب — لا يُعيد تحويل HTML في كل رسم.

### 7.2 تبديل التعليقات

```tsx
const [showComments, setShowComments] = useState(false);

const toggleComments = () => {
  setShowComments((prev) => !prev);
  if (!showComments && comments.length === 0) {
    fetchComments();  // جلب التعليقات فقط عند الطلب (Lazy Load)
  }
};
```
التعليقات لا تُجلب مع الوصفة — تُجلب فقط عند الضغط على أيقونة التعليقات.

---

## 8. خلاصة — الأنماط البرمجية في صفحات الوصفات

| النمط | المكان | الهدف |
|-------|--------|-------|
| `useRef(false)` + `isFetching` | AllPosts, MyPosts | منع الطلبات المتكررة |
| `replace` flag | AllPosts, MyPosts | تمييز Refresh عن InfiniteScroll |
| `useIonViewWillEnter` | AllPosts, MyPosts | جلب البيانات عند كل دخول للصفحة |
| `onPostsChanged` | AllPosts | التحديث التلقائي عند تغيير البيانات |
| `FormData` + `blob` | CreatePost, UpdatePost | رفع الصور مع البيانات |
| `useParams` | PostDetail, UpdatePost | قراءة `:id` من URL |
| `filter` المحلي | MyPosts | حذف فوري بدون إعادة جلب |
| `useMemo` | PostDetail | تحويل Draft.js → HTML مرة واحدة |

---

*الدرس الثامن من اثني عشر — [← الدرس السابع: صفحات المصادقة](./07-pages-auth.md) | [الدرس التاسع: المكوّنات →](./09-components.md)*
