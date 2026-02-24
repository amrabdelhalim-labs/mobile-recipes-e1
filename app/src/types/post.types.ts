/**
 * أنواع TypeScript الخاصة بالمنشورات
 * مطابقة لما يرجعه السيرفر في controllers/post.controller.js
 *
 * السيرفر يُرجع:
 * - getAllPosts / getMyPosts → { posts: Post[], pagination: Pagination }
 * - كل منشور يحتوي على: User, images[], Comments[] (ids فقط), likesCount, isLiked
 *
 * ملاحظة عن steps:
 * - المنشورات القديمة: steps = string[] (مصفوفة نصوص)
 * - المنشورات الجديدة: steps = RawDraftContentState (كائن Draft.js)
 * - يُحدد النوع تلقائياً عند العرض عبر فحص وجود خاصية 'blocks'
 */

import type { RawDraftContentState } from 'draft-js';
import type { UserBasic } from './user.types';

// إعادة تصدير لسهولة الاستخدام
export type PostUser = UserBasic;

/** صورة مرفقة بالمنشور */
export interface PostImage {
  id: number;
  imageUrl: string;
}

/** تعليق مختصر (id فقط — يُستخدم لحساب العدد في القوائم) */
export interface PostCommentRef {
  id: number;
}

/** تعليق كامل كما يرجعه السيرفر في getPostById */
export interface PostComment {
  id: number;
  text: string;
  createdAt: string;
  UserId: number;
  PostId: number;
  User: PostUser;
}

/**
 * خطوات التحضير — يمكن أن تكون:
 *  - مصفوفة نصوص (المنشورات القديمة)
 *  - كائن Draft.js RawDraftContentState (المنشورات الجديدة)
 */
export type PostSteps = string[] | RawDraftContentState;

/** المنشور كما يرجعه السيرفر في قوائم getAllPosts / getMyPosts */
export interface Post {
  id: number;
  title: string;
  content: string;
  steps: PostSteps | null;
  country: string | null;
  region: string | null;
  createdAt: string;
  updatedAt: string;
  UserId: number;
  User: PostUser;
  images: PostImage[];
  Comments: PostCommentRef[];
  likesCount: number;
  isLiked: boolean;
}

/** المنشور الكامل كما يرجعه السيرفر في getPostById (التعليقات كاملة) */
export interface PostDetail extends Omit<Post, 'Comments'> {
  Comments: PostComment[];
}

/** بيانات التصفّح (Pagination) المرجعة من السيرفر */
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  limit: number;
}

/** الاستجابة الكاملة لـ getAllPosts / getMyPosts */
export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
}
