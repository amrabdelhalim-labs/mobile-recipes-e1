/**
 * Repository Factory and Manager
 * Central place to get repository instances
 * All repositories are singletons registered here
 */
import UserRepository, { getUserRepository } from './user.repository.js';
import PostRepository, { getPostRepository } from './post.repository.js';
import CommentRepository, { getCommentRepository } from './comment.repository.js';
import LikeRepository, { getLikeRepository } from './like.repository.js';
import PostImageRepository, { getPostImageRepository } from './post-image.repository.js';

/**
 * Repository Manager - provides access to all repositories
 * 
 * Usage:
 *   const repos = RepositoryManager.getInstance();
 *   const users = await repos.user.findAll();
 *   const posts = await repos.post.findWithDetails(1);
 */
export class RepositoryManager {
  constructor() {
    this.user = getUserRepository();
    this.post = getPostRepository();
    this.comment = getCommentRepository();
    this.like = getLikeRepository();
    this.postImage = getPostImageRepository();
  }

  /**
   * Health check - verify all repositories are initialized
   * @returns {Object} Status of all repositories
   */
  healthCheck() {
    return {
      user: !!this.user,
      post: !!this.post,
      comment: !!this.comment,
      like: !!this.like,
      postImage: !!this.postImage,
      all: [this.user, this.post, this.comment, this.like, this.postImage].every(Boolean),
    };
  }
}

// Singleton
let instance = null;

/**
 * Get or create RepositoryManager instance
 * @returns {RepositoryManager}
 */
export const getRepositoryManager = () => {
  if (!instance) {
    instance = new RepositoryManager();
    console.log('✅ Repository manager initialized');
  }
  return instance;
};

// Direct exports for convenience
export const repositories = getRepositoryManager();

export default repositories;
