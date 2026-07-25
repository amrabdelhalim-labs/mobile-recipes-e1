import { getRepositoryManager } from '../repositories/index.js';
import { getStorageService } from '../utilities/files.js';

const newPost = async (req, res) => {
  const uploadedFiles = [];

  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const { title, content, steps, country, region } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'العنوان مطلوب' });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'المحتوى مطلوب' });
    }

    // At least one image is required
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'يجب إرفاق صورة واحدة على الأقل' });
    }

    // Parse steps - can be JSON string, array, or Draft.js object
    let parsedSteps = null;
    if (steps !== undefined && steps !== null && steps !== '') {
      if (typeof steps === 'string') {
        try {
          parsedSteps = JSON.parse(steps);
        } catch {
          return res.status(400).json({ message: 'صيغة الخطوات غير صحيحة' });
        }
      } else if (Array.isArray(steps) || (typeof steps === 'object' && steps !== null)) {
        parsedSteps = steps;
      } else {
        return res.status(400).json({ message: 'الخطوات يجب أن تكون بصيغة صحيحة' });
      }

      // Validate that steps is either array or Draft.js object
      if (
        !Array.isArray(parsedSteps) &&
        (typeof parsedSteps !== 'object' || parsedSteps === null)
      ) {
        return res.status(400).json({ message: 'الخطوات يجب أن تكون بصيغة صحيحة' });
      }
    }

    // Sanitize optional fields
    const sanitizedCountry = country && typeof country === 'string' ? country.trim() : null;
    const sanitizedRegion = region && typeof region === 'string' ? region.trim() : null;

    // Upload images using Storage Service
    const storage = getStorageService();
    const uploadResults = await storage.uploadFiles(req.files);
    uploadResults.forEach((result) => uploadedFiles.push(result));

    // Prepare images array for repository
    const images = uploadResults.map((result) => ({ imageUrl: result.url }));

    // Create post with images through repository
    const fullPost = await repositories.post.createWithImages(
      {
        title: title.trim(),
        content: content.trim(),
        steps: parsedSteps,
        country: sanitizedCountry,
        region: sanitizedRegion,
        UserId: userId,
      },
      images
    );

    return res.status(201).json({ message: 'تم إنشاء المنشور بنجاح', post: fullPost });
  } catch (error) {
    console.error('Error creating post:', error);

    // Cleanup uploaded images on error
    if (uploadedFiles.length > 0) {
      const storage = getStorageService();
      const filenames = uploadedFiles.map((f) => f.filename);
      storage.deleteFiles(filenames).catch((err) => {
        console.error('Failed to cleanup uploaded images:', err);
      });
    }

    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const currentUserId = req.currentUser?.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const repositories = getRepositoryManager();
    const result = await repositories.post.findAllWithUser(page, limit);
    const posts = result.rows;
    const count = result.count;

    const postIds = posts.map((post) => post.id);
    let likesMap = {};

    if (postIds.length > 0) {
      // Get likes count for each post
      for (const postId of postIds) {
        const likesCount = await repositories.like.countByPost(postId);
        likesMap[postId] = likesCount;
      }
    }

    let userLikesSet = new Set();
    if (currentUserId && postIds.length > 0) {
      // Check if current user has liked each post
      for (const postId of postIds) {
        const isLiked = await repositories.like.isLikedByUser(currentUserId, postId);
        if (isLiked) {
          userLikesSet.add(postId);
        }
      }
    }

    const postsWithLikes = posts.map((post) => ({
      ...post.toJSON(),
      likesCount: likesMap[post.id] || 0,
      isLiked: userLikesSet.has(post.id),
    }));

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      posts: postsWithLikes,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts: count,
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const currentUserId = userId;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const repositories = getRepositoryManager();
    const result = await repositories.post.findByUser(userId, page, limit);
    const posts = result.rows;
    const count = result.count;

    const postIds = posts.map((post) => post.id);
    let likesMap = {};

    if (postIds.length > 0) {
      // Get likes count for each post
      for (const postId of postIds) {
        const likesCount = await repositories.like.countByPost(postId);
        likesMap[postId] = likesCount;
      }
    }

    let userLikesSet = new Set();
    if (currentUserId && postIds.length > 0) {
      // Check if current user has liked each post
      for (const postId of postIds) {
        const isLiked = await repositories.like.isLikedByUser(currentUserId, postId);
        if (isLiked) {
          userLikesSet.add(postId);
        }
      }
    }

    const postsWithLikes = posts.map((post) => ({
      ...post.toJSON(),
      likesCount: likesMap[post.id] || 0,
      isLiked: userLikesSet.has(post.id),
    }));

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      posts: postsWithLikes,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts: count,
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const getPostById = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'معرف المنشور غير صالح' });
    }

    const repositories = getRepositoryManager();
    const post = await repositories.post.findWithDetails(postId);

    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    const likesCount = await repositories.like.countByPost(postId);

    const currentUserId = req.currentUser?.id;
    let isLiked = false;
    if (currentUserId) {
      isLiked = await repositories.like.isLikedByUser(currentUserId, postId);
    }

    return res.status(200).json({
      post: {
        ...post.toJSON(),
        likesCount,
        isLiked,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const updatePost = async (req, res) => {
  const uploadedFiles = [];

  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const postId = parseInt(req.params.id);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'معرف المنشور غير صالح' });
    }

    const repositories = getRepositoryManager();
    const post = await repositories.post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    if (post.UserId !== userId) {
      return res.status(403).json({ message: 'غير مسموح بتعديل هذا المنشور' });
    }

    const { title, content, steps, country, region, deletedImages } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'العنوان غير صالح' });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ message: 'المحتوى غير صالح' });
      }
      updates.content = content.trim();
    }

    if (steps !== undefined) {
      if (steps === null || steps === '') {
        updates.steps = null;
      } else if (typeof steps === 'string') {
        try {
          const parsed = JSON.parse(steps);
          if (!Array.isArray(parsed) && (typeof parsed !== 'object' || parsed === null)) {
            return res.status(400).json({ message: 'الخطوات يجب أن تكون بصيغة صحيحة' });
          }
          updates.steps = parsed;
        } catch {
          return res.status(400).json({ message: 'صيغة الخطوات غير صحيحة' });
        }
      } else if (Array.isArray(steps) || (typeof steps === 'object' && steps !== null)) {
        updates.steps = steps;
      } else {
        return res.status(400).json({ message: 'الخطوات يجب أن تكون بصيغة صحيحة' });
      }
    }

    if (country !== undefined) {
      updates.country = country && typeof country === 'string' ? country.trim() : null;
    }

    if (region !== undefined) {
      updates.region = region && typeof region === 'string' ? region.trim() : null;
    }

    const storage = getStorageService();

    // Delete specified images if needed - keep complex image handling for now
    let imagesToDelete = [];
    if (deletedImages !== undefined && deletedImages !== null && deletedImages !== '') {
      if (typeof deletedImages === 'string') {
        try {
          imagesToDelete = JSON.parse(deletedImages);
        } catch {
          return res.status(400).json({ message: 'صيغة الصور المحذوفة غير صحيحة' });
        }
      } else if (Array.isArray(deletedImages)) {
        imagesToDelete = deletedImages;
      }

      if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
        // Import models directly for image deletion
        const { default: models } = await import('../models/index.js');
        const existingImages = await models.Post_Image.findAll({
          where: { id: imagesToDelete, PostId: postId },
        });

        // Delete images from storage
        const imageUrls = existingImages.map((img) => img.imageUrl);
        if (imageUrls.length > 0) {
          await storage.deleteFiles(imageUrls).catch((err) => {
            console.error('Failed to delete images from storage:', err);
          });
        }

        // Delete from database
        for (const img of existingImages) {
          await img.destroy();
        }
      }
    }

    // Add new images if provided
    if (req.files && req.files.length > 0) {
      const { default: models } = await import('../models/index.js');
      const uploadResults = await storage.uploadFiles(req.files);

      for (const result of uploadResults) {
        uploadedFiles.push(result);
        await models.Post_Image.create({
          imageUrl: result.url,
          PostId: postId,
        });
      }
    }

    // Update post using repository
    if (Object.keys(updates).length > 0) {
      await repositories.post.update(postId, updates);
    }

    // Fetch updated post
    const updatedPost = await repositories.post.findWithDetails(postId);
    const likesCount = await repositories.like.countByPost(postId);

    return res.status(200).json({
      message: 'تم تحديث المنشور بنجاح',
      post: {
        ...updatedPost.toJSON(),
        likesCount,
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);

    // Cleanup uploaded images on error
    if (uploadedFiles.length > 0) {
      const storage = getStorageService();
      const filenames = uploadedFiles.map((f) => f.filename);
      storage.deleteFiles(filenames).catch((err) => {
        console.error('Failed to cleanup uploaded images:', err);
      });
    }

    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const deletePost = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const postId = parseInt(req.params.id);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: 'معرف المنشور غير صالح' });
    }

    const repositories = getRepositoryManager();
    const post = await repositories.post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    if (post.UserId !== userId) {
      return res.status(403).json({ message: 'غير مسموح بحذف هذا المنشور' });
    }

    // Get post details with images
    const { default: models } = await import('../models/index.js');
    const postWithImages = await models.Post.findByPk(postId, {
      include: [{ model: models.Post_Image }],
    });

    // Delete post images from storage
    if (postWithImages?.Post_Images && postWithImages.Post_Images.length > 0) {
      const storage = getStorageService();
      const imageUrls = postWithImages.Post_Images.map((img) => img.imageUrl);

      await storage.deleteFiles(imageUrls).catch((err) => {
        console.error('Failed to delete post images from storage:', err);
      });
    }

    // CASCADE will delete comments, likes, and images automatically
    await repositories.post.delete(postId);

    return res.status(200).json({ message: 'تم حذف المنشور بنجاح' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

export { newPost, getAllPosts, getMyPosts, getPostById, updatePost, deletePost };
