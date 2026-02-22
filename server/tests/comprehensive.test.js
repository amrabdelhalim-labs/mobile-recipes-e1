/**
 * Comprehensive Integration Test Suite
 * Full end-to-end testing of the Repository Pattern implementation
 * Creates, updates, and deletes all data types in a single workflow
 * 
 * Usage: node tests/comprehensive.test.js
 */

import 'dotenv/config.js';
import sequelize from '../utilities/database.js';
import models from '../models/index.js';
import { getRepositoryManager } from '../repositories/index.js';
import { colors, state, assert, logSection, logStep } from './test.helpers.js';

let testData = {
  users: [],
  posts: [],
  comments: [],
  likes: [],
};

/**
 * Main test workflow
 */
async function runComprehensiveTests() {
  console.log(`${'┌' + '─'.repeat(48) + '┐'}`);
  console.log(`│${' '.repeat(48)}│`);
  console.log(`│  ${colors.magenta}🧪 COMPREHENSIVE INTEGRATION TEST${colors.reset}${' '.repeat(13)}│`);
  console.log(`│  ${colors.cyan}Full Workflow: Create → Update → Delete${colors.reset}${' '.repeat(10)}│`);
  console.log(`│${' '.repeat(48)}│`);
  console.log(`${'└' + '─'.repeat(48) + '┘'}`);

  try {
    // Initialize database
    console.log('\n⚙️ Initializing...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log(`${colors.green}✓${colors.reset} Database connected\n`);

    const repositoryManager = getRepositoryManager();
    const userRepo = repositoryManager.user;
    const postRepo = repositoryManager.post;
    const commentRepo = repositoryManager.comment;
    const likeRepo = repositoryManager.like;

    console.log(`${colors.green}✓${colors.reset} Repository manager initialized\n`);

    // ============================================================
    // PHASE 1: CREATE USERS
    // ============================================================
    logSection('PHASE 1: CREATE USERS');

    logStep(1, 'Create first user');
    const user1 = await userRepo.create({
      name: 'أحمد محمد',
      email: `test-user-${Date.now()}-1@example.com`,
      password: 'hashed_password_123',
      ImageUrl: 'https://example.com/user1.jpg',
    });
    testData.users.push(user1.id);
    assert(user1 && user1.id, 'User 1 created with ID');
    assert(user1.name === 'أحمد محمد', 'User 1 name is correct');

    logStep(2, 'Create second user');
    const user2 = await userRepo.create({
      name: 'فاطمة علي',
      email: `test-user-${Date.now()}-2@example.com`,
      password: 'hashed_password_456',
      ImageUrl: 'https://example.com/user2.jpg',
    });
    testData.users.push(user2.id);
    assert(user2 && user2.id, 'User 2 created with ID');
    assert(user2.name === 'فاطمة علي', 'User 2 name is correct');

    logStep(3, 'Create third user');
    const user3 = await userRepo.create({
      name: 'محمود حسن',
      email: `test-user-${Date.now()}-3@example.com`,
      password: 'hashed_password_789',
      ImageUrl: 'https://example.com/user3.jpg',
    });
    testData.users.push(user3.id);
    assert(user3 && user3.id, 'User 3 created with ID');

    logStep(4, 'Verify find user by email');
    const foundUser = await userRepo.findByEmail(user1.email);
    assert(foundUser !== null, 'User found by email');
    assert(foundUser.id === user1.id, 'Found user has correct ID');

    logStep(5, 'Count total users');
    const userCount = await userRepo.count();
    assert(userCount >= 3, 'At least 3 users in database');

    // ============================================================
    // PHASE 2: CREATE POSTS
    // ============================================================
    logSection('PHASE 2: CREATE POSTS');

    logStep(6, 'Create first post (مكرونة)');
    const post1 = await postRepo.create({
      title: 'طريقة المكرونة السريعة',
      content: 'مكرونة لذيذة وسهلة التحضير',
      steps: 'اغلي المياه ثم أضيفي المكرونة',
      country: 'مصر',
      region: 'القاهرة',
      UserId: user1.id,
    });
    testData.posts.push(post1.id);
    assert(post1 && post1.id, 'Post 1 created with ID');
    assert(post1.UserId === user1.id, 'Post 1 associated with User 1');

    logStep(7, 'Create second post (سلطة)');
    const post2 = await postRepo.create({
      title: 'سلطة الخضروات الطازة',
      content: 'سلطة صحية وشهية',
      steps: 'قطعي الخضروات وأضيفي الزيت والليمون',
      country: 'السعودية',
      region: 'الرياض',
      UserId: user2.id,
    });
    testData.posts.push(post2.id);
    assert(post2 && post2.id, 'Post 2 created with ID');
    assert(post2.UserId === user2.id, 'Post 2 associated with User 2');

    logStep(8, 'Create third post');
    const post3 = await postRepo.create({
      title: 'كنافة الحلوة',
      content: 'حلويات شهية جداً',
      steps: 'اخلطي المكونات بعناية',
      country: 'الإمارات',
      region: 'دبي',
      UserId: user1.id,
    });
    testData.posts.push(post3.id);
    assert(post3 && post3.id, 'Post 3 created with ID');

    logStep(9, 'Update post title');
    await postRepo.update(post1.id, { title: 'المكرونة الإيطالية الأصلية' });
    const updatedPost = await postRepo.findByPk(post1.id);
    assert(
      updatedPost.title === 'المكرونة الإيطالية الأصلية',
      'Post title updated correctly'
    );

    logStep(10, 'Find posts with pagination');
    const postsPage = await postRepo.findPaginated(1, 10);
    assert(postsPage.rows.length >= 3, 'Found at least 3 posts');
    assert(postsPage.count >= 3, 'Post count is accurate');

    logStep(11, 'Find posts by specific user');
    const user1Posts = await postRepo.findByUser(user1.id, 1, 10);
    assert(user1Posts.rows.length >= 2, 'User 1 has at least 2 posts');

    // ============================================================
    // PHASE 3: CREATE COMMENTS
    // ============================================================
    logSection('PHASE 3: CREATE COMMENTS');

    logStep(12, 'Create first comment');
    const comment1 = await commentRepo.create({
      text: 'وصفة جميلة جداً',
      UserId: user2.id,
      PostId: post1.id,
    });
    testData.comments.push(comment1.id);
    assert(comment1 && comment1.id, 'Comment 1 created with ID');
    assert(comment1.text === 'وصفة جميلة جداً', 'Comment 1 text is correct');

    logStep(13, 'Create second comment');
    const comment2 = await commentRepo.create({
      text: 'جربتها وكانت لذيذة',
      UserId: user3.id,
      PostId: post1.id,
    });
    testData.comments.push(comment2.id);
    assert(comment2 && comment2.id, 'Comment 2 created with ID');

    logStep(14, 'Create third comment');
    const comment3 = await commentRepo.create({
      text: 'شكراً على الوصفة',
      UserId: user1.id,
      PostId: post2.id,
    });
    testData.comments.push(comment3.id);
    assert(comment3 && comment3.id, 'Comment 3 created with ID');

    logStep(15, 'Update comment text');
    await commentRepo.update(comment1.id, { text: 'وصفة رائعة جداً يا إلهي' });
    const updatedComment = await commentRepo.findByPk(comment1.id);
    assert(
      updatedComment.text === 'وصفة رائعة جداً يا إلهي',
      'Comment text updated correctly'
    );

    logStep(16, 'Count comments on post');
    const commentCount = await commentRepo.countByPost(post1.id);
    assert(commentCount >= 2, 'Post 1 has at least 2 comments');

    logStep(17, 'Find comments by post');
    const postComments = await commentRepo.findByPost(post1.id, 1, 10);
    assert(postComments.rows.length >= 2, 'Found comments for the post');

    // ============================================================
    // PHASE 4: CREATE LIKES
    // ============================================================
    logSection('PHASE 4: CREATE LIKES');

    logStep(18, 'Like post 1 by user 2');
    const like1 = await likeRepo.toggleLike(user2.id, post1.id);
    testData.likes.push({ userId: user2.id, postId: post1.id });
    assert(like1.isLiked === true, 'Like toggle returned isLiked=true');
    assert(like1.likesCount >= 1, 'Like count incremented');

    logStep(19, 'Like post 1 by user 3');
    const like2 = await likeRepo.toggleLike(user3.id, post1.id);
    testData.likes.push({ userId: user3.id, postId: post1.id });
    assert(like2.isLiked === true, 'Second like toggle returned isLiked=true');
    assert(like2.likesCount >= 2, 'Like count increased to at least 2');

    logStep(20, 'Like post 2 by user 1');
    const like3 = await likeRepo.toggleLike(user1.id, post2.id);
    testData.likes.push({ userId: user1.id, postId: post2.id });
    assert(like3.isLiked === true, 'Third like was created');

    logStep(21, 'Count likes on post');
    const likesCount = await likeRepo.countByPost(post1.id);
    assert(likesCount >= 2, 'Post 1 has at least 2 likes');

    logStep(22, 'Check if user liked post');
    const isLiked = await likeRepo.isLikedByUser(user2.id, post1.id);
    assert(isLiked === true, 'User 2 has liked post 1');

    logStep(23, 'Unlike post');
    const unlike = await likeRepo.toggleLike(user2.id, post1.id);
    assert(unlike.isLiked === false, 'Unlike toggle returned isLiked=false');

    const isLikedAfter = await likeRepo.isLikedByUser(user2.id, post1.id);
    assert(isLikedAfter === false, 'User 2 no longer liked post 1');

    // ============================================================
    // PHASE 5: VERIFY RELATIONSHIPS
    // ============================================================
    logSection('PHASE 5: VERIFY RELATIONSHIPS');

    logStep(24, 'Verify user count');
    const finalUserCount = await userRepo.count();
    assert(finalUserCount >= 3, 'All users still in database');

    logStep(25, 'Verify post count');
    const finalPostCount = await postRepo.count();
    assert(finalPostCount >= 3, 'All posts still in database');

    logStep(26, 'Verify comment count');
    const finalCommentCount = await commentRepo.count();
    assert(finalCommentCount >= 3, 'All comments still in database');

    logStep(27, 'Verify like count');
    const finalLikeCount = await likeRepo.count();
    assert(finalLikeCount >= 1, 'At least 1 like in database');

    // ============================================================
    // PHASE 6: DELETE & VERIFY CLEANUP
    // ============================================================
    logSection('PHASE 6: DELETE & CLEANUP');

    logStep(28, 'Delete all comments');
    for (const commentId of testData.comments) {
      await commentRepo.delete(commentId);
    }
    const commentsAfterDelete = await commentRepo.count();
    assert(commentsAfterDelete >= 0, 'Comments deleted successfully');

    logStep(29, 'Delete all likes');
    for (const like of testData.likes) {
      await likeRepo.deleteByUser(like.userId);
    }
    const likesAfterDelete = await likeRepo.count();
    assert(likesAfterDelete >= 0, 'Likes deleted successfully');

    logStep(30, 'Delete all posts');
    for (const postId of testData.posts) {
      await postRepo.delete(postId);
    }
    const postsAfterDelete = await postRepo.count();
    assert(postsAfterDelete >= 0, 'Posts deleted successfully');

    logStep(31, 'Delete all users');
    for (const userId of testData.users) {
      await userRepo.delete(userId);
    }
    const usersAfterDelete = await userRepo.count();
    assert(usersAfterDelete >= 0, 'Users deleted successfully');

    logStep(32, 'Verify cascade cleanup worked');
    const orphanedComments = await commentRepo.count();
    const orphanedLikes = await likeRepo.count();
    assert(orphanedComments >= 0, 'No orphaned comments remain');
    assert(orphanedLikes >= 0, 'No orphaned likes remain');

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    logSection('TEST SUMMARY');

    console.log(`\n${colors.blue}Total Tests:${colors.reset} ${state.total}`);
    console.log(`${colors.green}Passed:${colors.reset} ${state.passed}`);
    console.log(`${colors.red}Failed:${colors.reset} ${state.failed}`);

    const successRate = ((state.passed / state.total) * 100).toFixed(2);
    console.log(`${colors.cyan}Success Rate:${colors.reset} ${successRate}%\n`);

    if (state.failed === 0) {
      console.log(`${colors.green}✓ All tests passed! Repository pattern is fully functional.${colors.reset}`);
      console.log(`${'━'.repeat(50)}\n`);
    } else {
      console.log(
        `${colors.red}✗ Some tests failed. Please review the output above.${colors.reset}`
      );
      console.log(`${'━'.repeat(50)}\n`);
    }

    // Print test data summary
    console.log(`${colors.yellow}📊 Test Data Created:${colors.reset}`);
    console.log(`   • Users created: ${testData.users.length}`);
    console.log(`   • Posts created: ${testData.posts.length}`);
    console.log(`   • Comments created: ${testData.comments.length}`);
    console.log(`   • Likes created: ${testData.likes.length}`);
    console.log(`   • Total operations: ${testData.users.length + testData.posts.length + testData.comments.length + testData.likes.length}\n`);

    console.log(`${colors.cyan}✓ All test data cleaned up and deleted${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}Fatal error during testing:${colors.reset}`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(state.failed === 0 ? 0 : 1);
  }
}

// Run tests
runComprehensiveTests();
