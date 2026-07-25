import { getRepositoryManager } from '../repositories/index.js';

const toggleLike = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const postId = parseInt(req.params.postId);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'معرف المنشور غير صالح' });
    }

    const repositories = getRepositoryManager();
    const post = await repositories.post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    const result = await repositories.like.toggleLike(userId, postId);

    return res.status(200).json({
      message: result.isLiked ? 'تم تسجيل الإعجاب' : 'تم إلغاء الإعجاب',
      isLiked: result.isLiked,
      likesCount: result.likesCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const getPostLikes = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'معرف المنشور غير صالح' });
    }

    const repositories = getRepositoryManager();
    const post = await repositories.post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);

    const result = await repositories.like.findByPost(postId, page, limit);
    const likes = result.rows;
    const count = result.count;

    const users = likes.map((like) => like.User);
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalLikes: count,
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const getMyLikes = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const repositories = getRepositoryManager();
    const result = await repositories.like.findByUser(userId, page, limit);
    const likes = result.rows;
    const count = result.count;

    const posts = likes.map((like) => like.Post);
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalLikes: count,
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

export { toggleLike, getPostLikes, getMyLikes };
