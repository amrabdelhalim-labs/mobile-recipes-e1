import models from "../models/index.js";
import { getStorageService } from "../utilities/files.js";

const newPost = async (req, res) => {
    const uploadedFiles = [];
    
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const user = await models.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        const { title, content, steps, country, region } = req.body;

        // Validate required fields
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: "العنوان مطلوب" });
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: "المحتوى مطلوب" });
        }

        // At least one image is required
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "يجب إرفاق صورة واحدة على الأقل" });
        }

        // Parse steps - can be JSON string, array, or Draft.js object
        let parsedSteps = null;
        if (steps !== undefined && steps !== null && steps !== '') {
            if (typeof steps === 'string') {
                try {
                    parsedSteps = JSON.parse(steps);
                } catch {
                    return res.status(400).json({ message: "صيغة الخطوات غير صحيحة" });
                }
            } else if (Array.isArray(steps) || (typeof steps === 'object' && steps !== null)) {
                parsedSteps = steps;
            } else {
                return res.status(400).json({ message: "الخطوات يجب أن تكون بصيغة صحيحة" });
            }

            // Validate that steps is either array or Draft.js object
            if (!Array.isArray(parsedSteps) && (typeof parsedSteps !== 'object' || parsedSteps === null)) {
                return res.status(400).json({ message: "الخطوات يجب أن تكون بصيغة صحيحة" });
            }
        }

        // Sanitize optional fields
        const sanitizedCountry = country && typeof country === 'string' ? country.trim() : null;
        const sanitizedRegion = region && typeof region === 'string' ? region.trim() : null;

        // Create post
        const post = await models.Post.create({
            title: title.trim(),
            content: content.trim(),
            steps: parsedSteps,
            country: sanitizedCountry,
            region: sanitizedRegion,
            UserId: userId,
        });

        // Upload images using Storage Service
        const storage = getStorageService();
        const uploadResults = await storage.uploadFiles(req.files);
        
        // Save image metadata to database
        for (const result of uploadResults) {
            uploadedFiles.push(result);
            await models.Post_Image.create({
                imageUrl: result.url,
                PostId: post.id,
            });
        }

        // Fetch post with images and user
        const fullPost = await models.Post.findByPk(post.id, {
            include: [
                {
                    model: models.Post_Image,
                    attributes: ['id', 'imageUrl'],
                },
                {
                    model: models.User,
                    attributes: ['id', 'name', 'ImageUrl'],
                },
            ],
        });

        return res.status(201).json({ message: "تم إنشاء المنشور بنجاح", post: fullPost });
    } catch (error) {
        console.error('Error creating post:', error);

        // Cleanup uploaded images on error
        if (uploadedFiles.length > 0) {
            const storage = getStorageService();
            const filenames = uploadedFiles.map(f => f.filename);
            storage.deleteFiles(filenames).catch(err => {
                console.error('Failed to cleanup uploaded images:', err);
            });
        }

        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const currentUserId = req.currentUser?.id;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const offset = (page - 1) * limit;

        const { count, rows: posts } = await models.Post.findAndCountAll({
            distinct: true,
            col: 'id',
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: models.User,
                    attributes: ['id', 'name', 'ImageUrl'],
                },
                {
                    model: models.Post_Image,
                    attributes: ['id', 'imageUrl'],
                },
                {
                    model: models.Comment,
                    attributes: ['id'],
                },
            ],
        });

        const postIds = posts.map((post) => post.id);
        let likesMap = {};

        if (postIds.length > 0) {
            const likeRows = await models.Like.findAll({
                attributes: [
                    'PostId',
                    [
                        models.Like.sequelize.fn('COUNT', models.Like.sequelize.col('id')),
                        'count',
                    ],
                ],
                where: { PostId: postIds },
                group: ['PostId'],
                raw: true,
            });

            likesMap = likeRows.reduce((acc, row) => {
                acc[row.PostId] = Number(row.count) || 0;
                return acc;
            }, {});
        }

        let userLikesSet = new Set();
        if (currentUserId && postIds.length > 0) {
            const userLikes = await models.Like.findAll({
                attributes: ['PostId'],
                where: { UserId: currentUserId, PostId: postIds },
                raw: true,
            });
            userLikesSet = new Set(userLikes.map((l) => l.PostId));
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
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const getMyPosts = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const currentUserId = userId;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const offset = (page - 1) * limit;

        const { count, rows: posts } = await models.Post.findAndCountAll({
            distinct: true,
            col: 'id',
            where: { UserId: userId },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: models.User,
                    attributes: ['id', 'name', 'ImageUrl'],
                },
                {
                    model: models.Post_Image,
                    attributes: ['id', 'imageUrl'],
                },
                {
                    model: models.Comment,
                    attributes: ['id'],
                },
            ],
        });

        const postIds = posts.map((post) => post.id);
        let likesMap = {};

        if (postIds.length > 0) {
            const likeRows = await models.Like.findAll({
                attributes: [
                    'PostId',
                    [
                        models.Like.sequelize.fn('COUNT', models.Like.sequelize.col('id')),
                        'count',
                    ],
                ],
                where: { PostId: postIds },
                group: ['PostId'],
                raw: true,
            });

            likesMap = likeRows.reduce((acc, row) => {
                acc[row.PostId] = Number(row.count) || 0;
                return acc;
            }, {});
        }

        let userLikesSet = new Set();
        if (currentUserId && postIds.length > 0) {
            const userLikes = await models.Like.findAll({
                attributes: ['PostId'],
                where: { UserId: currentUserId, PostId: postIds },
                raw: true,
            });
            userLikesSet = new Set(userLikes.map((l) => l.PostId));
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
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const getPostById = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: "معرف المنشور غير صالح" });
        }

        const post = await models.Post.findByPk(postId, {
            include: [
                {
                    model: models.User,
                    attributes: ['id', 'name', 'ImageUrl'],
                },
                {
                    model: models.Post_Image,
                    attributes: ['id', 'imageUrl'],
                },
                {
                    model: models.Comment,
                    attributes: ['id', 'text', 'createdAt'],
                    include: [
                        {
                            model: models.User,
                            attributes: ['id', 'name', 'ImageUrl'],
                        },
                    ],
                },
            ],
        });

        if (!post) {
            return res.status(404).json({ message: "المنشور غير موجود" });
        }

        const likesCount = await models.Like.count({ where: { PostId: postId } });

        const currentUserId = req.currentUser?.id;
        let isLiked = false;
        if (currentUserId) {
            const userLike = await models.Like.findOne({
                where: { UserId: currentUserId, PostId: postId },
            });
            isLiked = !!userLike;
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
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const updatePost = async (req, res) => {
    const uploadedFiles = [];
    
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const postId = parseInt(req.params.id);
        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: "معرف المنشور غير صالح" });
        }

        const post = await models.Post.findByPk(postId, {
            include: [{ model: models.Post_Image }],
        });
        if (!post) {
            return res.status(404).json({ message: "المنشور غير موجود" });
        }

        if (post.UserId !== userId) {
            return res.status(403).json({ message: "غير مسموح بتعديل هذا المنشور" });
        }

        const { title, content, steps, country, region, deletedImages } = req.body;
        const updates = {};

        if (title !== undefined) {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({ message: "العنوان غير صالح" });
            }
            updates.title = title.trim();
        }

        if (content !== undefined) {
            if (typeof content !== 'string' || !content.trim()) {
                return res.status(400).json({ message: "المحتوى غير صالح" });
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
                        return res.status(400).json({ message: "الخطوات يجب أن تكون بصيغة صحيحة" });
                    }
                    updates.steps = parsed;
                } catch {
                    return res.status(400).json({ message: "صيغة الخطوات غير صحيحة" });
                }
            } else if (Array.isArray(steps) || (typeof steps === 'object' && steps !== null)) {
                updates.steps = steps;
            } else {
                return res.status(400).json({ message: "الخطوات يجب أن تكون بصيغة صحيحة" });
            }
        }

        if (country !== undefined) {
            updates.country = country && typeof country === 'string' ? country.trim() : null;
        }

        if (region !== undefined) {
            updates.region = region && typeof region === 'string' ? region.trim() : null;
        }

        const storage = getStorageService();

        // Delete specified images
        let imagesToDelete = [];
        if (deletedImages !== undefined && deletedImages !== null && deletedImages !== '') {
            if (typeof deletedImages === 'string') {
                try {
                    imagesToDelete = JSON.parse(deletedImages);
                } catch {
                    return res.status(400).json({ message: "صيغة الصور المحذوفة غير صحيحة" });
                }
            } else if (Array.isArray(deletedImages)) {
                imagesToDelete = deletedImages;
            }

            if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
                const existingImages = await models.Post_Image.findAll({
                    where: { id: imagesToDelete, PostId: postId },
                });

                // Delete images from storage
                const imageUrls = existingImages.map(img => img.imageUrl);
                if (imageUrls.length > 0) {
                    await storage.deleteFiles(imageUrls).catch(err => {
                        console.error('Failed to delete images from storage:', err);
                    });
                }

                // Delete from database
                for (const img of existingImages) {
                    await img.destroy();
                }
            }
        }

        // Add new images
        if (req.files && req.files.length > 0) {
            const uploadResults = await storage.uploadFiles(req.files);
            
            for (const result of uploadResults) {
                uploadedFiles.push(result);
                await models.Post_Image.create({
                    imageUrl: result.url,
                    PostId: postId,
                });
            }
        }

        // Update post
        if (Object.keys(updates).length > 0) {
            await post.update(updates);
        }

        // Fetch updated post
        const updatedPost = await models.Post.findByPk(postId, {
            include: [
                {
                    model: models.Post_Image,
                    attributes: ['id', 'imageUrl'],
                },
                {
                    model: models.User,
                    attributes: ['id', 'name', 'ImageUrl'],
                },
            ],
        });

        const likesCount = await models.Like.count({ where: { PostId: postId } });

        return res.status(200).json({
            message: "تم تحديث المنشور بنجاح",
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
            const filenames = uploadedFiles.map(f => f.filename);
            storage.deleteFiles(filenames).catch(err => {
                console.error('Failed to cleanup uploaded images:', err);
            });
        }

        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const deletePost = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const postId = parseInt(req.params.id);
        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: "معرف المنشور غير صالح" });
        }

        const post = await models.Post.findByPk(postId, {
            include: [{ model: models.Post_Image }],
        });
        if (!post) {
            return res.status(404).json({ message: "المنشور غير موجود" });
        }

        if (post.UserId !== userId) {
            return res.status(403).json({ message: "غير مسموح بحذف هذا المنشور" });
        }

        // Delete post images from storage
        if (post.Post_Images && post.Post_Images.length > 0) {
            const storage = getStorageService();
            const imageUrls = post.Post_Images.map(img => img.imageUrl);
            
            await storage.deleteFiles(imageUrls).catch(err => {
                console.error('Failed to delete post images from storage:', err);
            });
        }

        // CASCADE will delete comments, likes, and images automatically
        await post.destroy();

        return res.status(200).json({ message: "تم حذف المنشور بنجاح" });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

export { newPost, getAllPosts, getMyPosts, getPostById, updatePost, deletePost };
