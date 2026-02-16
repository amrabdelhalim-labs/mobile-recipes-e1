/**
 * مكون الموقع الجغرافي (GetLocation)
 * ────────────────────────────────────
 * يستخدم Capacitor Geolocation API لجلب إحداثيات المستخدم الحالية،
 * ثم يستعلم من OpenStreetMap Nominatim API لتحويل الإحداثيات لأسماء
 * (الدولة والمنطقة) باللغة العربية.
 *
 * الخصائص (Props):
 *  - onLocationChange: دالة تُستدعى عند نجاح جلب الموقع
 *    تُمرر لها {country, region}
 *
 * السلوك:
 *  - يعرض حالة "جاري الجلب..." أثناء التحميل
 *  - يعرض الموقع المُكتشف بعد النجاح
 *  - يعرض رسالة خطأ في حال الفشل
 */
import { useEffect, useState, useCallback, type FC } from 'react';
import { IonItem, IonLabel, IonInput, IonSpinner, IonText, useIonViewWillEnter } from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import axios from 'axios';

/* ─── بيانات الموقع ─── */
export interface LocationData {
    country: string;
    region: string;
}

interface GetLocationProps {
    /** دالة تُستدعى عند تحديد الموقع بنجاح */
    onLocationChange: (location: LocationData) => void;
}

/* ─── حالات المكون ─── */
type LocationStatus = 'loading' | 'success' | 'error';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

const GetLocation: FC<GetLocationProps> = ({ onLocationChange }) => {
    const [country, setCountry] = useState('جاري جلب الدولة ...');
    const [region, setRegion] = useState('جاري جلب المنطقة ...');
    const [status, setStatus] = useState<LocationStatus>('loading');

    /** جلب الموقع الحالي وتحويل الإحداثيات إلى أسماء */
    const fetchLocation = useCallback(async () => {
        try {
            setStatus('loading');

            const coordinates = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000
            });
            const { latitude, longitude } = coordinates.coords;

            const response = await axios.get(NOMINATIM_URL, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                    'accept-language': 'ar',
                },
            });

            const address = response.data?.address;
            const detectedCountry = address?.country ?? '';
            const detectedRegion = address?.state ?? address?.region ?? '';

            setCountry(detectedCountry);
            setRegion(detectedRegion);
            setStatus('success');

            onLocationChange({
                country: detectedCountry,
                region: detectedRegion,
            });
        } catch (error) {
            console.error('فشل في جلب الموقع:', error);
            setCountry('');
            setRegion('');
            setStatus('error');

            onLocationChange({ country: '', region: '' });
        }
    }, [onLocationChange]);

    useEffect(() => {
        fetchLocation();
    }, [fetchLocation]);

    // إعادة جلب الموقع في كل مرة يتم الدخول للصفحة
    useIonViewWillEnter(() => {
        fetchLocation();
    });

    return (
        <>
            <IonItem>
                <IonLabel color="primary">الدولة</IonLabel>
                {status === 'loading' ? (
                    <IonSpinner slot="end" name="dots" />
                ) : (
                    <IonInput disabled value={country} className="ion-text-end" />
                )}
            </IonItem>
            <IonItem>
                <IonLabel color="primary">المنطقة</IonLabel>
                {status === 'loading' ? (
                    <IonSpinner slot="end" name="dots" />
                ) : (
                    <IonInput disabled value={region} className="ion-text-end" />
                )}
            </IonItem>
            {status === 'error' && (
                <IonText color="warning" className="ion-padding-start ion-padding-top">
                    <p style={{ fontSize: '0.8rem' }}>تعذر جلب الموقع — يمكنك المتابعة بدون موقع</p>
                </IonText>
            )}
        </>
    );
};

export default GetLocation;
