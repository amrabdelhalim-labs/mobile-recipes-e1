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
