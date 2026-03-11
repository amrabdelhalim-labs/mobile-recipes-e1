# الدرس السابع: صفحات المصادقة 🔐

> **هدف الدرس:** تفهم كيف تعمل صفحتا تسجيل الدخول والتسجيل في وصفاتي — باستخدام Formik للنماذج، Yup للتحقق من البيانات، وCapacitor.Preferences لحفظ الجلسة.

---

## 1. لماذا صفحتان منفصلتان؟

```text
/login  // للمستخدمين الموجودين (بريد + كلمة مرور)
/register  // للمستخدمين الجدد (اسم + بريد + كلمة مرور)
```

كلتا الصفحتين تشتركان في نفس الأدوات:

| الأداة | الوظيفة |
|--------|---------|
| `Formik` | إدارة حالة النموذج (القيم + الأخطاء + الإرسال) |
| `Yup` | قواعد التحقق (هدّام قبل الإرسال للسيرفر) |
| `Capacitor.Preferences` | تخزين JWT في ذاكرة الجهاز |
| `AuthContext` | مشاركة حالة تسجيل الدخول مع بقية التطبيق |

---

## 2. صفحة تسجيل الدخول — `pages/Login.tsx`

### 2.1 واجهة بيانات النموذج

```typescript
interface LoginFormValues {
  email: string;
  password: string;
}

const initialValues: LoginFormValues = {
  email: '',
  password: '',
};
```
- `interface` ← تعريف TypeScript لشكل بيانات النموذج (للتحقق عند كتابة الكود)
- `initialValues` ← القيم الابتدائية — كلها فارغة في البداية

### 2.2 قواعد التحقق بـ Yup

```typescript
const validationSchema = yup.object<LoginFormValues>({
  email: yup
    .string()
    .required('يجب عليك إدخال البريد الإلكتروني')
    .email('يجب عليك إدخال بريد إلكتروني صحيح'),
  password: yup.string().required('يجب عليك إدخال كلمة المرور'),
});
```
- `yup.object()` ← مخطط التحقق لكائن بالكامل
- `.required(...)` ← الحقل إلزامي — رسالة الخطأ بالعربية
- `.email(...)` ← يتحقق من صيغة `xxx@yyy.zzz`

**ملاحظة:** هذه القواعد مطابقة لقواعد السيرفر — التحقق يحدث مرتين:
```text
التطبيق → Yup يتحقق  // إرسال للسيرفر  // السيرفر يتحقق مجدداً
                         (للحماية حتى لو تجاوز أحدهم التطبيق)
```

### 2.3 حالة المكوّن

```typescript
const [loading, setLoading] = useState(false);
const [errorAlert, setErrorAlert] = useState(false);

const { setLoggedIn, setJwt, jwt, loggedIn, fetchProfile } = useContext(AuthContext);
const history = useHistory();
```
- `loading` ← عرض دوّار التحميل أثناء الطلب
- `errorAlert` ← عرض رسالة خطأ إذا فشل تسجيل الدخول
- `useContext(AuthContext)` ← الوصول لدوال المصادقة المشتركة
- `useHistory()` ← من `react-router` — للتنقل البرمجي بين الصفحات

### 2.4 التوجيه التلقائي للمستخدم المسجّل

```typescript
useEffect(() => {
  if (loggedIn && jwt) {
    history.replace('/tabs/home');
  }
}, [loggedIn, jwt, history]);
```
- إذا فتح المستخدم صفحة الدخول وهو مسجّل بالفعل → يُوجَّه تلقائياً للرئيسية
- `history.replace(...)` بدلاً من `history.push(...)` ← لا يضيف صفحة الدخول لتاريخ التنقل (لا يستطيع الرجوع إليها بزر "رجوع")

### 2.5 دالة تسجيل الدخول

```typescript
const handleLogin = async (
  values: LoginFormValues,
  { resetForm }: FormikHelpers<LoginFormValues>
) => {
  setLoading(true);
  try {
    const res = await api.post(LOGIN_URL, values);
```
- `values` ← البيانات التي أدخلها المستخدم (تم التحقق منها بـ Yup)
- `FormikHelpers` ← يحتوي على دوال مساعدة مثل `resetForm`
- `api.post(LOGIN_URL, values)` ← إرسال `{ email, password }` للسيرفر

```typescript
    const token = `Bearer ${res.data.token}`;

    await Preferences.set({
      key: 'accessToken',
      value: token,
    });
```
- السيرفر يُرجع `{ token: "eyJhbGci..." }` → نُضيف البادئة `Bearer `
- `Preferences.set(...)` ← Capacitor API لحفظ في ذاكرة الجهاز (مثل localStorage لكن للموبايل)

```typescript
    setLoggedIn(true);
    setJwt(token);
    await fetchProfile();
    resetForm();
    history.replace('/tabs/home');
  } catch {
    setErrorAlert(true);
  } finally {
    setLoading(false);
  }
};
```
- ترتيب الخطوات بعد النجاح:
  1. تحديث حالة تسجيل الدخول
  2. حفظ JWT في Context
  3. جلب بيانات المستخدم من السيرفر
  4. تنظيف النموذج
  5. التوجيه للصفحة الرئيسية

### 2.6 استخدام Formik في JSX

```tsx
<Formik<LoginFormValues>
  initialValues={initialValues}
  validationSchema={validationSchema}
  onSubmit={handleLogin}
>
  {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
    <form onSubmit={handleSubmit}>
```
- `Formik` يمرر دوال وبيانات عبر **render prop** (دالة داخل JSX)
- `errors` ← أخطاء التحقق من Yup
- `touched` ← هل لمس المستخدم هذا الحقل؟ (لعرض الخطأ فقط بعد اللمس)
- `handleSubmit` ← يتحقق أولاً بـ Yup ثم يستدعي `handleLogin`

```tsx
{touched.email && errors.email && (
  <IonText color="danger">
    <p>{errors.email}</p>
  </IonText>
)}
```
`touched.email && errors.email` ← يعرض الخطأ فقط إذا:
1. لمس المستخدم حقل الإيميل (touched)
2. يوجد خطأ (errors.email)

بدون `touched` → تظهر الأخطاء قبل أن يبدأ المستخدم بالكتابة!

---

## 3. صفحة إنشاء الحساب — `pages/Register.tsx`

### 3.1 بيانات النموذج

```typescript
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

const validationSchema = yup.object<RegisterFormValues>({
  name: yup
    .string()
    .required('يجب عليك إدخال اسم المستخدم')
    .min(3, 'يجب أن يكون الاسم 3 أحرف على الأقل'),
  email: yup.string().required(...).email(...),
  password: yup.string().required(...).min(6, 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
});
```
- `.min(3, '...')` ← الحد الأدنى 3 أحرف
- القواعد مطابقة للسيرفر (`validator.register`)

### 3.2 دالة التسجيل

```typescript
const handleRegister = async (values, { resetForm }) => {
  setLoading(true);
  try {
    await api.post(REGISTER_URL, values);
    setSuccessAlert(true);
    resetForm();
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 400) {
      setErrorAlert(true);  // البريد الإلكتروني مستخدم
    } else {
      console.error('Registration error:', err.message);
    }
  } finally {
    setLoading(false);
  }
};
```
- على عكس تسجيل الدخول، لا يُحفظ JWT هنا — المستخدم يُوجَّه لصفحة الدخول
- `status === 400` ← السيرفر يرجع 400 إذا البريد مستخدم

### 3.3 رسائل Alert

```tsx
<IonAlert
  isOpen={successAlert}
  header="تم بنجاح!"
  message="يمكنك الانتقال إلى صفحة تسجيل الدخول"
  buttons={[{
    text: 'تسجيل الدخول',
    handler: () => history.push(`/${LOGIN_URL}`),
  }]}
/>
```
- `IonAlert` ← نافذة منبثقة من Ionic
- `handler` ← دالة تُنفَّذ عند الضغط على الزر

---

## 4. رحلة المستخدم الكاملة

```text
  /register  // يملأ النموذج → Yup يتحقق → POST /account/register
مستخدم جديد:
  // نجاح: Alert "تم بنجاح"
  // يضغط "تسجيل الدخول"  // ينتقل لـ /login

مستخدم موجود:
  /login  // يملأ البريد + كلمة المرور → Yup يتحقق → POST /account/login
  // نجاح: يُحفظ JWT في Preferences + Context  // ينتقل لـ /tabs/home
  // فشل (بيانات خاطئة): Alert "خطأ في البيانات"

مستخدم مسجّل يفتح /login مجدداً:
  useEffect يكتشف loggedIn = true → history.replace('/tabs/home')
```

---

## 5. خلاصة — الأدوات المستخدمة

| الأداة | الملف | الوظيفة |
|--------|-------|---------|
| `Formik` | Login + Register | إدارة النموذج |
| `Yup` | Login + Register | قواعد التحقق |
| `Capacitor.Preferences` | Login | تخزين JWT |
| `useContext(AuthContext)` | Login + Register | حالة تسجيل الدخول |
| `useHistory()` | Login + Register | التنقل |
| `IonAlert` | Register | رسائل النجاح / الخطأ |
| `IonLoading` | Login + Register | دوّار التحميل |

---

*الدرس السابع من اثني عشر — [← الدرس السادس: اختبارات العميل](./06-client-testing.md) | [الدرس الثامن: صفحات الوصفات →](./08-pages-posts.md)*
