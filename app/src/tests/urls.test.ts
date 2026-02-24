/**
 * اختبارات الروابط (URL Constants)
 * ═══════════════════════════════════
 *
 * تتحقق من:
 *  1. جميع الروابط الثابتة تطابق مسارات السيرفر
 *  2. الدوال المولّدة للروابط (مع معرّفات) تُنتج المسارات الصحيحة
 *  3. عدم وجود شرطة مائلة بداية (/) — Axios يضيفها تلقائياً مع baseURL
 *  4. تغطية جميع نقاط النهاية المُعرَّفة في السيرفر
 *
 * الملف: app/src/tests/urls.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  API_URL,
  REGISTER_URL,
  LOGIN_URL,
  PROFILE_URL,
  PROFILE_UPDATE_INFO_URL,
  PROFILE_UPDATE_IMAGE_URL,
  PROFILE_RESET_IMAGE_URL,
  PROFILE_DELETE_URL,
  GET_ALL_POSTS,
  GET_MY_POSTS,
  CREATE_POST,
  GET_POST_BY_ID,
  UPDATE_POST,
  DELETE_POST,
  GET_MY_COMMENTS,
  ADD_COMMENT,
  UPDATE_COMMENT,
  DELETE_COMMENT,
  TOGGLE_LIKE,
  GET_MY_LIKES,
  GET_POST_LIKES,
} from '../config/urls';

describe('ثوابت الروابط (URL Constants)', () => {
  // ─── مسارات المصادقة (/account) ───

  describe('مسارات الحساب', () => {
    it('يجب أن يكون مسار التسجيل صحيحاً', () => {
      expect(REGISTER_URL).toBe('account/register');
    });

    it('يجب أن يكون مسار تسجيل الدخول صحيحاً', () => {
      expect(LOGIN_URL).toBe('account/login');
    });

    it('يجب أن يكون مسار الملف الشخصي صحيحاً', () => {
      expect(PROFILE_URL).toBe('account/profile');
    });

    it('يجب أن تكون مسارات تحديث الملف الشخصي صحيحة', () => {
      expect(PROFILE_UPDATE_INFO_URL).toBe('account/profile/info');
      expect(PROFILE_UPDATE_IMAGE_URL).toBe('account/profile/image');
      expect(PROFILE_RESET_IMAGE_URL).toBe('account/profile/image/reset');
    });

    it('يجب أن يكون مسار حذف الحساب صحيحاً', () => {
      expect(PROFILE_DELETE_URL).toBe('account/profile');
    });
  });

  // ─── مسارات المنشورات (/posts) ───

  describe('مسارات المنشورات', () => {
    it('يجب أن تكون المسارات الثابتة صحيحة', () => {
      expect(GET_ALL_POSTS).toBe('posts');
      expect(GET_MY_POSTS).toBe('posts/me');
      expect(CREATE_POST).toBe('posts/create');
    });

    it('يجب أن تُنشئ دوال المسارات الديناميكية الرابط الصحيح', () => {
      expect(GET_POST_BY_ID(1)).toBe('posts/1');
      expect(GET_POST_BY_ID('42')).toBe('posts/42');
      expect(UPDATE_POST(5)).toBe('posts/5');
      expect(DELETE_POST(10)).toBe('posts/10');
    });
  });

  // ─── مسارات التعليقات (/comments) ───

  describe('مسارات التعليقات', () => {
    it('يجب أن يكون مسار تعليقاتي صحيحاً', () => {
      expect(GET_MY_COMMENTS).toBe('comments/me');
    });

    it('يجب أن تُنشئ دوال المسارات الديناميكية الرابط الصحيح', () => {
      expect(ADD_COMMENT(1)).toBe('comments/1');
      expect(UPDATE_COMMENT(5)).toBe('comments/5');
      expect(DELETE_COMMENT(10)).toBe('comments/10');
    });
  });

  // ─── مسارات الإعجابات (/likes) ───

  describe('مسارات الإعجابات', () => {
    it('يجب أن يكون مسار إعجاباتي صحيحاً', () => {
      expect(GET_MY_LIKES).toBe('likes/me');
    });

    it('يجب أن تُنشئ دوال المسارات الديناميكية الرابط الصحيح', () => {
      expect(TOGGLE_LIKE(1)).toBe('likes/1');
      expect(GET_POST_LIKES(5)).toBe('likes/5');
    });
  });

  // ─── قواعد عامة ───

  describe('قواعد التنسيق', () => {
    const allStaticUrls = [
      REGISTER_URL,
      LOGIN_URL,
      PROFILE_URL,
      PROFILE_UPDATE_INFO_URL,
      PROFILE_UPDATE_IMAGE_URL,
      PROFILE_RESET_IMAGE_URL,
      PROFILE_DELETE_URL,
      GET_ALL_POSTS,
      GET_MY_POSTS,
      CREATE_POST,
      GET_MY_COMMENTS,
      GET_MY_LIKES,
    ];

    it('يجب ألا تبدأ أي رابط ثابت بـ / (Axios يضيفها)', () => {
      allStaticUrls.forEach((url) => {
        expect(url).not.toMatch(/^\//);
      });
    });

    it('يجب ألا تنتهي أي رابط بـ /', () => {
      allStaticUrls.forEach((url) => {
        expect(url).not.toMatch(/\/$/);
      });
    });
  });

  describe('عنوان API', () => {
    it('يجب أن يكون API_URL معرّفاً', () => {
      expect(API_URL).toBeDefined();
      expect(typeof API_URL).toBe('string');
    });
  });
});
