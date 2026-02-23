/**
 * اختبارات أنواع TypeScript — التحقق من مطابقة الأنواع للسيرفر
 * ══════════════════════════════════════════════════════════════
 *
 * تتحقق من:
 *  1. هيكل واجهة Post تتطابق مع استجابة السيرفر
 *  2. هيكل واجهة PostDetail يتضمن التعليقات الكاملة
 *  3. واجهة Pagination تحتوي على جميع الحقول المطلوبة
 *  4. واجهة UserProfile تطابق بيانات المستخدم من السيرفر
 *  5. PostSteps تدعم كلاً من التنسيق القديم (string[]) والجديد (Draft.js)
 *
 * الملف: app/src/__tests__/types.test.ts
 */
import { describe, it, expect } from 'vitest';
import type { Post, PostDetail, PostImage, PostComment, PostCommentRef, Pagination, PostsResponse, PostSteps } from '../types/post.types';
import type { UserProfile, UserBasic } from '../types/user.types';

describe('أنواع المنشورات (Post Types)', () => {
    // ─── بيانات اختبار نموذجية تطابق استجابة السيرفر ───

    const mockUser: UserBasic = {
        id: 1,
        name: 'أحمد',
        ImageUrl: '/images/default-profile.svg',
    };

    const mockImage: PostImage = {
        id: 1,
        imageUrl: '/uploads/photos/recipe1.jpg',
    };

    const mockCommentRef: PostCommentRef = { id: 1 };

    const mockComment: PostComment = {
        id: 1,
        text: 'وصفة رائعة!',
        createdAt: '2026-02-23T10:00:00.000Z',
        UserId: 2,
        PostId: 1,
        User: { id: 2, name: 'سارة', ImageUrl: '/images/default-profile.svg' },
    };

    it('يجب أن يتطابق هيكل Post مع استجابة السيرفر (getAllPosts/getMyPosts)', () => {
        const post: Post = {
            id: 1,
            title: 'كبسة لحم',
            content: 'أرز بسمتي، لحم ضأن، بهارات كبسة',
            steps: null,
            country: 'السعودية',
            region: 'الرياض',
            createdAt: '2026-02-23T10:00:00.000Z',
            updatedAt: '2026-02-23T10:00:00.000Z',
            UserId: 1,
            User: mockUser,
            images: [mockImage],
            Comments: [mockCommentRef],
            likesCount: 5,
            isLiked: true,
        };

        expect(post.id).toBe(1);
        expect(post.User.name).toBe('أحمد');
        expect(post.images).toHaveLength(1);
        expect(post.images[0].imageUrl).toContain('recipe1');
        expect(post.likesCount).toBe(5);
        expect(post.isLiked).toBe(true);
    });

    it('يجب أن يتضمن PostDetail التعليقات الكاملة (getPostById)', () => {
        const postDetail: PostDetail = {
            id: 1,
            title: 'كبسة لحم',
            content: 'المكوّنات',
            steps: null,
            country: null,
            region: null,
            createdAt: '2026-02-23T10:00:00.000Z',
            updatedAt: '2026-02-23T10:00:00.000Z',
            UserId: 1,
            User: mockUser,
            images: [mockImage],
            Comments: [mockComment],
            likesCount: 0,
            isLiked: false,
        };

        // التحقق من أن التعليقات تحتوي على بيانات كاملة
        expect(postDetail.Comments[0].text).toBe('وصفة رائعة!');
        expect(postDetail.Comments[0].User.name).toBe('سارة');
        expect(postDetail.Comments[0].UserId).toBe(2);
    });

    it('يجب أن يدعم PostSteps التنسيق القديم (string[])', () => {
        const oldSteps: PostSteps = ['اغسل الأرز', 'اطبخ اللحم', 'اخلطهما معًا'];
        expect(Array.isArray(oldSteps)).toBe(true);
        expect(oldSteps).toHaveLength(3);
    });

    it('يجب أن يدعم PostSteps التنسيق الجديد (Draft.js RawDraftContentState)', () => {
        const draftSteps: PostSteps = {
            blocks: [
                { key: '1', text: 'اغسل الأرز', type: 'ordered-list-item', depth: 0, inlineStyleRanges: [], entityRanges: [], data: {} },
                { key: '2', text: 'اطبخ اللحم', type: 'ordered-list-item', depth: 0, inlineStyleRanges: [], entityRanges: [], data: {} },
            ],
            entityMap: {},
        };

        // التحقق من أنه كائن Draft.js صالح
        expect('blocks' in draftSteps).toBe(true);
        expect(Array.isArray(draftSteps)).toBe(false);
    });

    it('يجب أن تحتوي Pagination على جميع الحقول المطلوبة', () => {
        const pagination: Pagination = {
            currentPage: 1,
            totalPages: 5,
            totalPosts: 47,
            limit: 10,
        };

        expect(pagination.currentPage).toBe(1);
        expect(pagination.totalPages).toBe(5);
        expect(pagination.totalPosts).toBe(47);
        expect(pagination.limit).toBe(10);
    });

    it('يجب أن تتطابق PostsResponse مع استجابة getAllPosts', () => {
        const response: PostsResponse = {
            posts: [],
            pagination: { currentPage: 1, totalPages: 0, totalPosts: 0, limit: 10 },
        };

        expect(response).toHaveProperty('posts');
        expect(response).toHaveProperty('pagination');
        expect(Array.isArray(response.posts)).toBe(true);
    });
});

describe('أنواع المستخدمين (User Types)', () => {
    it('يجب أن يتطابق UserProfile مع استجابة السيرفر (GET /account/profile)', () => {
        const profile: UserProfile = {
            id: 1,
            name: 'أحمد محمد',
            email: 'ahmed@example.com',
            ImageUrl: '/images/default-profile.svg',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-02-23T10:00:00.000Z',
        };

        expect(profile.id).toBe(1);
        expect(profile.email).toContain('@');
        // التحقق من أن كلمة المرور غير موجودة
        expect(profile).not.toHaveProperty('password');
    });

    it('يجب أن يحتوي UserBasic على الحقول المطلوبة فقط', () => {
        const user: UserBasic = {
            id: 1,
            name: 'أحمد',
            ImageUrl: '/images/default-profile.svg',
        };

        expect(Object.keys(user)).toHaveLength(3);
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('ImageUrl');
    });
});
