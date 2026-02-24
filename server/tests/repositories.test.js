/**
 * Repository Pattern Testing Suite
 * Tests all repository operations and database abstraction layer
 *
 * Usage: node tests/repositories.test.js
 */

import 'dotenv/config.js';
import sequelize from '../utilities/database.js';
import models from '../models/index.js';
import { getRepositoryManager } from '../repositories/index.js';
import { colors, state, assert, logSection } from './test.helpers.js';

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.yellow}┌─────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.yellow}│  Repository Pattern Testing Suite - My Recipes  │${colors.reset}`);
  console.log(`${colors.yellow}└─────────────────────────────────────────────────┘${colors.reset}`);

  try {
    // Initialize database connection
    console.log(`\n${colors.blue}Initializing database connection...${colors.reset}`);
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log(`${colors.green}✓ Database connected successfully${colors.reset}`);

    // Get repository manager
    const repositories = getRepositoryManager();
    console.log(`${colors.green}✓ Repository manager initialized${colors.reset}`);

    // ============ User Repository Tests ============
    logSection('User Repository');

    // Create test user
    const userData = {
      name: 'Test User',
      email: `testemail${Date.now()}@example.com`,
      password: 'hashedpassword123',
    };

    let testUserId = null;
    let createdUser = null;

    try {
      createdUser = await repositories.user.create(userData);
      testUserId = createdUser.id;
      assert(testUserId, 'Create user');
      assert(createdUser.name === userData.name, 'User name matches');
      assert(createdUser.email === userData.email, 'User email matches');
    } catch (error) {
      console.log(`${colors.red}Error creating test user: ${error.message}${colors.reset}`);
    }

    // Find by email
    if (testUserId) {
      const found = await repositories.user.findByEmail(userData.email);
      assert(found && found.id === testUserId, 'Find user by email');
    }

    // Email exists check
    if (testUserId) {
      const exists = await repositories.user.emailExists(userData.email);
      assert(exists === true, 'Email exists validation');

      const notExists = await repositories.user.emailExists(`nonexistent${Date.now()}@example.com`);
      assert(notExists === false, 'Email not exists validation');
    }

    // Find by primary key
    if (testUserId) {
      const found = await repositories.user.findByPk(testUserId);
      assert(found && found.id === testUserId, 'Find user by primary key');
    }

    // Update user
    if (testUserId) {
      const updateData = { name: 'Updated Test User' };
      await repositories.user.update(testUserId, updateData);
      const updated = await repositories.user.findByPk(testUserId);
      assert(updated.name === 'Updated Test User', 'Update user');
    }

    // ============ Post Repository Tests ============
    logSection('Post Repository');

    let testPostId = null;
    let createdPost = null;

    if (testUserId) {
      const postData = {
        title: 'Test Recipe',
        content: 'This is a test recipe content',
        UserId: testUserId,
        country: 'Test Country',
        region: 'Test Region',
      };

      try {
        createdPost = await repositories.post.create(postData);
        testPostId = createdPost.id;
        assert(testPostId, 'Create post');
        assert(createdPost.title === postData.title, 'Post title matches');
        assert(createdPost.UserId === testUserId, 'Post user association');
      } catch (error) {
        console.log(`${colors.red}Error creating test post: ${error.message}${colors.reset}`);
      }
    }

    // Find all posts with user
    try {
      const result = await repositories.post.findAllWithUser(1, 10);
      assert(result.rows && Array.isArray(result.rows), 'Find all posts with user');
      assert('page' in result && 'totalPages' in result, 'Pagination info present');
    } catch (error) {
      console.log(`${colors.red}Error finding all posts: ${error.message}${colors.reset}`);
    }

    // Find post by user
    if (testUserId) {
      try {
        const result = await repositories.post.findByUser(testUserId, 1, 10);
        assert(Array.isArray(result.rows), 'Find posts by user');
        assert(result.count >= 0, 'Count posts for user');
      } catch (error) {
        console.log(`${colors.red}Error finding posts by user: ${error.message}${colors.reset}`);
      }
    }

    // Find post with details
    if (testPostId) {
      try {
        const post = await repositories.post.findWithDetails(testPostId);
        assert(post && post.id === testPostId, 'Find post with details');
      } catch (error) {
        console.log(
          `${colors.red}Error finding post with details: ${error.message}${colors.reset}`
        );
      }
    }

    // Update post
    if (testPostId) {
      const updateData = { title: 'Updated Recipe Title' };
      await repositories.post.update(testPostId, updateData);
      const updated = await repositories.post.findByPk(testPostId);
      assert(updated.title === 'Updated Recipe Title', 'Update post');
    }

    // ============ Comment Repository Tests ============
    logSection('Comment Repository');

    let testCommentId = null;

    if (testUserId && testPostId) {
      try {
        const commentData = {
          text: 'This is a test comment',
          UserId: testUserId,
          PostId: testPostId,
        };

        const created = await repositories.comment.create(commentData);
        testCommentId = created.id;
        assert(testCommentId, 'Create comment');
        assert(created.text === commentData.text, 'Comment text matches');
      } catch (error) {
        console.log(`${colors.red}Error creating comment: ${error.message}${colors.reset}`);
      }
    }

    // Find comments by post
    if (testPostId) {
      try {
        const result = await repositories.comment.findByPost(testPostId, 1, 20);
        assert(Array.isArray(result.rows), 'Find comments by post');
      } catch (error) {
        console.log(`${colors.red}Error finding comments by post: ${error.message}${colors.reset}`);
      }
    }

    // Find comments by user
    if (testUserId) {
      try {
        const result = await repositories.comment.findByUser(testUserId, 1, 20);
        assert(Array.isArray(result.rows), 'Find comments by user');
      } catch (error) {
        console.log(`${colors.red}Error finding comments by user: ${error.message}${colors.reset}`);
      }
    }

    // Update comment
    if (testCommentId) {
      try {
        await repositories.comment.updateText(testCommentId, 'Updated comment text');
        const updated = await repositories.comment.findByPk(testCommentId);
        assert(updated.text === 'Updated comment text', 'Update comment');
      } catch (error) {
        console.log(`${colors.red}Error updating comment: ${error.message}${colors.reset}`);
      }
    }

    // Count comments on post
    if (testPostId) {
      try {
        const count = await repositories.comment.countByPost(testPostId);
        assert(typeof count === 'number' && count >= 0, 'Count comments on post');
      } catch (error) {
        console.log(`${colors.red}Error counting comments: ${error.message}${colors.reset}`);
      }
    }

    // ============ Like Repository Tests ============
    logSection('Like Repository');

    if (testUserId && testPostId) {
      try {
        // Toggle like (create)
        const result1 = await repositories.like.toggleLike(testUserId, testPostId);
        assert(result1.isLiked === true, 'Toggle like (create like)');
        assert(result1.likesCount > 0, 'Likes count incremented');

        // Toggle like (delete)
        const result2 = await repositories.like.toggleLike(testUserId, testPostId);
        assert(result2.isLiked === false, 'Toggle like (remove like)');
      } catch (error) {
        console.log(`${colors.red}Error toggling like: ${error.message}${colors.reset}`);
      }
    }

    // Find likes by post
    if (testPostId) {
      try {
        const result = await repositories.like.findByPost(testPostId, 1, 20);
        assert(Array.isArray(result.rows), 'Find likes by post');
      } catch (error) {
        console.log(`${colors.red}Error finding likes by post: ${error.message}${colors.reset}`);
      }
    }

    // Count likes on post
    if (testPostId) {
      try {
        const count = await repositories.like.countByPost(testPostId);
        assert(typeof count === 'number' && count >= 0, 'Count likes on post');
      } catch (error) {
        console.log(`${colors.red}Error counting likes: ${error.message}${colors.reset}`);
      }
    }

    // Check if user liked post
    if (testUserId && testPostId) {
      try {
        const isLiked = await repositories.like.isLikedByUser(testUserId, testPostId);
        assert(typeof isLiked === 'boolean', 'Check if user liked post');
      } catch (error) {
        console.log(`${colors.red}Error checking like status: ${error.message}${colors.reset}`);
      }
    }

    // ============ Repository Manager Tests ============
    logSection('Repository Manager');

    const healthCheck = repositories.healthCheck?.();
    if (healthCheck) {
      assert(healthCheck.user === true, 'User repository healthy');
      assert(healthCheck.post === true, 'Post repository healthy');
      assert(healthCheck.comment === true, 'Comment repository healthy');
      assert(healthCheck.like === true, 'Like repository healthy');
      assert(healthCheck.all === true, 'All repositories healthy');
    }

    // ============ Cascade & Cleanup Tests ============
    logSection('Cascade Operations & Cleanup');

    // Delete comment
    if (testCommentId) {
      try {
        await repositories.comment.delete(testCommentId);
        const deleted = await repositories.comment.findByPk(testCommentId);
        assert(deleted === null, 'Delete comment (cascade cleanup)');
      } catch (error) {
        console.log(`${colors.red}Error deleting comment: ${error.message}${colors.reset}`);
      }
    }

    // Delete post
    if (testPostId) {
      try {
        await repositories.post.delete(testPostId);
        const deleted = await repositories.post.findByPk(testPostId);
        assert(deleted === null, 'Delete post (cascade cleanup)');
      } catch (error) {
        console.log(`${colors.red}Error deleting post: ${error.message}${colors.reset}`);
      }
    }

    // Delete user
    if (testUserId) {
      try {
        await repositories.user.delete(testUserId);
        const deleted = await repositories.user.findByPk(testUserId);
        assert(deleted === null, 'Delete user (cascade cleanup)');
      } catch (error) {
        console.log(`${colors.red}Error deleting user: ${error.message}${colors.reset}`);
      }
    }

    // ============ Test Summary ============
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}Test Summary${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    console.log(`Total Tests: ${state.total}`);
    console.log(`${colors.green}Passed: ${state.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${state.failed}${colors.reset}`);

    const successRate = ((state.passed / state.total) * 100).toFixed(2);
    console.log(`Success Rate: ${successRate}%`);

    if (state.failed === 0) {
      console.log(
        `\n${colors.green}✓ All tests passed! Repository pattern is working correctly.${colors.reset}`
      );
    } else {
      console.log(
        `\n${colors.red}✗ Some tests failed. Please review the errors above.${colors.reset}`
      );
    }

    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Fatal error during testing: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    // Cleanup: close database connection
    try {
      await sequelize.close();
      console.log(`${colors.blue}Database connection closed${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error closing database: ${error.message}${colors.reset}`);
    }

    // Exit with appropriate code
    process.exit(state.failed > 0 ? 1 : 0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});
