/**
 * أنواع TypeScript الخاصة بالمستخدمين
 * ───────────────────────────────────────
 * مطابقة لما يرجعه السيرفر في models/users.model.js
 *
 * السيرفر يُرجع:
 * - GET /account/profile → { user: UserProfile }
 * - جميع endpoints المتعلقة بالمستخدمين تُرجع البيانات بدون password
 */

/** بيانات المستخدم الكاملة (بدون كلمة المرور) */
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  ImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

/** بيانات المستخدم المختصرة (تُستخدم في المنشورات والتعليقات) */
export interface UserBasic {
  id: number;
  name: string;
  ImageUrl: string;
}
