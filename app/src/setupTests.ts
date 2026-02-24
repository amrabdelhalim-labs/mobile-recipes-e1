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
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false;
      },
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
