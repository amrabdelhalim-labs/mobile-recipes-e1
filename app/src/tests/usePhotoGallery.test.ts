/**
 * اختبارات هوك الكاميرا (usePhotoGallery)
 * ══════════════════════════════════════════
 *
 * تتحقق من:
 *  1. الحالة الأولية: blobUrl يكون undefined
 *  2. takePhoto يُحدّث blobUrl بنجاح
 *  3. clearPhoto يمسح blobUrl ويعيده لـ undefined
 *  4. معالجة أخطاء الكاميرا (إغلاق بدون اختيار)
 *
 * الملف: app/src/__tests__/usePhotoGallery.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import { Camera } from '@capacitor/camera';

// Camera مُحاكاة (mock) في setupTests.ts

describe('هوك الكاميرا (usePhotoGallery)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('يجب أن يبدأ بـ blobUrl = undefined', () => {
        const { result } = renderHook(() => usePhotoGallery());
        expect(result.current.blobUrl).toBeUndefined();
    });

    it('يجب أن يُحدّث blobUrl بعد التقاط صورة بنجاح', async () => {
        const mockWebPath = 'blob:http://localhost/test-photo';
        vi.mocked(Camera.getPhoto).mockResolvedValueOnce({
            webPath: mockWebPath,
            format: 'jpeg',
            saved: false,
        });

        const { result } = renderHook(() => usePhotoGallery());

        await act(async () => {
            await result.current.takePhoto('CAMERA' as never);
        });

        expect(result.current.blobUrl).toBe(mockWebPath);
    });

    it('يجب أن يمسح clearPhoto الـ blobUrl', async () => {
        const mockWebPath = 'blob:http://localhost/test-photo';
        vi.mocked(Camera.getPhoto).mockResolvedValueOnce({
            webPath: mockWebPath,
            format: 'jpeg',
            saved: false,
        });

        const { result } = renderHook(() => usePhotoGallery());

        // التقاط صورة أولاً
        await act(async () => {
            await result.current.takePhoto('CAMERA' as never);
        });
        expect(result.current.blobUrl).toBe(mockWebPath);

        // مسح الصورة
        act(() => {
            result.current.clearPhoto();
        });
        expect(result.current.blobUrl).toBeUndefined();
    });

    it('يجب ألا يُعطّل التطبيق عند إغلاق الكاميرا بدون اختيار', async () => {
        vi.mocked(Camera.getPhoto).mockRejectedValueOnce(new Error('User cancelled'));

        const { result } = renderHook(() => usePhotoGallery());

        await act(async () => {
            await result.current.takePhoto('CAMERA' as never);
        });

        // يجب أن يبقى blobUrl = undefined
        expect(result.current.blobUrl).toBeUndefined();
    });
});
