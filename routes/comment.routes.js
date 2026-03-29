import express from 'express';
import * as controller from '../controllers/comment.controller.js';
import * as validator from '../validators/comment.validator.js';
import * as middleware from '../middlewares/user.middleware.js';
import { validateRequest } from '../middlewares/validator.middleware.js';

const router = express.Router();

router.get('/me', middleware.isAuthenticated, controller.getMyComments);

router.post(
  '/:postId',
  middleware.isAuthenticated,
  validator.addComment,
  validateRequest,
  controller.addComment
);

router.put(
  '/:id',
  middleware.isAuthenticated,
  validator.updateComment,
  validateRequest,
  controller.updateComment
);

router.delete('/:id', middleware.isAuthenticated, controller.deleteComment);

export default router;
