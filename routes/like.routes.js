import express from 'express';
import * as controller from '../controllers/like.controller.js';
import * as middleware from '../middlewares/user.middleware.js';

const router = express.Router();

router.post('/:postId', middleware.isAuthenticated, controller.toggleLike);

router.get('/me', middleware.isAuthenticated, controller.getMyLikes);

router.get('/:postId', middleware.isAuthenticated, controller.getPostLikes);

export default router;
