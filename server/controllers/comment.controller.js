import { getRepositoryManager } from "../repositories/index.js";

const addComment = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const postId = parseInt(req.params.postId);
        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: "معرف المنشور غير صالح" });
        }

        const repositories = getRepositoryManager();
        const post = await repositories.post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "المنشور غير موجود" });
        }

        const { text } = req.body;
        if (!text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ message: "نص التعليق مطلوب" });
        }

        const fullComment = await repositories.comment.createComment(userId, postId, text.trim());

        return res.status(201).json({ message: "تم إضافة التعليق بنجاح", comment: fullComment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const updateComment = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const commentId = parseInt(req.params.id);
        if (!commentId || isNaN(commentId)) {
            return res.status(400).json({ message: "معرف التعليق غير صالح" });
        }

        const repositories = getRepositoryManager();
        const comment = await repositories.comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: "التعليق غير موجود" });
        }

        if (comment.UserId !== userId) {
            return res.status(403).json({ message: "غير مسموح بتعديل هذا التعليق" });
        }

        const { text } = req.body;
        if (!text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ message: "نص التعليق مطلوب" });
        }

        await repositories.comment.updateText(commentId, text.trim());

        // Fetch updated comment with user details
        const updatedComment = await repositories.comment.findByPk(commentId);

        return res.status(200).json({ message: "تم تعديل التعليق بنجاح", comment: updatedComment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const deleteComment = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const commentId = parseInt(req.params.id);
        if (!commentId || isNaN(commentId)) {
            return res.status(400).json({ message: "معرف التعليق غير صالح" });
        }

        const repositories = getRepositoryManager();
        const comment = await repositories.comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: "التعليق غير موجود" });
        }

        if (comment.UserId !== userId) {
            return res.status(403).json({ message: "غير مسموح بحذف هذا التعليق" });
        }

        await repositories.comment.delete(commentId);

        return res.status(200).json({ message: "تم حذف التعليق بنجاح" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

const getMyComments = async (req, res) => {
    try {
        const userId = req.currentUser?.id;
        if (!userId) {
            return res.status(401).json({ message: "غير مصرح" });
        }

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

        const repositories = getRepositoryManager();
        const result = await repositories.comment.findByUser(userId, page, limit);
        const comments = result.rows;
        const count = result.count;

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            comments,
            pagination: {
                currentPage: page,
                totalPages,
                totalComments: count,
                limit,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطأ في الخادم" });
    }
};

export { addComment, updateComment, deleteComment, getMyComments };
