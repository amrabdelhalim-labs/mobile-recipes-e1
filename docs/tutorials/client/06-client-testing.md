# شرح اختبارات العميل (Client Testing)

## 📋 نظرة عامة

يستخدم التطبيق **Vitest** كإطار اختبار، وهو بديل سريع لـ Jest مُصمم للعمل مع **Vite**. تشمل الاختبارات:

| النوع | الأداة | الهدف |
|-------|--------|-------|
| اختبارات الوحدة | Vitest | أنواع، روابط، أحداث، هوكس |
| اختبارات التكامل | Vitest + Testing Library | مكونات React |
| اختبارات E2E | Cypress | تدفقات المستخدم الكاملة |

---

## 🤔 لماذا نختبر العميل؟

### ❌ بدون اختبارات:

```text
1. تُعدّل ملف الأنواع → 😱 لا تدري أن Post_Images تغيّر لـ images
2. تُغيّر رابط API → 😱 لا تدري أنه لا يطابق السيرفر
3. تُعدّل هوك الكاميرا → 😱 لا تدري أنه توقف عن العمل
```

### ✅ مع اختبارات:

```text
1. تُعدّل ملف الأنواع → ✅ الاختبار يفشل فوراً ويُنبّهك
2. تُغيّر رابط API → ✅ الاختبار يكشف عدم التطابق
3. تُعدّل هوك الكاميرا → ✅ الاختبار يتحقق من السلوك المتوقع
```

---

## 📚 الملف الأول: إعداد بيئة الاختبارات (`setupTests.ts`)

```typescript
/**
 * إعداد بيئة الاختبارات (Test Setup)
 * ─────────────────────────────────────
 * يتم تحميل هذا الملف تلقائياً قبل كل ملف اختبار عبر Vitest.
 *
 * يقوم بـ:
 *  1. إضافة matchers مكتبة jest-dom (مثل toBeInTheDocument)
 *  2. محاكاة (Mock) واجهات المتصفح غير المتوفرة في بيئة jsdom
 *  3. محاكاة واجهات Capacitor (Preferences, Camera, Geolocation)
 */
import '@testing-library/jest-dom/extend-expect';

// ─── محاكاة matchMedia (مطلوب لمكوّنات Ionic) ───
window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { },
        addEventListener: function () { },
        removeEventListener: function () { },
        dispatchEvent: function () { return false; },
        media: '',
        onchange: null,
    };
};

// ─── محاكاة Capacitor Preferences ───
vi.mock('@capacitor/preferences', () => ({
    Preferences: {
        get: vi.fn().mockResolvedValue({ value: null }),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
    },
}));

// ─── محاكاة Capacitor Camera ───
vi.mock('@capacitor/camera', () => ({
    Camera: {
        getPhoto: vi.fn().mockResolvedValue({ webPath: 'blob:test-photo-url' }),
    },
    CameraResultType: { Uri: 'uri' },
    CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS' },
}));

// ─── محاكاة Capacitor Geolocation ───
vi.mock('@capacitor/geolocation', () => ({
    Geolocation: {
        getCurrentPosition: vi.fn().mockResolvedValue({
            coords: { latitude: 30.0444, longitude: 31.2357 },
        }),
    },
}));
```

---

### 🔍 شرح تفصيلي

#### 1️⃣ **لماذا نحتاج Setup File؟**

Vitest يعمل في بيئة **jsdom** (محاكاة للمتصفح في Node.js). لكن jsdom لا يدعم كل واجهات المتصفح:

```typescript
window.matchMedia('(prefers-color-scheme: dark)');  // ← Ionic يستخدمها
// ❌ هذه لا تعمل في jsdom بدون محاكاة:
Camera.getPhoto(...);                                // ← Capacitor
Geolocation.getCurrentPosition();                    // ← Capacitor
```

#### 2️⃣ **ما هي المحاكاة (Mocking)؟**

المحاكاة = استبدال الكود الحقيقي بكود وهمي للاختبار:

```typescript
Camera.getPhoto({ ... }); // → يفتح كاميرا الموبايل
// الكود الحقيقي: يفتح الكاميرا فعلاً

// الكود الوهمي (Mock): يُرجع بيانات وهمية فوراً
vi.mock('@capacitor/camera', () => ({
    Camera: {
        getPhoto: vi.fn().mockResolvedValue({
            webPath: 'blob:test-photo-url'  // ← بيانات وهمية
        }),
    },
}));
```

**لماذا نحاكي؟**
- ✅ الاختبار يعمل بدون كاميرا حقيقية
- ✅ الاختبار يعمل بدون إنترنت (GPS)
- ✅ الاختبار سريع (لا ينتظر المستخدم)
- ✅ الاختبار متوقع (نفس النتيجة دائماً)

#### 3️⃣ **`vi.fn()` و `vi.mock()`**

```typescript
// vi.fn() — إنشاء دالة وهمية يمكن تتبعها
const myFn = vi.fn();
myFn('hello');
expect(myFn).toHaveBeenCalledWith('hello'); // ✅

// vi.mock() — استبدال مكتبة كاملة
vi.mock('@capacitor/preferences', () => ({
    Preferences: {
        get: vi.fn().mockResolvedValue({ value: null }),
        //   ↑ دالة وهمية   ↑ تُرجع Promise بقيمة { value: null }
    },
}));
```

---

## 📚 الاختبار الأول: أنواع TypeScript (`types.test.ts`)

```typescript
describe('أنواع المنشورات (Post Types)', () => {
    it('يجب أن يتطابق هيكل Post مع استجابة السيرفر', () => {
        const post: Post = {
            id: 1,
            title: 'كبسة لحم',
            content: 'أرز بسمتي, لحم ضأن',
            // ... جميع الحقول
            images: [{ id: 1, imageUrl: '/uploads/recipe1.jpg' }],
            //  ↑ يجب أن يطابق as: 'images' في السيرفر
        };

        expect(post.images).toHaveLength(1);
        expect(post.images[0].imageUrl).toContain('recipe1');
    });
});
```

### الهدف:

هذا الاختبار يتأكد من أن **واجهات TypeScript تطابق استجابة السيرفر**.

**لماذا هذا مهم؟**

```text
TypeScript لا يشتكي (لأن الأنواع لم تتغير)
   ↓
إذا لم نُحدّث الأنواع في العميل:
   ↓
السيرفر يُغيّر Post_Images → images
   ↓
لكن البيانات لا تظهر! (لأن الحقل غير موجود)
   ↓
الاختبار يفشل → ✅ نكتشف المشكلة فوراً
```

---

## 📚 الاختبار الثاني: ثوابت الروابط (`urls.test.ts`)

```typescript
describe('مسارات المنشورات', () => {
    it('يجب أن تكون المسارات الثابتة صحيحة', () => {
        expect(GET_ALL_POSTS).toBe('posts');
        expect(GET_MY_POSTS).toBe('posts/me');
        expect(CREATE_POST).toBe('posts/create');
    });

    it('يجب أن تُنشئ دوال المسارات الديناميكية الرابط الصحيح', () => {
        expect(GET_POST_BY_ID(1)).toBe('posts/1');
        expect(GET_POST_BY_ID('42')).toBe('posts/42');
    });
});

describe('قواعد التنسيق', () => {
    it('يجب ألا تبدأ أي رابط بـ / (Axios يضيفها)', () => {
        allStaticUrls.forEach(url => {
            expect(url).not.toMatch(/^\//);
        });
    });
});
```

### الهدف:

- ✅ كل رابط يطابق مسار السيرفر بالضبط
- ✅ الدوال الديناميكية تُنتج الشكل الصحيح
- ✅ لا توجد `/` بادئة (Axios يضيفها)
- ✅ لا توجد `/` لاحقة

---

## 📚 الاختبار الثالث: أحداث المنشورات (`postsEvents.test.ts`)

```typescript
describe('أحداث تحديث المنشورات', () => {
    it('يجب أن يطلق emitPostsChanged حدث CustomEvent', () => {
        const spy = vi.fn();
        window.addEventListener(POSTS_CHANGED_EVENT, spy);
        emitPostsChanged();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('يجب أن يُلغي الاشتراك عند استدعاء cleanup', () => {
        const handler = vi.fn();
        const cleanup = onPostsChanged(handler);

        emitPostsChanged();
        expect(handler).toHaveBeenCalledTimes(1);

        cleanup();  // إلغاء الاشتراك
        emitPostsChanged();
        expect(handler).toHaveBeenCalledTimes(1); // لم يزد!
    });
});
```

### الهدف:

نظام الأحداث يسمح للمكونات بالتواصل **بدون ارتباط مباشر**:

```text
emitPostsChanged()  ──── CustomEvent ────→  onPostsChanged(reload)
      ↓                                        ↓
صفحة إنشاء منشور                      صفحة جميع المنشورات
      ↓                                        ↓
 "تم إنشاء منشور"                      "أعد تحميل القائمة"
```

الاختبار يتحقق من:
- ✅ إطلاق الحدث يعمل
- ✅ الاستماع يعمل
- ✅ إلغاء الاشتراك (cleanup) يمنع التسريب
- ✅ دعم عدة مستمعين

---

## 📚 الاختبار الرابع: هوك الكاميرا (`usePhotoGallery.test.ts`)

```typescript
describe('هوك الكاميرا (usePhotoGallery)', () => {
    it('يجب أن يبدأ بـ blobUrl = undefined', () => {
        const { result } = renderHook(() => usePhotoGallery());
        expect(result.current.blobUrl).toBeUndefined();
    });

    it('يجب أن يُحدّث blobUrl بعد التقاط صورة', async () => {
        vi.mocked(Camera.getPhoto).mockResolvedValueOnce({
            webPath: 'blob:http://localhost/test-photo',
            format: 'jpeg',
            saved: false,
        });

        const { result } = renderHook(() => usePhotoGallery());
        await act(async () => {
            await result.current.takePhoto('CAMERA' as never);
        });

        expect(result.current.blobUrl).toBe('blob:http://localhost/test-photo');
    });
});
```

### ما هو `renderHook`؟

```typescript
// ❌ const { blobUrl } = usePhotoGallery();  // خطأ!
// لا نستطيع استدعاء Hook خارج مكوّن React:

// renderHook يُنشئ مكوّن وهمي يستدعي الـ Hook:
// ✅
const { result } = renderHook(() => usePhotoGallery());
// result.current = { blobUrl, takePhoto, clearPhoto }
```

### ما هو `act()`؟

```typescript
// act() يضمن تطبيق جميع تحديثات React قبل التحقق:
await act(async () => {
    await result.current.takePhoto('CAMERA');
    // ← React يُحدّث الحالة (setBlobUrl)
});
// ← الآن فقط نتحقق من النتيجة
expect(result.current.blobUrl).toBe('blob:...');
```

---

## 📚 الاختبار الخامس: إعداد Axios (`axios.test.ts`)

```typescript
describe('إعداد Axios (API Client)', () => {
    it('يجب أن يكون baseURL معرّفاً', async () => {
        const api = (await import('../config/axios')).default;
        expect(api.defaults.baseURL).toBeDefined();
    });

    it('يجب أن يقرأ Token من Preferences عند إرسال طلب', async () => {
        vi.mocked(Preferences.get).mockResolvedValueOnce({
            value: 'Bearer eyJhbGciOiJIUzI1NiJ9.test'
        });

        const api = (await import('../config/axios')).default;
        // ... اختبار interceptor
    });
});
```

### لماذا `await import()` بدلاً من `import`؟

```typescript
// ❌ import العادي يتم قبل vi.mock — المحاكاة لا تعمل
import api from '../config/axios';

// ✅ import الديناميكي يتم بعد vi.mock — المحاكاة تعمل
const api = (await import('../config/axios')).default;
```

---

## 🧪 تشغيل الاختبارات

### الأوامر المتاحة:

```bash
npm test
# تشغيل جميع الاختبارات مرة واحدة

# تشغيل الاختبارات مع مراقبة التغييرات (يُعيد التشغيل تلقائياً)
npm run test:watch

# تشغيل الاختبارات مع تقرير التغطية
npm run test:coverage

# تشغيل اختبارات E2E (يحتاج التطبيق يعمل)
npm run test:e2e
```

### النتيجة المتوقعة:

```text
 ✓ src/tests/types.test.ts (8 tests)
 ✓ src/tests/urls.test.ts (14 tests)
 ✓ src/tests/postsEvents.test.ts (5 tests)
 ✓ src/tests/usePhotoGallery.test.ts (4 tests)
 ✓ src/tests/axios.test.ts (5 tests)
 ✓ src/App.test.tsx (1 test)

 Test Files  6 passed (6)
      Tests  37 passed (37)
```

---

## 📂 هيكل ملفات الاختبارات

```text
app/src/
├── tests/  // مجلد الاختبارات
│   ├── types.test.ts  // اختبارات الأنواع (8 اختبارات)
│   ├── urls.test.ts  // اختبارات الروابط (14 اختبار)
│   ├── postsEvents.test.ts  // اختبارات الأحداث (5 اختبارات)
│   ├── usePhotoGallery.test.ts  // اختبارات هوك الكاميرا (4 اختبارات)
│   └── axios.test.ts  // اختبارات إعداد Axios (5 اختبارات)
│
├── setupTests.ts  // إعداد بيئة الاختبارات
├── App.test.tsx  // اختبار المكون الرئيسي (1 اختبار)
│
└── cypress/  // اختبارات E2E
    └── e2e/
        └── test.cy.ts  // اختبارات واجهة المستخدم
```

---

## 📊 أنواع Matchers المستخدمة

| Matcher | الاستخدام | مثال |
|---------|----------|------|
| `toBe` | مقارنة قيمة بالضبط | `expect(url).toBe('posts')` |
| `toBeDefined` | التحقق من وجود قيمة | `expect(api.defaults.baseURL).toBeDefined()` |
| `toBeUndefined` | التحقق من عدم وجود قيمة | `expect(blobUrl).toBeUndefined()` |
| `toHaveLength` | التحقق من طول مصفوفة | `expect(images).toHaveLength(1)` |
| `toContain` | التحقق من احتواء نص | `expect(email).toContain('@')` |
| `toHaveProperty` | التحقق من وجود خاصية | `expect(obj).toHaveProperty('id')` |
| `not.toHaveProperty` | التحقق من عدم وجود خاصية | `expect(user).not.toHaveProperty('password')` |
| `toHaveBeenCalledTimes` | عدد استدعاءات دالة وهمية | `expect(spy).toHaveBeenCalledTimes(1)` |
| `toBeInstanceOf` | التحقق من نوع الكائن | `expect(event).toBeInstanceOf(CustomEvent)` |
| `not.toMatch` | عدم مطابقة regex | `expect(url).not.toMatch(/^\//)` |

---

## 💡 أفضل الممارسات

### 1. **وصف عربي واضح**

```typescript
it('يجب أن يتطابق هيكل Post مع استجابة السيرفر', () => { ... });
// ✅ واضح — وصف عربي يصف ماذا يجب أن يحصل

// ❌ غير واضح
it('test post', () => { ... });
```

### 2. **التنظيف بعد كل اختبار**

```typescript
beforeEach(() => {
    vi.clearAllMocks();  // مسح جميع المحاكاة قبل كل اختبار
});
```

### 3. **عزل الاختبارات**

كل اختبار يجب أن يعمل **مستقلاً** عن غيره:

```typescript
it('test 1', () => {
// ✅ كل اختبار يُعدّ بياناته الخاصة
    const handler = vi.fn();
    // ...
});

it('test 2', () => {
    const handler = vi.fn();  // ← مستقل عن test 1
    // ...
});
```

### 4. **اختبر السلوك وليس التفاصيل**

```typescript
expect(result.current.blobUrl).toBe('blob:...');
// ✅ اختبر النتيجة (السلوك)

// ❌ لا تختبر تفاصيل التنفيذ الداخلية
expect(useState).toHaveBeenCalled();
```

---

## 🎯 النقاط المهمة

✅ **Vitest** سريع ومتوافق مع Vite — أفضل من Jest لمشاريع Vite  
✅ **setupTests.ts** يُحاكي واجهات Capacitor والمتصفح  
✅ **اختبارات الأنواع** تكشف عدم تطابق العميل مع السيرفر  
✅ **اختبارات الروابط** تضمن مطابقة المسارات  
✅ **`vi.fn()`** لإنشاء دوال وهمية قابلة للتتبع  
✅ **`renderHook`** لاختبار Custom Hooks خارج المكونات  
✅ **37 اختبار** تغطي الأنواع، الروابط، الأحداث، الهوكس، وإعداد API  

---

**📖 الخطوة السابقة**: [هندسة المكونات وتسمية الملفات](./05-component-naming.md)
