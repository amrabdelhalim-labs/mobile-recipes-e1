/**
 * Like Repository
 * Specialized repository for Like model
 */
import { fn, col, literal } from 'sequelize';
import BaseRepository from './base.repository.js';
import Like from '../models/likes.model.js';

class LikeRepository extends BaseRepository {
  constructor() {
    super(Like);
  }

  /**
   * Find all users who liked a post
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
   * Find all posts liked by user
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
          association: 'Post',
          include: [
            {
              association: 'User',
              attributes: ['id', 'name', 'ImageUrl'],
            },
            {
              association: 'images',
              attributes: ['id', 'imageUrl'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Check if user liked a post
   * @param {number} userId
   * @param {number} postId
   * @returns {Promise<Object|null>}
   */
  async findUserLike(userId, postId) {
    return this.findOne({
      where: { UserId: userId, PostId: postId },
    });
  }

  /**
   * Toggle like (create or delete)
   * @param {number} userId
   * @param {number} postId
   * @returns {Promise<{isLiked: boolean, likesCount: number}>}
   */
  async toggleLike(userId, postId) {
    try {
      const existingLike = await this.findUserLike(userId, postId);

      let isLiked = false;

      if (existingLike) {
        // Delete like
        await this.delete(existingLike.id);
        isLiked = false;
      } else {
        // Create like
        await this.create({ UserId: userId, PostId: postId });
        isLiked = true;
      }

      // Get updated count
      const likesCount = await this.countByPost(postId);

      return { isLiked, likesCount };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Count likes on a post
   * @param {number} postId
   * @returns {Promise<number>}
   */
  async countByPost(postId) {
    return this.count({ where: { PostId: postId } });
  }

  /**
   * Count likes by user
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async countByUser(userId) {
    return this.count({ where: { UserId: userId } });
  }

  /**
   * Check if user liked post
   * @param {number} userId
   * @param {number} postId
   * @returns {Promise<boolean>}
   */
  async isLikedByUser(userId, postId) {
    const like = await this.findUserLike(userId, postId);
    return like !== null;
  }

  /**
   * Delete all likes on a post (for cascade)
   * @param {number} postId
   * @returns {Promise<number>}
   */
  async deleteByPost(postId) {
    return this.deleteWhere({ PostId: postId });
  }

  /**
   * Delete all likes by user (for cascade)
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async deleteByUser(userId) {
    return this.deleteWhere({ UserId: userId });
  }

  /**
   * Get top liked posts
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getTopPosts(limit = 10) {
    return this.getModel().findAll({
      attributes: [
        'PostId',
        [fn('COUNT', col('PostId')), 'likeCount'],
      ],
      group: ['PostId'],
      order: [[literal('likeCount'), 'DESC']],
      limit,
    });
  }
}

// Singleton pattern
let instance = null;

/**
 * Get or create LikeRepository instance
 * @returns {LikeRepository}
 */
export const getLikeRepository = () => {
  if (!instance) {
    instance = new LikeRepository();
  }
  return instance;
};

export default LikeRepository;
