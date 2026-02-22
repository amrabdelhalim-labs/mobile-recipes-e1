# شرح هوك معرض الصور (usePhotoGallery.ts)

## 📋 نظرة عامة

ملف `usePhotoGallery.ts` يحتوي على **Custom Hook** للتعامل مع الكاميرا ومعرض الصور في Capacitor.

---

## 🤔 ما هو Custom Hook؟

**Custom Hook** = Hook مخصص = دالة تستخدم React Hooks وتعيد استخدامها

### فوائد Custom Hooks:

✅ **إعادة الاستخدام**: نفس المنطق في أماكن متعددة  
✅ **التنظيم**: فصل المنطق عن واجهة المستخدم  
✅ **السهولة**: واجهة بسيطة للاستخدام  

---

## 📚 الكود الكامل

```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useState } from 'react';

/**
 * هوك مخصص للتعامل مع الكاميرا ومعرض الصور
 * يستخدم Camera API من Capacitor لالتقاط أو اختيار صورة
 * ويرجع blob URL للصورة المختارة
 */
export function usePhotoGallery() {
    const [blobUrl, setBlobUrl] = useState<string | undefined>();

    const takePhoto = async (source: CameraSource): Promise<void> => {
        try {
            const cameraPhoto = await Camera.getPhoto({
                resultType: CameraResultType.Uri,
                source,
                quality: 70,
            });
            setBlobUrl(cameraPhoto.webPath);
        } catch {
            console.log('تم إغلاق الكاميرا');
        }
    };

    /** مسح blob URL الحالي */
    const clearPhoto = () => setBlobUrl(undefined);

    return {
        takePhoto,
        blobUrl,
        clearPhoto,
    };
}
```

---

## 📷 القسم الأول: الحالة (State)

```typescript
const [blobUrl, setBlobUrl] = useState<string | undefined>();
```

### الشرح:

**`blobUrl`** = رابط مؤقت للصورة المختارة

**مثال**:
```typescript
'blob:http://localhost:8100/a3f2c1d4-5e6b-7c8d-9e0f-1a2b3c4d5e6f'
```

**أو** (في الموبايل):
```typescript
'file:///storage/emulated/0/DCIM/Camera/IMG_20260222_123456.jpg'
```

---

## 📸 القسم الثاني: التقاط/اختيار صورة

```typescript
const takePhoto = async (source: CameraSource): Promise<void> => {
    try {
        const cameraPhoto = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source,
            quality: 70,
        });
        setBlobUrl(cameraPhoto.webPath);
    } catch {
        console.log('تم إغلاق الكاميرا');
    }
};
```

### الشرح التفصيلي:

#### 1️⃣ **المعامل `source`**

```typescript
source: CameraSource
```

**الخيارات**:

| القيمة | الوصف |
|--------|-------|
| `CameraSource.Camera` | فتح الكاميرا لالتقاط صورة جديدة |
| `CameraSource.Photos` | فتح معرض الصور لاختيار صورة موجودة |
| `CameraSource.Prompt` | يسأل المستخدم: كاميرا أم معرض؟ |

**مثال**:
```typescript
// فتح الكاميرا
await takePhoto(CameraSource.Camera);

// فتح المعرض
await takePhoto(CameraSource.Photos);

// السؤال
await takePhoto(CameraSource.Prompt);
```

---

#### 2️⃣ **الخيارات**

```typescript
{
    resultType: CameraResultType.Uri,
    source,
    quality: 70,
}
```

##### أ. **`resultType`**

```typescript
resultType: CameraResultType.Uri
```

**الخيارات**:

| القيمة | الوصف | الاستخدام |
|--------|-------|----------|
| `Uri` | رابط للملف | ✅ الأفضل - يوفر الذاكرة |
| `Base64` | البيانات كنص مشفر | للإرسال مباشرة للخادم |
| `DataUrl` | `data:image/jpeg;base64,...` | للعرض في `<img src>` |

**لماذا `Uri`؟**
- ✅ حجم صغير (مجرد رابط)
- ✅ لا يحمل الصورة بالكامل في الذاكرة
- ✅ أسرع

##### ب. **`source`**
- تمرير من المعامل

##### ج. **`quality`**

```typescript
quality: 70
```

**الشرح**:
- جودة الصورة من **0 إلى 100**
- `100` = أفضل جودة (حجم أكبر)
- `70` = توازن جيد (جودة مقبولة + حجم معقول)
- `50` = جودة أقل (حجم أصغر)

💡 **توصية**: استخدم 60-80 للتطبيقات العادية

---

#### 3️⃣ **النتيجة**

```typescript
const cameraPhoto = await Camera.getPhoto(...);
```

**ماذا يرجع؟**
```typescript
{
  webPath: 'blob:...' أو 'file://...',
  format: 'jpeg',
  saved: false,
  ...
}
```

#### 4️⃣ **حفظ URL**

```typescript
setBlobUrl(cameraPhoto.webPath);
```

**النتيجة**:
```typescript
blobUrl = 'blob:http://localhost:8100/...'
```

الآن يمكن عرضها:
```tsx
<img src={blobUrl} alt="Photo" />
```

---

#### 5️⃣ **معالجة الإلغاء**

```typescript
catch {
    console.log('تم إغلاق الكاميرا');
}
```

**متى؟**
- المستخدم ضغط "إلغاء" في الكاميرا
- المستخدم أغلق معرض الصور بدون اختيار

---

## 🗑️ القسم الثالث: مسح الصورة

```typescript
const clearPhoto = () => setBlobUrl(undefined);
```

### الشرح:

**الاستخدام**:
- بعد رفع الصورة للخادم
- عند إغلاق النافذة
- عند الضغط على "حذف"

**مثال**:
```tsx
const { blobUrl, clearPhoto } = usePhotoGallery();

const handleUpload = async () => {
  await uploadToServer(blobUrl);
  clearPhoto();  // مسح الصورة بعد الرفع
};
```

---

## 📤 القسم الرابع: الإرجاع

```typescript
return {
    takePhoto,
    blobUrl,
    clearPhoto,
};
```

### الشرح:

**ما يرجعه Hook**:

| الاسم | النوع | الوصف |
|------|------|-------|
| `takePhoto` | function | فتح الكاميرا/المعرض |
| `blobUrl` | string \| undefined | رابط الصورة المختارة |
| `clearPhoto` | function | مسح الصورة |

---

## 💡 أمثلة عملية

### مثال 1: استخدام بسيط

```tsx
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import { CameraSource } from '@capacitor/camera';

const PhotoUploader = () => {
  const { takePhoto, blobUrl, clearPhoto } = usePhotoGallery();

  return (
    <div>
      <button onClick={() => takePhoto(CameraSource.Photos)}>
        اختر صورة
      </button>
      
      {blobUrl && (
        <div>
          <img src={blobUrl} alt="Preview" />
          <button onClick={clearPhoto}>حذف</button>
        </div>
      )}
    </div>
  );
};
```

---

### مثال 2: مع خيارات متعددة

```tsx
import { IonActionSheet } from '@ionic/react';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import { CameraSource } from '@capacitor/camera';

const PhotoPicker = () => {
  const { takePhoto, blobUrl } = usePhotoGallery();
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <>
      <button onClick={() => setShowActionSheet(true)}>
        إضافة صورة
      </button>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: 'التقاط صورة',
            handler: () => takePhoto(CameraSource.Camera)
          },
          {
            text: 'اختيار من المعرض',
            handler: () => takePhoto(CameraSource.Photos)
          },
          {
            text: 'إلغاء',
            role: 'cancel'
          }
        ]}
      />

      {blobUrl && <img src={blobUrl} alt="Preview" />}
    </>
  );
};
```

---

### مثال 3: رفع للخادم

```tsx
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import { CameraSource } from '@capacitor/camera';

const CreatePost = () => {
  const { takePhoto, blobUrl, clearPhoto } = usePhotoGallery();

  const handleSubmit = async () => {
    if (!blobUrl) {
      alert('الرجاء اختيار صورة');
      return;
    }

    // تحويل blob URL إلى File
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

    // رفع للخادم
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', 'عنوان المنشور');

    await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });

    clearPhoto();  // مسح بعد الرفع
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={() => takePhoto(CameraSource.Photos)}>
        إضافة صورة
      </button>
      
      {blobUrl && <img src={blobUrl} alt="Preview" />}
      
      <button type="submit">نشر</button>
    </form>
  );
};
```

---

## ⚙️ خيارات متقدمة

### 1. **تحديد الجودة**

إنشاء Hook مخصص مع جودة مختلفة:

```typescript
export function usePhotoGallery(quality: number = 70) {
  // ...
  const cameraPhoto = await Camera.getPhoto({
    quality,  // استخدام المعامل
    // ...
  });
}

// الاستخدام
const { takePhoto } = usePhotoGallery(90);  // جودة عالية
```

---

### 2. **تحديد الحجم**

```typescript
const cameraPhoto = await Camera.getPhoto({
  resultType: CameraResultType.Uri,
  source,
  quality: 70,
  width: 1000,     // عرض أقصى 1000px
  height: 1000,    // ارتفاع أقصى 1000px
});
```

---

### 3. **السماح بالتعديل**

```typescript
const cameraPhoto = await Camera.getPhoto({
  resultType: CameraResultType.Uri,
  source,
  quality: 70,
  allowEditing: true,  // يفتح محرر الصور
});
```

**ماذا يفعل؟**
- بعد اختيار الصورة، يفتح محرر بسيط
- المستخدم يمكنه قص أو تدوير الصورة

---

### 4. **حفظ في المعرض**

```typescript
const cameraPhoto = await Camera.getPhoto({
  resultType: CameraResultType.Uri,
  source,
  quality: 70,
  saveToGallery: true,  // حفظ نسخة في المعرض
});
```

⚠️ **ملاحظة**: يحتاج صلاحيات (Permissions)

---

## 🔒 الصلاحيات (Permissions)

### Android (`AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS (`Info.plist`)

```xml
<key>NSCameraUsageDescription</key>
<string>نحتاج الوصول للكاميرا لالتقاط الصور</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>نحتاج الوصول للمعرض لاختيار الصور</string>
```

---

## ❓ أسئلة شائعة

### 1. **ما الفرق بين `Uri` و `Base64`؟**

| الميزة | Uri | Base64 |
|--------|-----|--------|
| الحجم | صغير | كبير جداً |
| السرعة | سريع | بطيء |
| الذاكرة | قليل | كثير |
| الاستخدام | ✅ الأفضل | للحالات الخاصة |

### 2. **كيف أرسل الصورة للخادم؟**

```typescript
const response = await fetch(blobUrl);
const blob = await response.blob();
const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

const formData = new FormData();
formData.append('image', file);
await fetch('/api/upload', { method: 'POST', body: formData });
```

### 3. **هل يعمل في المتصفح؟**

نعم! لكن مع قيود:
- ✅ `CameraSource.Photos` يعمل (يفتح File Picker)
- ❌ `CameraSource.Camera` لا يعمل في Desktop

### 4. **كيف أدعم صور متعددة؟**

```typescript
const [photos, setPhotos] = useState<string[]>([]);

const addPhoto = async (source: CameraSource) => {
  const cameraPhoto = await Camera.getPhoto({...});
  setPhotos([...photos, cameraPhoto.webPath!]);
};
```

---

## 🎯 النقاط المهمة

✅ **Custom Hook** يسهل إعادة استخدام منطق الكاميرا  
✅ **`CameraSource`** يحدد الكاميرا أو المعرض  
✅ **`quality`** يوازن بين الجودة والحجم  
✅ **`Uri`** أفضل من `Base64` للأداء  
✅ **`clearPhoto()`** ضروري لتنظيف الذاكرة  

---

**📖 الخطوة التالية**: [صفحة تسجيل الدخول](./05-login-page.md)
