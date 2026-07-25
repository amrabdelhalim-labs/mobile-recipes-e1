import { body } from 'express-validator';

const register = [
  body('name')
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 3 })
    .withMessage('يجب أن يكون الاسم 3 أحرف على الأقل'),
  body('email')
    .notEmpty()
    .withMessage('الإيميل مطلوب')
    .isEmail()
    .withMessage('صيغة الإيميل غير صحيحة'),
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
];

const login = [
  body('email')
    .notEmpty()
    .withMessage('الإيميل مطلوب')
    .isEmail()
    .withMessage('صيغة الإيميل غير صحيحة'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];

const updateInfo = [
  body('name')
    .optional({ checkFalsy: true })
    .isLength({ min: 3 })
    .withMessage('يجب أن يكون الاسم 3 أحرف على الأقل'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
];

export { register, login, updateInfo };
