/**
 * صفحة تعديل المنشور (UpdatePost)
 * ─────────────────────────────────
 * تتيح للمستخدم تعديل منشور موجود بما في ذلك:
 *  • تعديل العنوان والمحتوى (المكوّنات)
 *  • تعديل خطوات التحضير عبر محرر Draft.js (يدعم المنشورات القديمة والجديدة)
 *  • إدارة الصور: حذف صور حالية + إضافة صور جديدة (يجب بقاء صورة واحدة على الأقل)
 *  • تعديل الموقع الجغرافي
 *
 * تدفق البيانات:
 *  1. عند فتح الصفحة يُجلب المنشور من السيرفر: GET /posts/:id
 *  2. تُعبّأ الحقول بالبيانات الحالية (بما في ذلك تحويل steps إلى EditorState)
 *  3. المستخدم يعدّل ما يشاء
 *  4. عند الضغط "حفظ التعديلات": يتم التحقق ثم إرسال PUT /posts/:id
 *  5. السيرفر يقبل: title, content, steps, country, region, deletedImages (JSON[]), postImages (files)
 *
 * إدارة الصور:
 *  - الصور الحالية (existingImages): تظهر مع زر حذف — عند الحذف يُضاف ID لقائمة deletedImageIds
 *  - الصور الجديدة (newPhotos): blob URLs من الكاميرا/المعرض — تُرسل كملفات
 *  - التحقق: مجموع (الصور الحالية غير المحذوفة + الصور الجديدة) >= 1
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
  IonSkeletonText,
  IonText,
  IonTextarea,
  useIonToast,
} from '@ionic/react';
import {
  imagesOutline,
  cameraOutline,
  closeCircle,
  trashOutline,
  arrowUndoCircle,
} from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { EditorState, convertFromRaw, type RawDraftContentState } from 'draft-js';
import { useState, useCallback, useEffect, useContext, type FC } from 'react';
import { CameraSource } from '@capacitor/camera';
import { useParams, useHistory } from 'react-router-dom';

import Header from '../components/Header/Header';
import TextEditor from '../components/TextEditor/TextEditor';
import LocationPicker, { type LocationData } from '../components/Location/LocationPicker';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import { AuthContext } from '../context/AuthContext';
import api from '../config/axios';
import { GET_POST_BY_ID, UPDATE_POST, API_URL } from '../config/urls';
import { emitPostsChanged } from '../utils/postsEvents';
import type { PostDetail, PostImage, PostSteps } from '../types/post.types';
import './UpdatePost.css';

/* ─── ثوابت التحقق (مطابقة للسيرفر والـ CreatePost) ─── */
const TITLE_MIN = 3;
const TITLE_MAX = 200;
const CONTENT_MIN = 10;
const MAX_IMAGES = 10;

type RouteParams = { id: string };

/**
 * فحص ما إذا كان steps عبارة عن كائن Draft.js RawDraftContentState
 * يتحقق من وجود خاصية 'blocks' كمصفوفة
 */
const isDraftContentState = (steps: PostSteps): steps is RawDraftContentState => {
  return (
    typeof steps === 'object' &&
    !Array.isArray(steps) &&
    steps !== null &&
    'blocks' in steps &&
    Array.isArray((steps as RawDraftContentState).blocks)
  );
};

/**
 * تحويل steps المُخزّنة إلى EditorState لمحرر Draft.js
 * - إذا كانت RawDraftContentState: تحويل مباشر
 * - إذا كانت string[] (منشورات قديمة): تحويل النصوص إلى blocks
 * - أي شيء آخر: إرجاع محرر فارغ
 */
const stepsToEditorState = (steps: PostSteps | null): EditorState => {
  if (!steps) return EditorState.createEmpty();

  // كائن Draft.js
  if (isDraftContentState(steps)) {
    try {
      const contentState = convertFromRaw(steps);
      return EditorState.createWithContent(contentState);
    } catch {
      return EditorState.createEmpty();
    }
  }

  // مصفوفة نصوص (منشورات قديمة) → تحويل إلى Draft.js blocks
  if (Array.isArray(steps) && steps.length > 0) {
    try {
      const rawContent: RawDraftContentState = {
        blocks: steps.map((text, i) => ({
          key: `step-${i}`,
          text: String(text),
          type: 'ordered-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {},
        })),
        entityMap: {},
      };
      const contentState = convertFromRaw(rawContent);
      return EditorState.createWithContent(contentState);
    } catch {
      return EditorState.createEmpty();
    }
  }

  return EditorState.createEmpty();
};

/** بناء رابط صورة كامل من imageUrl النسبي */
const buildImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_URL}${imageUrl}`;
};

const UpdatePost: FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const [presentToast] = useIonToast();
  const { takePhoto, blobUrl, clearPhoto } = usePhotoGallery();

  // ─── حالة التحميل ───
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // ─── حالات النموذج ───
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [stepsJson, setStepsJson] = useState('');
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [location, setLocation] = useState<LocationData>({ country: '', region: '' });

  // ─── إدارة الصور ───
  // الصور الحالية من السيرفر
  const [existingImages, setExistingImages] = useState<PostImage[]>([]);
  // IDs الصور التي يريد المستخدم حذفها
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  // الصور الجديدة (blob URLs من الكاميرا/المعرض)
  const [newPhotos, setNewPhotos] = useState<string[]>([]);

  // ─── حالات واجهة المستخدم ───
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  // ─── الصور الحالية المتبقية (بعد استثناء المحذوفة) ───
  const remainingExistingImages = existingImages.filter((img) => !deletedImageIds.includes(img.id));

  // العدد الكلي للصور (حالية متبقية + جديدة)
  const totalImagesCount = remainingExistingImages.length + newPhotos.length;

  // ─── جلب بيانات المنشور الحالي ───
  const fetchPost = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(false);

      const { data } = await api.get(GET_POST_BY_ID(id));
      const post: PostDetail = data.post;

      // التحقق من ملكية المنشور
      if (user && post.UserId !== user.id) {
        presentToast({
          message: 'لا يمكنك تعديل هذا المنشور',
          duration: 3000,
          color: 'danger',
          position: 'bottom',
        });
        history.replace('/tabs/home');
        return;
      }

      // تعبئة الحقول
      setTitle(post.title);
      setContent(post.content);
      setExistingImages(post.images ?? []);
      setLocation({
        country: post.country ?? '',
        region: post.region ?? '',
      });

      // تحويل steps إلى EditorState لمحرر Draft.js
      const initialEditorState = stepsToEditorState(post.steps);
      setEditorState(initialEditorState);
    } catch {
      setLoadError(true);
      presentToast({
        message: 'فشل تحميل بيانات المنشور',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, user, history, presentToast]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // ─── إضافة صور جديدة عبر الكاميرا/المعرض ───
  const handleTakePhoto = useCallback(
    async (source: CameraSource) => {
      if (totalImagesCount >= MAX_IMAGES) {
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
    [totalImagesCount, takePhoto, presentToast]
  );

  // إضافة الصورة الملتقطة تلقائياً
  if (blobUrl && !newPhotos.includes(blobUrl)) {
    setNewPhotos((prev) => [blobUrl, ...prev]);
    clearPhoto();
  }

  // ─── حذف صورة حالية (من السيرفر) ───
  const markImageForDeletion = useCallback((imageId: number) => {
    setDeletedImageIds((prev) => [...prev, imageId]);
  }, []);

  // ─── إلغاء حذف صورة حالية ───
  const unmarkImageForDeletion = useCallback((imageId: number) => {
    setDeletedImageIds((prev) => prev.filter((id) => id !== imageId));
  }, []);

  // ─── حذف صورة جديدة (blob) ───
  const removeNewPhoto = useCallback((index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
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

    if (totalImagesCount === 0) {
      return 'يجب بقاء صورة واحدة على الأقل';
    }

    return null;
  }, [title, content, totalImagesCount]);

  // ─── إرسال التعديل ───
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

      // خطوات التحضير كـ JSON string
      if (stepsJson) {
        formData.append('steps', stepsJson);
      }

      // الموقع الجغرافي
      if (location.country) {
        formData.append('country', location.country);
      }

      if (location.region) {
        formData.append('region', location.region);
      }

      // الصور المحذوفة — السيرفر يتوقع deletedImages كـ JSON string من IDs
      if (deletedImageIds.length > 0) {
        formData.append('deletedImages', JSON.stringify(deletedImageIds));
      }

      // الصور الجديدة — تحويل blob URLs إلى ملفات
      for (const photoUrl of newPhotos) {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const extension = blob.type.split('/')[1] || 'jpeg';
        formData.append('postImages', blob, `photo.${extension}`);
      }

      await api.put(UPDATE_POST(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // إشعار باقي الصفحات بالتغيير
      emitPostsChanged();

      presentToast({
        message: 'تم تحديث المنشور بنجاح',
        duration: 3000,
        color: 'success',
        position: 'bottom',
      });

      // العودة لصفحة المنشور
      history.replace(`/tabs/posts/${id}`);
    } catch (err: unknown) {
      console.error('فشل تعديل المنشور:', err);

      let errorMessage = 'فشل في تعديل المنشور، حاول مرة أخرى';
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
  }, [
    validate,
    title,
    content,
    stepsJson,
    location,
    deletedImageIds,
    newPhotos,
    id,
    history,
    presentToast,
  ]);

  // ─── معالج تغيير الموقع ───
  const handleLocationChange = useCallback((loc: LocationData) => {
    setLocation(loc);
  }, []);

  // ─── عرض تأكيد التعديل ───
  const confirmSubmit = useCallback(() => {
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

    setShowConfirmAlert(true);
  }, [validate, presentToast]);

  // ═══════════════════════════════════════════════
  // ─── واجهة المستخدم ───
  // ═══════════════════════════════════════════════

  return (
    <IonPage>
      {/* ─── تأكيد التعديل ─── */}
      <IonAlert
        isOpen={showConfirmAlert}
        onDidDismiss={() => setShowConfirmAlert(false)}
        header="تأكيد التعديل"
        message="أنت على وشك تعديل المنشور، هل تريد المتابعة؟"
        buttons={[
          {
            text: 'إلغاء',
            role: 'cancel',
          },
          {
            text: 'تعديل',
            handler: handleSubmit,
          },
        ]}
      />

      {/* ─── مؤشر الإرسال ─── */}
      <IonLoading isOpen={isSubmitting} message="جاري حفظ التعديلات..." />

      <Header title="تعديل منشور" />

      <IonContent className="ion-padding update-post-content">
        {/* ═══ حالة التحميل ═══ */}
        {isLoading && (
          <div className="update-post-skeleton">
            <IonSkeletonText
              animated
              style={{ width: '100%', height: '48px', marginBottom: '16px' }}
            />
            <IonSkeletonText
              animated
              style={{ width: '100%', height: '96px', marginBottom: '16px' }}
            />
            <IonSkeletonText
              animated
              style={{ width: '100%', height: '150px', marginBottom: '16px' }}
            />
            <IonSkeletonText animated style={{ width: '100%', height: '200px' }} />
          </div>
        )}

        {/* ═══ حالة خطأ التحميل ═══ */}
        {!isLoading && loadError && (
          <div className="update-post-error ion-text-center ion-padding">
            <IonText color="danger">
              <h3>فشل تحميل بيانات المنشور</h3>
              <p>تأكد من الاتصال بالإنترنت وحاول مرة أخرى</p>
            </IonText>
            <IonButton onClick={fetchPost} color="primary">
              إعادة المحاولة
            </IonButton>
          </div>
        )}

        {/* ═══ نموذج التعديل ═══ */}
        {!isLoading && !loadError && (
          <IonGrid className="form-container">
            <IonRow className="ion-justify-content-center">
              <IonCol size="12" sizeMd="10" sizeLg="8" sizeXl="6">
                <IonList className="update-post-list">
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
                  <div className="update-post-section">
                    <IonLabel color="primary" className="update-post-section-label">
                      خطوات التحضير
                    </IonLabel>
                    <TextEditor
                      onChange={setStepsJson}
                      editorState={editorState}
                      onEditorStateChange={setEditorState}
                    />
                  </div>

                  {/* ═══ إدارة الصور ═══ */}
                  <div className="update-post-section">
                    <IonLabel color="primary" className="update-post-section-label">
                      الصور * (يجب بقاء صورة واحدة على الأقل)
                    </IonLabel>

                    {/* ── الصور الحالية من السيرفر ── */}
                    {existingImages.length > 0 && (
                      <div className="update-post-existing-images">
                        <IonText color="medium" className="update-post-images-subtitle">
                          الصور الحالية
                        </IonText>
                        <div className="update-post-thumbnails">
                          {existingImages.map((img) => {
                            const isDeleted = deletedImageIds.includes(img.id);
                            return (
                              <div
                                key={img.id}
                                className={`update-post-thumbnail ${isDeleted ? 'update-post-thumbnail--deleted' : ''}`}
                              >
                                <IonImg src={buildImageUrl(img.imageUrl)} alt={`صورة ${img.id}`} />
                                {isDeleted ? (
                                  <IonButton
                                    fill="clear"
                                    className="update-post-thumbnail-action"
                                    onClick={() => unmarkImageForDeletion(img.id)}
                                    title="إلغاء الحذف"
                                  >
                                    <IonIcon icon={arrowUndoCircle} color="light" />
                                  </IonButton>
                                ) : (
                                  <IonButton
                                    fill="clear"
                                    className="update-post-thumbnail-action"
                                    onClick={() => markImageForDeletion(img.id)}
                                    title="حذف الصورة"
                                  >
                                    <IonIcon icon={closeCircle} color="light" />
                                  </IonButton>
                                )}
                                {isDeleted && (
                                  <div className="update-post-thumbnail-overlay">
                                    <IonText color="light">محذوفة</IonText>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── أزرار إضافة صورة جديدة ── */}
                    <div className="update-post-photo-buttons">
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

                    {/* ── الصور الجديدة المضافة ── */}
                    {newPhotos.length > 0 && (
                      <div className="update-post-new-images">
                        <IonText color="medium" className="update-post-images-subtitle">
                          صور جديدة
                        </IonText>
                        <Swiper
                          className="update-post-swiper"
                          modules={[Pagination, Navigation]}
                          pagination={{ clickable: true }}
                          navigation
                          spaceBetween={10}
                          loop={newPhotos.length > 1}
                        >
                          {newPhotos.map((imgUrl, index) => (
                            <SwiperSlide key={`new-${imgUrl}-${index}`}>
                              <div className="update-post-slide">
                                <IonImg src={imgUrl} alt={`صورة جديدة ${index + 1}`} />
                                <IonButton
                                  fill="clear"
                                  className="update-post-remove-photo"
                                  onClick={() => removeNewPhoto(index)}
                                >
                                  <IonIcon icon={closeCircle} color="light" />
                                </IonButton>
                                <span className="update-post-photo-counter">
                                  {index + 1} / {newPhotos.length}
                                </span>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                    )}

                    {/* ── زر مسح جميع الصور الجديدة ── */}
                    {newPhotos.length > 0 && (
                      <IonButton
                        fill="clear"
                        color="danger"
                        size="small"
                        className="update-post-clear-photos"
                        onClick={() => setNewPhotos([])}
                      >
                        <IonIcon icon={trashOutline} slot="start" />
                        مسح الصور الجديدة ({newPhotos.length})
                      </IonButton>
                    )}

                    {/* ── ملخص الصور ── */}
                    <IonText
                      color={totalImagesCount === 0 ? 'danger' : 'medium'}
                      className="update-post-images-summary"
                    >
                      <p>
                        إجمالي الصور بعد التعديل: {totalImagesCount}
                        {deletedImageIds.length > 0 && ` (سيتم حذف ${deletedImageIds.length} صورة)`}
                      </p>
                    </IonText>
                  </div>

                  {/* ═══ الموقع الجغرافي ═══ */}
                  <div className="update-post-section">
                    <IonLabel color="primary" className="update-post-section-label">
                      الموقع الجغرافي
                    </IonLabel>
                    <LocationPicker onLocationChange={handleLocationChange} />
                  </div>

                  {/* ═══ زر حفظ التعديلات ═══ */}
                  <div className="update-post-submit">
                    <IonButton
                      expand="block"
                      color="primary"
                      onClick={confirmSubmit}
                      disabled={isSubmitting}
                      strong
                    >
                      حفظ التعديلات
                    </IonButton>
                  </div>
                </IonList>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default UpdatePost;
