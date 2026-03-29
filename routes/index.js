import express from 'express';
import userRouter from './user.routes.js';
import postRouter from './post.routes.js';
import commentRouter from './comment.routes.js';
import likeRouter from './like.routes.js';

const router = express.Router();

router.use('/account', userRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);
router.use('/likes', likeRouter);

export default router;
