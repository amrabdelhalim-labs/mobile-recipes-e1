/**
 * صفحة إنشاء منشور جديد (CreatePost)
 * ─────────────────────────────────────
 * تتيح للمستخدم إنشاء منشور جديد يحتوي على:
 *  • عنوان (3-200 حرف)
 *  • محتوى النص / المكوّنات (10 أحرف على الأقل)
 *  • خطوات التحضير عبر محرر Draft.js الغني
 *  • صور مرفقة (إجبارية — صورة واحدة على الأقل، حتى 10 صور)
 *  • موقع جغرافي (اختياري — يُجلب تلقائياً)
 *
 * تدفق البيانات:
 *  1. المستخدم يملأ الحقول ويضيف الصور
 *  2. عند الضغط على "نشر" يتم التحقق من صحة البيانات
 *  3. تُبنى FormData وتُرسل إلى السيرفر: POST /posts/create
 *  4. السيرفر يتوقع: title, content, steps (JSON string), country, region, postImages (files)
 *  5. بعد النجاح يُعرض تنبيه نجاح والتنقل لصفحة المنشورات
 *
 * ملاحظات السيرفر:
 *  - upload.array('postImages', 10): حتى 10 صور بحقل 'postImages'
 *  - steps: يقبل JSON string أو array — نُرسل JSON string من Draft.js
 *  - المصادقة عبر Bearer token (يُضاف تلقائياً من axios interceptor)
 */
import {
  IonAlert,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonPage,
  IonRow,
  IonText,
  IonTextarea,
  useIonToast,
} from '@ionic/react';
import { imagesOutline, cameraOutline, closeCircle, trashOutline } from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { EditorState } from 'draft-js';
import { useState, useCallback, type FC } from 'react';
import { CameraSource } from '@capacitor/camera';
import { useHistory } from 'react-router-dom';

import Header from '../components/Header/Header';
import TextEditor from '../components/TextEditor/TextEditor';
import LocationPicker, { type LocationData } from '../components/Location/LocationPicker';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import api from '../config/axios';
import { CREATE_POST } from '../config/urls';
import { emitPostsChanged } from '../utils/postsEvents';
import './CreatePost.css';

/* ─── ثوابت التحقق (مطابقة للسيرفر) ─── */
const TITLE_MIN = 3;
const TITLE_MAX = 200;
const CONTENT_MIN = 10;
const MAX_IMAGES = 10;

const CreatePost: FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const { takePhoto, blobUrl, clearPhoto } = usePhotoGallery();

  // ─── حالات النموذج ───
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [stepsJson, setStepsJson] = useState('');
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData>({ country: '', region: '' });

  // ─── حالات واجهة المستخدم ───
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // ─── معالج إضافة الصور ───
  // عند التقاط صورة جديدة عبر الكاميرا أو المعرض
  const handleTakePhoto = useCallback(
    async (source: CameraSource) => {
      if (photos.length >= MAX_IMAGES) {
        presentToast({
          message: `الحد الأقصى ${MAX_IMAGES} صور`,
          duration: 3000,
          color: 'warning',
          position: 'bottom',
        });
        return;
      }
      await takePhoto(source);
    },
    [photos.length, takePhoto, presentToast]
  );

  // إضافة الصورة الجديدة عند تغير blobUrl
  // نستخدم useEffect مع كشف التغيير عبر مقارنة القيمة
  const handlePhotoAdded = useCallback(() => {
    if (blobUrl && !photos.includes(blobUrl)) {
      setPhotos((prev) => [blobUrl, ...prev]);
      clearPhoto();
    }
  }, [blobUrl, photos, clearPhoto]);

  // استدعاء handlePhotoAdded عند تغير blobUrl
  if (blobUrl && !photos.includes(blobUrl)) {
    handlePhotoAdded();
  }

  // ─── حذف صورة ───
  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── التحقق من صحة البيانات ───
  const validate = useCallback((): string | null => {
    if (!title.trim() || title.trim().length < TITLE_MIN) {
      return `العنوان يجب أن يكون ${TITLE_MIN} أحرف على الأقل`;
    }
    if (title.trim().length > TITLE_MAX) {
      return `العنوان يجب ألا يتجاوز ${TITLE_MAX} حرف`;
    }
    if (!content.trim() || content.trim().length < CONTENT_MIN) {
      return `المحتوى يجب أن يكون ${CONTENT_MIN} أحرف على الأقل`;
    }
    if (photos.length === 0) {
      return 'يجب إضافة صورة واحدة على الأقل';
    }
    return null;
  }, [title, content, photos.length]);

  // ─── إرسال المنشور ───
  const handleSubmit = useCallback(async () => {
    const error = validate();
    if (error) {
      presentToast({
        message: error,
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      // إرسال خطوات التحضير كـ JSON string (السيرفر يقبلها ويعالجها)
      if (stepsJson) {
        formData.append('steps', stepsJson);
      }

      // الموقع الجغرافي (اختياري)
      if (location.country) {
        formData.append('country', location.country);
      }
      if (location.region) {
        formData.append('region', location.region);
      }

      // تحويل blob URLs إلى ملفات فعلية وإرفاقها
      // السيرفر يتوقع الحقل 'postImages' (upload.array('postImages', 10))
      for (const photoUrl of photos) {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        // تحديد الامتداد من نوع الملف
        const extension = blob.type.split('/')[1] || 'jpeg';
        formData.append('postImages', blob, `photo.${extension}`);
      }

      await api.post(CREATE_POST, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // إشعار باقي الصفحات بالتغيير
      emitPostsChanged();

      // إعادة تعيين النموذج
      setTitle('');
      setContent('');
      setStepsJson('');
      setEditorState(EditorState.createEmpty());
      setPhotos([]);

      // عرض تنبيه النجاح
      setShowSuccessAlert(true);
    } catch (err: unknown) {
      console.error('فشل إنشاء المنشور:', err);

      // محاولة عرض رسالة الخطأ من السيرفر
      let errorMessage = 'فشل في نشر المنشور، حاول مرة أخرى';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string; errors?: { msg: string }[] } };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.errors?.[0]?.msg) {
          errorMessage = axiosError.response.data.errors[0].msg;
        }
      }

      presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, title, content, stepsJson, location, photos, presentToast]);

  // ─── معالج تغيير الموقع ───
  const handleLocationChange = useCallback((loc: LocationData) => {
    setLocation(loc);
  }, []);

  return (
    <IonPage>
      {/* ─── تنبيه النجاح ─── */}
      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={() => setShowSuccessAlert(false)}
        header="تم النشر بنجاح"
        message="لقد تم نشر المنشور، هل ترغب بالانتقال لصفحة المنشورات؟"
        buttons={[
          {
            text: 'البقاء هنا',
            role: 'cancel',
          },
          {
            text: 'عرض المنشورات',
            handler: () => {
              history.push('/tabs/posts/me');
            },
          },
        ]}
      />

      {/* ─── مؤشر التحميل ─── */}
      <IonLoading isOpen={isSubmitting} message="جاري النشر..." />

      <Header title="إنشاء منشور" />

      <IonContent className="ion-padding create-post-content">
        <IonGrid className="form-container">
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="10" sizeLg="8" sizeXl="6">
              <IonList className="create-post-list">
                {/* ═══ العنوان ═══ */}
                <IonItem>
                  <IonLabel position="stacked" color="primary">
                    العنوان *
                  </IonLabel>
                  <IonInput
                    value={title}
                    onIonInput={(e) => setTitle(e.detail.value ?? '')}
                    placeholder="عنوان المنشور (3-200 حرف)"
                    maxlength={TITLE_MAX}
                    counter
                  />
                </IonItem>

                {/* ═══ المحتوى / المكوّنات ═══ */}
                <IonItem>
                  <IonLabel position="stacked" color="primary">
                    المكوّنات *
                  </IonLabel>
                  <IonTextarea
                    value={content}
                    onIonInput={(e) => setContent(e.detail.value ?? '')}
                    placeholder="اكتب المكوّنات (10 أحرف على الأقل)"
                    autoGrow
                    rows={4}
                  />
                </IonItem>

                {/* ═══ خطوات التحضير (Draft.js) ═══ */}
                <div className="create-post-section">
                  <IonLabel color="primary" className="create-post-section-label">
                    خطوات التحضير
                  </IonLabel>
                  <TextEditor
                    onChange={setStepsJson}
                    editorState={editorState}
                    onEditorStateChange={setEditorState}
                  />
                </div>

                {/* ═══ الصور (إجبارية) ═══ */}
                <div className="create-post-section">
                  <IonLabel color="primary" className="create-post-section-label">
                    الصور * (صورة واحدة على الأقل)
                  </IonLabel>

                  {/* أزرار إضافة صورة */}
                  <div className="create-post-photo-buttons">
                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => handleTakePhoto(CameraSource.Camera)}
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      التقاط صورة
                    </IonButton>
                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => handleTakePhoto(CameraSource.Photos)}
                    >
                      <IonIcon icon={imagesOutline} slot="start" />
                      من المعرض
                    </IonButton>
                  </div>

                  {/* عرض الصور المختارة */}
                  {photos.length > 0 ? (
                    <div className="create-post-images-container">
                      <Swiper
                        className="create-post-swiper"
                        modules={[Pagination, Navigation]}
                        pagination={{ clickable: true }}
                        navigation
                        spaceBetween={10}
                        loop={photos.length > 1}
                      >
                        {photos.map((imgUrl, index) => (
                          <SwiperSlide key={`${imgUrl}-${index}`}>
                            <div className="create-post-slide">
                              <IonImg src={imgUrl} alt={`صورة ${index + 1}`} />
                              <IonButton
                                fill="clear"
                                className="create-post-remove-photo"
                                onClick={() => removePhoto(index)}
                              >
                                <IonIcon icon={closeCircle} color="light" />
                              </IonButton>
                              <span className="create-post-photo-counter">
                                {index + 1} / {photos.length}
                              </span>
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  ) : (
                    <div
                      className="create-post-no-photos"
                      onClick={() => handleTakePhoto(CameraSource.Photos)}
                    >
                      <IonIcon icon={imagesOutline} className="create-post-no-photos-icon" />
                      <IonText color="medium">اضغط لإضافة صور</IonText>
                    </div>
                  )}

                  {/* زر مسح جميع الصور */}
                  {photos.length > 0 && (
                    <IonButton
                      fill="clear"
                      color="danger"
                      size="small"
                      className="create-post-clear-photos"
                      onClick={() => setPhotos([])}
                    >
                      <IonIcon icon={trashOutline} slot="start" />
                      مسح جميع الصور ({photos.length})
                    </IonButton>
                  )}
                </div>

                {/* ═══ الموقع الجغرافي ═══ */}
                <div className="create-post-section">
                  <IonLabel color="primary" className="create-post-section-label">
                    الموقع الجغرافي
                  </IonLabel>
                  <LocationPicker onLocationChange={handleLocationChange} />
                </div>

                {/* ═══ زر النشر ═══ */}
                <div className="create-post-submit">
                  <IonButton
                    expand="block"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    strong
                  >
                    نشر المنشور
                  </IonButton>
                </div>
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default CreatePost;
