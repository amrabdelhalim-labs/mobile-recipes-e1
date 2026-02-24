import express from 'express';
import * as controller from '../controllers/post.controller.js';
import * as validator from '../validators/post.validator.js';
import * as middleware from '../middlewares/user.middleware.js';
import { validateRequest } from '../middlewares/validator.middleware.js';
import { upload } from '../utilities/files.js';

const router = express.Router();

router.post(
  '/create',
  middleware.isAuthenticated,
  upload.array('postImages', 10),
  validator.newPost,
  validateRequest,
  controller.newPost
);

router.get('/', middleware.isAuthenticated, controller.getAllPosts);

router.get('/me', middleware.isAuthenticated, controller.getMyPosts);

router.get('/:id', middleware.isAuthenticated, controller.getPostById);

router.put(
  '/:id',
  middleware.isAuthenticated,
  upload.array('postImages', 10),
  validator.updatePost,
  validateRequest,
  controller.updatePost
);

router.delete('/:id', middleware.isAuthenticated, controller.deletePost);

export default router;
