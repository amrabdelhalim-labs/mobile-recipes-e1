/**
 * اختبارات أحداث المنشورات (Posts Events)
 * ══════════════════════════════════════════
 *
 * تتحقق من:
 *  1. إطلاق حدث تحديث المنشورات (emitPostsChanged)
 *  2. الاستماع للحدث وتنفيذ المعالج (onPostsChanged)
 *  3. إلغاء الاشتراك عند استدعاء الدالة المُرجعة (cleanup)
 *  4. عدم تنفيذ المعالج بعد إلغاء الاشتراك
 *
 * الملف: app/src/tests/postsEvents.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitPostsChanged, onPostsChanged, POSTS_CHANGED_EVENT } from '../utils/postsEvents';

describe('أحداث تحديث المنشورات (Posts Events)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('يجب أن يطلق emitPostsChanged حدث CustomEvent', () => {
        const spy = vi.fn();
        window.addEventListener(POSTS_CHANGED_EVENT, spy);

        emitPostsChanged();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0]).toBeInstanceOf(CustomEvent);

        // تنظيف
        window.removeEventListener(POSTS_CHANGED_EVENT, spy);
    });

    it('يجب أن يستقبل onPostsChanged الأحداث المُطلقة', () => {
        const handler = vi.fn();
        const cleanup = onPostsChanged(handler);

        emitPostsChanged();
        emitPostsChanged();
        emitPostsChanged();

        expect(handler).toHaveBeenCalledTimes(3);

        // تنظيف
        cleanup();
    });

    it('يجب أن يُلغي الاشتراك عند استدعاء cleanup', () => {
        const handler = vi.fn();
        const cleanup = onPostsChanged(handler);

        // إطلاق حدث قبل الإلغاء
        emitPostsChanged();
        expect(handler).toHaveBeenCalledTimes(1);

        // إلغاء الاشتراك
        cleanup();

        // إطلاق حدث بعد الإلغاء — لا ينبغي استقباله
        emitPostsChanged();
        expect(handler).toHaveBeenCalledTimes(1); // لم يزد
    });

    it('يجب أن يدعم عدة مستمعين في وقت واحد', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        const cleanup1 = onPostsChanged(handler1);
        const cleanup2 = onPostsChanged(handler2);

        emitPostsChanged();

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);

        // إلغاء المستمع الأول فقط
        cleanup1();
        emitPostsChanged();

        expect(handler1).toHaveBeenCalledTimes(1); // لم يزد
        expect(handler2).toHaveBeenCalledTimes(2); // زاد

        // تنظيف
        cleanup2();
    });

    it('يجب أن يكون اسم الحدث صحيحاً', () => {
        expect(POSTS_CHANGED_EVENT).toBe('posts:changed');
    });
});
