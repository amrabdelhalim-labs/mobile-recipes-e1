/**
 * User Repository
 * Specialized repository for User model with domain-specific operations
 *
 * Usage:
 *   const userRepo = UserRepository.getInstance();
 *   const user = await userRepo.findByEmail('user@example.com');
 *   const users = await userRepo.findWithPosts({ page: 1, limit: 10 });
 */
import BaseRepository from './base.repository.js';
import User from '../models/users.model.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return this.findOne({ where: { email } });
  }

  /**
   * Find user by email with posts and counts
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmailWithRelations(email) {
    return this.findOne({
      where: { email },
      include: [
        {
          association: 'Posts',
          attributes: ['id', 'title', 'createdAt'],
        },
        {
          association: 'Comments',
          attributes: ['id', 'text', 'createdAt'],
        },
      ],
    });
  }

  /**
   * Find users with their posts (paginated)
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{rows: Array, count: number, ...}>}
   */
  async findWithPosts(page = 1, limit = 10) {
    return this.findPaginated(page, limit, {
      include: [
        {
          association: 'Posts',
          attributes: ['id', 'title', 'createdAt', 'updatedAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Check if email is already taken
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Find user with all relations (posts, comments, likes)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findWithAllRelations(id) {
    return this.findByPk(id, {
      include: [
        {
          association: 'Posts',
          include: [
            {
              association: 'images',
              attributes: ['id', 'imageUrl'],
            },
            {
              association: 'Comments',
              attributes: ['id', 'text', 'createdAt'],
            },
          ],
        },
        {
          association: 'Comments',
          attributes: ['id', 'text', 'PostId', 'createdAt'],
        },
      ],
    });
  }

  /**
   * Update user profile (name, email, password)
   * @param {number} id
   * @param {Object} data - {name?, email?, password?}
   * @returns {Promise<number>}
   */
  async updateProfile(id, data) {
    const { name, email, password } = data;
    const update = {};

    if (name) update.name = name;
    if (email) update.email = email;
    if (password) update.password = password;

    if (Object.keys(update).length === 0) {
      throw new Error('No fields to update');
    }

    return this.update(id, update);
  }

  /**
   * Update user image
   * @param {number} id
   * @param {string} imageUrl
   * @returns {Promise<number>}
   */
  async updateImage(id, imageUrl) {
    return this.update(id, { ImageUrl: imageUrl });
  }
}

// Singleton pattern
let instance = null;

/**
 * Get or create UserRepository instance
 * @returns {UserRepository}
 */
export const getUserRepository = () => {
  if (!instance) {
    instance = new UserRepository();
  }
  return instance;
};

export default UserRepository;
