import { body } from 'express-validator';

const newPost = [
    body('title')
        .notEmpty().withMessage('العنوان مطلوب')
        .isString().withMessage('العنوان يجب أن يكون نصاً')
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('العنوان يجب أن يكون بين 3 و 200 حرف'),
    body('content')
        .notEmpty().withMessage('المحتوى مطلوب')
        .isString().withMessage('المحتوى يجب أن يكون نصاً')
        .trim()
        .isLength({ min: 10 }).withMessage('المحتوى يجب أن يكون 10 أحرف على الأقل'),
    body('steps')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    // Accepts array or Draft.js object (contains blocks)
                    if (!Array.isArray(parsed) && (typeof parsed !== 'object' || parsed === null)) {
                        throw new Error('الخطوات يجب أن تكون بصيغة صحيحة');
                    }
                } catch (e) {
                    if (e.message === 'الخطوات يجب أن تكون بصيغة صحيحة') throw e;
                    throw new Error('صيغة الخطوات غير صحيحة');
                }
            } else if (value !== undefined && value !== null && !Array.isArray(value) && typeof value !== 'object') {
                throw new Error('الخطوات يجب أن تكون بصيغة صحيحة');
            }
            return true;
        }),
    body('country')
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage('الدولة يجب أن تكون نصاً')
        .trim()
        .isLength({ max: 100 }).withMessage('اسم الدولة طويل جداً'),
    body('region')
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage('المنطقة يجب أن تكون نصاً')
        .trim()
        .isLength({ max: 100 }).withMessage('اسم المنطقة طويل جداً'),
];

const updatePost = [
    body('title')
        .optional()
        .isString().withMessage('العنوان يجب أن يكون نصاً')
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('العنوان يجب أن يكون بين 3 و 200 حرف'),
    body('content')
        .optional()
        .isString().withMessage('المحتوى يجب أن يكون نصاً')
        .trim()
        .isLength({ min: 10 }).withMessage('المحتوى يجب أن يكون 10 أحرف على الأقل'),
    body('steps')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed) && (typeof parsed !== 'object' || parsed === null)) {
                        throw new Error('الخطوات يجب أن تكون بصيغة صحيحة');
                    }
                } catch (e) {
                    if (e.message === 'الخطوات يجب أن تكون بصيغة صحيحة') throw e;
                    throw new Error('صيغة الخطوات غير صحيحة');
                }
            } else if (value !== undefined && value !== null && !Array.isArray(value) && typeof value !== 'object') {
                throw new Error('الخطوات يجب أن تكون بصيغة صحيحة');
            }
            return true;
        }),
    body('country')
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage('الدولة يجب أن تكون نصاً')
        .trim()
        .isLength({ max: 100 }).withMessage('اسم الدولة طويل جداً'),
    body('region')
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage('المنطقة يجب أن تكون نصاً')
        .trim()
        .isLength({ max: 100 }).withMessage('اسم المنطقة طويل جداً'),
    body('deletedImages')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) {
                        throw new Error('صيغة الصور المحذوفة غير صحيحة');
                    }
                } catch {
                    throw new Error('صيغة الصور المحذوفة غير صحيحة');
                }
            } else if (value !== undefined && value !== null && !Array.isArray(value)) {
                throw new Error('صيغة الصور المحذوفة غير صحيحة');
            }
            return true;
        }),
];

export { newPost, updatePost };
