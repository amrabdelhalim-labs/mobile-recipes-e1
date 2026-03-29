import { body } from 'express-validator';

const addComment = [
  body('text')
    .notEmpty()
    .withMessage('نص التعليق مطلوب')
    .isString()
    .withMessage('التعليق يجب أن يكون نصاً')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('التعليق يجب أن يكون بين 1 و 1000 حرف'),
];

const updateComment = [
  body('text')
    .notEmpty()
    .withMessage('نص التعليق مطلوب')
    .isString()
    .withMessage('التعليق يجب أن يكون نصاً')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('التعليق يجب أن يكون بين 1 و 1000 حرف'),
];

export { addComment, updateComment };
