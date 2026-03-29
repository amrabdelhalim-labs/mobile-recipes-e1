/**
 * Post Repository
 * Specialized repository for Post model with recipe-specific operations
 */
import { Op, fn, col, literal } from 'sequelize';
import BaseRepository from './base.repository.js';
import Post from '../models/posts.model.js';
import Post_Image from '../models/postImages.model.js';

class PostRepository extends BaseRepository {
  constructor() {
    super(Post);
  }

  /**
   * Find all posts with user and image data
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{rows: Array, count: number, ...}>}
   */
  async findAllWithUser(page = 1, limit = 10) {
    return this.findPaginated(page, limit, {
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
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find user's posts with details
   * @param {number} userId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{rows: Array, count: number, ...}>}
   */
  async findByUser(userId, page = 1, limit = 10) {
    return this.findPaginated(page, limit, {
      where: { UserId: userId },
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
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find post with full details (user, images, comments, likes)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findWithDetails(id) {
    return this.findByPk(id, {
      include: [
        {
          association: 'User',
          attributes: ['id', 'name', 'ImageUrl'],
        },
        {
          association: 'images',
          attributes: ['id', 'imageUrl'],
        },
        {
          association: 'Comments',
          include: [
            {
              association: 'User',
              attributes: ['id', 'name', 'ImageUrl'],
            },
          ],
        },
      ],
    });
  }

  /**
   * Search posts by title or content
   * @param {string} query
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{rows: Array, count: number, ...}>}
   */
  async search(query, page = 1, limit = 10) {
    return this.findPaginated(page, limit, {
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
        ],
      },
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
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find posts by country and region
   * @param {string} country
   * @param {string} region
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{rows: Array, count: number, ...}>}
   */
  async findByLocation(country, region, page = 1, limit = 10) {
    const where = {};
    if (country) where.country = country;
    if (region) where.region = region;

    return this.findPaginated(page, limit, {
      where,
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
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Create post with images array
   * @param {Object} data - {title, content, steps, country, region, UserId}
   * @param {Array<Object>} images - Array of {imageUrl}
   * @returns {Promise<Object>}
   */
  async createWithImages(data, images = []) {
    try {
      const post = await this.create({
        ...data,
        UserId: data.UserId,
      });

      if (images.length > 0) {
        await Promise.all(
          images.map((img) =>
            Post_Image.create({
              imageUrl: img.imageUrl,
              PostId: post.id,
            })
          )
        );
      }

      return this.findWithDetails(post.id);
    } catch (error) {
      console.error('Error creating post with images:', error);
      throw error;
    }
  }

  /**
   * Get posts with most likes
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async findTrending(limit = 10) {
    return this.findAll({
      attributes: {
        include: [[fn('COUNT', col('Users.Like.id')), 'likesCount']],
      },
      include: [
        {
          association: 'User',
          attributes: ['id', 'name', 'ImageUrl'],
        },
        {
          association: 'Users',
          attributes: [],
          through: { attributes: [] },
          required: false,
        },
        {
          association: 'images',
          attributes: ['id', 'imageUrl'],
        },
      ],
      group: ['Post.id', 'User.id', 'images.id'],
      order: [[literal('likesCount'), 'DESC']],
      limit,
      subQuery: false,
    });
  }

  /**
   * Update post content (excluding images)
   * @param {number} id
   * @param {Object} data - {title?, content?, steps?, country?, region?}
   * @returns {Promise<number>}
   */
  async updateContent(id, data) {
    const { title, content, steps, country, region } = data;
    const update = {};

    if (title) update.title = title;
    if (content) update.content = content;
    if (steps) update.steps = steps;
    if (country) update.country = country;
    if (region) update.region = region;

    if (Object.keys(update).length === 0) {
      throw new Error('No fields to update');
    }

    return this.update(id, update);
  }

  /**
   * Get post images count
   * @param {number} id
   * @returns {Promise<number>}
   */
  async getImageCount(id) {
    const post = await this.findByPk(id, {
      include: [{ association: 'images' }],
    });
    return post?.images?.length ?? 0;
  }
}

// Singleton pattern
let instance = null;

/**
 * Get or create PostRepository instance
 * @returns {PostRepository}
 */
export const getPostRepository = () => {
  if (!instance) {
    instance = new PostRepository();
  }
  return instance;
};

export default PostRepository;
