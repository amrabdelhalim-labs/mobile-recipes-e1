/**
 * أحداث تحديث المنشورات
 * ──────────────────────
 * تستخدم لتحديث قوائم المنشورات عند أي تغيير (إعجاب/تعليق/تعديل/حذف)
 */

export const POSTS_CHANGED_EVENT = 'posts:changed';

export const emitPostsChanged = () => {
  window.dispatchEvent(new CustomEvent(POSTS_CHANGED_EVENT));
};

export const onPostsChanged = (handler: () => void) => {
  const listener = () => handler();
  window.addEventListener(POSTS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(POSTS_CHANGED_EVENT, listener);
};
