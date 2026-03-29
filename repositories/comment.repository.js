/**
 * Comment Repository
 * Specialized repository for Comment model
 */
import BaseRepository from './base.repository.js';
import Comment from '../models/comments.model.js';

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  /**
   * Find all comments for a post with user details
   * @param {number} postId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{rows: Array, count: number, ...}>}
   */
  async findByPost(postId, page = 1, limit = 20) {
    return this.findPaginated(page, limit, {
      where: { PostId: postId },
      include: [
        {
          association: 'User',
          attributes: ['id', 'name', 'ImageUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find user's comments with post details
   * @param {number} userId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{rows: Array, count: number, ...}>}
   */
  async findByUser(userId, page = 1, limit = 20) {
    return this.findPaginated(page, limit, {
      where: { UserId: userId },
      include: [
        {
          association: 'User',
          attributes: ['id', 'name', 'ImageUrl'],
        },
        {
          association: 'Post',
          attributes: ['id', 'title', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Create comment with user and post validation
   * @param {number} userId
   * @param {number} postId
   * @param {string} text
   * @returns {Promise<Object>}
   */
  async createComment(userId, postId, text) {
    try {
      const comment = await this.create({
        text,
        UserId: userId,
        PostId: postId,
      });

      // Fetch with relations
      return this.findByPk(comment.id, {
        include: [
          {
            association: 'User',
            attributes: ['id', 'name', 'ImageUrl'],
          },
        ],
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Update comment text
   * @param {number} id
   * @param {string} text
   * @returns {Promise<number>}
   */
  async updateText(id, text) {
    return this.update(id, { text });
  }

  /**
   * Count comments on a post
   * @param {number} postId
   * @returns {Promise<number>}
   */
  async countByPost(postId) {
    return this.count({ where: { PostId: postId } });
  }

  /**
   * Delete all comments by user (for cascade)
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async deleteByUser(userId) {
    return this.deleteWhere({ UserId: userId });
  }

  /**
   * Delete all comments on a post (for cascade)
   * @param {number} postId
   * @returns {Promise<number>}
   */
  async deleteByPost(postId) {
    return this.deleteWhere({ PostId: postId });
  }
}

// Singleton pattern
let instance = null;

/**
 * Get or create CommentRepository instance
 * @returns {CommentRepository}
 */
export const getCommentRepository = () => {
  if (!instance) {
    instance = new CommentRepository();
  }
  return instance;
};

export default CommentRepository;
