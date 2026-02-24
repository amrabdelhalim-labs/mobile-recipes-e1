/**
 * Post Image Repository
 * Specialized repository for Post_Image model
 */
import BaseRepository from './base.repository.js';
import Post_Image from '../models/postImages.model.js';

class PostImageRepository extends BaseRepository {
  constructor() {
    super(Post_Image);
  }

  /**
   * Find all images for a post
   * @param {number} postId
   * @returns {Promise<Array>}
   */
  async findByPost(postId) {
    return this.findAll({
      where: { PostId: postId },
      order: [['createdAt', 'ASC']],
    });
  }

  /**
   * Create multiple images for a post
   * @param {number} postId
   * @param {Array<string>} imageUrls
   * @returns {Promise<Array>}
   */
  async createBulk(postId, imageUrls) {
    try {
      const images = imageUrls.map((url) => ({
        imageUrl: url,
        PostId: postId,
      }));

      return await this.bulkCreate(images);
    } catch (error) {
      console.error('Error bulk creating post images:', error);
      throw error;
    }
  }

  /**
   * Get image URLs for a post (for storage cleanup)
   * @param {number} postId
   * @returns {Promise<Array<string>>}
   */
  async getImageUrlsByPost(postId) {
    const images = await this.findByPost(postId);
    return images.map((img) => img.imageUrl);
  }

  /**
   * Count images in a post
   * @param {number} postId
   * @returns {Promise<number>}
   */
  async countByPost(postId) {
    return this.count({ where: { PostId: postId } });
  }

  /**
   * Delete all images for a post (for cascade)
   * @param {number} postId
   * @returns {Promise<number>}
   */
  async deleteByPost(postId) {
    return this.deleteWhere({ PostId: postId });
  }

  /**
   * Update image URL (for cloud migration)
   * @param {number} id
   * @param {string} newUrl
   * @returns {Promise<number>}
   */
  async updateUrl(id, newUrl) {
    return this.update(id, { imageUrl: newUrl });
  }
}

// Singleton pattern
let instance = null;

/**
 * Get or create PostImageRepository instance
 * @returns {PostImageRepository}
 */
export const getPostImageRepository = () => {
  if (!instance) {
    instance = new PostImageRepository();
  }
  return instance;
};

export default PostImageRepository;
