import express from 'express';
import * as controller from '../controllers/user.controller.js';
import * as validator from '../validators/user.validator.js';
import * as middleware from '../middlewares/user.middleware.js';
import { validateRequest } from '../middlewares/validator.middleware.js';
import { upload } from '../utilities/files.js';

const router = express.Router();

router.post('/register', validator.register, validateRequest, controller.register);

router.post('/login', validator.login, validateRequest, controller.login);

router.get('/profile', middleware.isAuthenticated, controller.getProfile);

router.put(
  '/profile/image',
  middleware.isAuthenticated,
  upload.single('profileImage'),
  controller.updateImage
);

router.put('/profile/image/reset', middleware.isAuthenticated, controller.resetImage);

router.put(
  '/profile/info',
  middleware.isAuthenticated,
  validator.updateInfo,
  validateRequest,
  controller.updateInfo
);

router.delete('/profile', middleware.isAuthenticated, controller.deleteUser);

export default router;
