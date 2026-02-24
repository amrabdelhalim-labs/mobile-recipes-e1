# Testing Guide - وصفاتي

## Repository Pattern Testing Suite

This document explains how to run and verify the Repository Pattern implementation for the My Recipes application. The Repository Pattern provides a data abstraction layer that separates database operations from business logic.

---

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

Make sure your `.env` file has correct database configuration:

```env
DB_USER=postgres
DB_PASSWORD=123456
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myrecipes
NODE_ENV=development
JWT_SECRET=dev_jwt_secret_key_for_testing_only_32chars
```

### 3. Run Tests

**All Test Suites:**
```bash
npm run test:all
```

**Individual Test Suites:**

| Command | Suite | Coverage |
|---------|-------|----------|
| `npm test` | Basic Repository Tests | CRUD operations, 36 tests |
| `npm run test:comprehensive` | Full Lifecycle | Complete workflows, 43 tests |
| `npm run test:integration` | Integration Tests | Full app integration, 46 tests |
| `npm run test:e2e` | End-to-End API | HTTP endpoints, 7+ tests |

**Expected Output:**
- Green checkmarks for all passing tests
- 100% success rate
- No errors or warnings

---

## Testing Phases

### Phase 1: Automated Repository Tests (32 tests)

Commands:
```bash
npm test
```

Runs `tests/repositories.test.js` testing all repository operations:

**✓ User Repository (7 tests)**
- Create user
- Find by email
- Check email exists
- Find by primary key
- Update user
- Count users
- Database initialization

**✓ Post Repository (5 tests)**
- Create post
- Find all posts with user (paginated)
- Find posts by specific user
- Find post with full details
- Update post

**✓ Comment Repository (4 tests)**
- Create comment
- Find comments by post
- Find comments by user
- Update comment text
- Count comments on post

**✓ Like Repository (6 tests)**
- Toggle like (create/delete)
- Find likes by post
- Count likes on post
- Check if user liked post
- Like count accuracy
- Like operations validation

**✓ Repository Manager (5 tests)**
- Health check for all repositories
- Verify singleton pattern
- Access all repositories

**✓ Cascade Operations (3 tests)**
- Delete comment with cascade
- Delete post with cascade
- Delete user with cascade

**✓ Cleanup & Verification (2 tests)**
- All orphaned records removed
- Database consistency verified

---

### Phase 2: Comprehensive Integration Test (43 tests)

Commands:
```bash
npm run test:comprehensive
```

Performs a complete end-to-end workflow testing full data lifecycle:

**🧪 6-Phase Full Lifecycle Testing:**

**Phase 1: CREATE USERS (5 tests)**
- Create 3 test users with Arabic names
- Find users by email
- Verify email lookup
- Find by primary key
- Count total users in database

**Phase 2: CREATE POSTS (6 tests)**
- Create 3 posts by different users
- Verify post-user associations
- Update post titles
- Find posts with pagination
- Find posts by specific user
- Verify post count accuracy

**Phase 3: CREATE COMMENTS (6 tests)**
- Create 3 comments on posts
- Verify comment text
- Update comment content
- Count comments by post
- Find comments by user ID
- Find comments with user details

**Phase 4: CREATE LIKES (6 tests)**
- Like posts (toggle create)
- Verify like count increments
- Unlike posts (toggle remove)
- Verify like count decrements
- Count likes on specific post
- Check if user liked post

**Phase 5: VERIFY RELATIONSHIPS (4 tests)**
- Verify all users still in database
- Verify all posts still in database
- Verify all comments still in database
- Verify at least 1 like in database

**Phase 6: DELETE & CLEANUP (10 tests)**
- Delete all comments created
- Verify comments deleted
- Delete all likes created
- Verify likes deleted
- Delete all posts created
- Verify posts deleted
- Delete all users created
- Verify users deleted
- Verify no orphaned comments
- Verify no orphaned likes

**Expected Output:**
```
Total Tests: 43
Passed: 43
Failed: 0
Success Rate: 100.00%

✓ All tests passed! Repository pattern is fully functional.

📊 Test Data Created:
   • Users created: 3
   • Posts created: 3
   • Comments created: 3
   • Likes created: 3+
   • Total operations: 12+

✓ All test data cleaned up and deleted
```

---

## What Gets Tested

The comprehensive test suites verify:

1. **✓ Data Creation** - Creating users, posts, comments, likes
2. **✓ Data Retrieval** - Finding data by various criteria (ID, email, user, post)
3. **✓ Data Updates** - Modifying existing records
4. **✓ Data Deletion** - Removing records and cascade cleanup
5. **✓ Relationships** - Verifying associations between data entities
6. **✓ Pagination** - Testing pagination and count operations
7. **✓ Storage Integration** - File upload, management, deletion
8. **✓ Temp Workspace** - Handling special characters in paths (Arabic, etc)
9. **✓ Lifecycle** - Full journey from creation to cleanup
10. **✓ Database Integrity** - Transaction consistency and cleanup
11. **✓ Server Readiness** - All components verified for production

---

## Test Scripts Summary

| Script | Tests | Coverage | Best For |
|--------|-------|----------|----------|
| `npm test` | 32 | Repository operations | Quick validation |
| `npm run test:comprehensive` | 43 | Full CRUD lifecycle | Development testing |
| `npm run test:full-stack` | 46 | Complete integration | Pre-deployment check |
| `npm run test:all` | 121 | All tests combined | Final verification |

---

## Success Criteria

Your tests are 100% successful when:

✅ **All Automated Tests Pass** (32/32)
- npm test shows "Success Rate: 100.00%"
- No error messages in output
- All repository operations work

✅ **All Integration Tests Pass** (43/43)
- npm run test:comprehensive shows all 43 tests passing
- Creates and deletes all test data successfully
- No database integrity issues

✅ **No Database Errors**
- Database connection succeeds
- All queries execute properly
- Transactions complete cleanly

✅ **Data Cleanup Works**
- All test data is removed after each run
- No orphaned records in database
- Next test run starts fresh

✅ **Performance Acceptable**
- Tests complete within 30-60 seconds
- No N+1 query problems
- Database responds quickly

**✓ Repository Manager**
- Health checks for all repositories

**✓ Cascade Operations**
- Delete with cascade cleanup
- Verify orphaned records are removed

---

### Phase 2: Comprehensive Integration Test

Commands:
```bash
npm run test:comprehensive
```

This runs `tests/comprehensive-test.js` which performs a complete end-to-end workflow:

**🧪 Full Lifecycle Testing:**

1. **Create Users** (3 users)
   - Create multiple users with Arabic names
   - Find users by email
   - Count users

2. **Create Posts** (3 posts)
   - Create posts by different users
   - Update post titles
   - Find posts with pagination
   - Find posts by user

3. **Create Comments** (3 comments)
   - Create comments on posts
   - Update comment text
   - Count comments
   - Find comments by post

4. **Create Likes** (3+ likes)
   - Toggle likes (create/remove)
   - Count likes
   - Check if user liked post
   - Verify like count updates

5. **Verify Relationships**
   - Ensure all data persists
   - Check counts match

6. **Delete & Cleanup**
   - Delete all comments
   - Delete all likes
   - Delete all posts
   - Delete all users
   - Verify cascade deletion worked
   - Confirm no orphaned records remain

**Expected Output:**
```
Total Tests: 43
Passed: 43
Failed: 0
Success Rate: 100.00%

✓ All tests passed! Repository pattern is fully functional.

📊 Test Data Created:
   • Users created: 3
   • Posts created: 3
   • Comments created: 3
   • Likes created: 3
   • Total operations: 12

✓ All test data cleaned up and deleted
```

**✓ Repository Manager**
- Health check all repositories
- Verify singleton pattern

**✓ Cascade Operations**
- Delete comment with cascade
- Delete post with cascade
- Delete user with cascade

---

### Phase 2: Local Server Testing

Start the development server:

```bash
npm run dev
```

Expected output:
```
Server running on port 4000
Database connected successfully
✓ Repository manager initialized
```

---

### Phase 3: API Endpoint Testing

Use Postman, Thunder Client, or curl to test endpoints.

#### Authentication

**Register:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Posts

**Create Post:**
```bash
curl -X POST http://localhost:4000/api/posts \
  -H "Authorization: Bearer [token]" \
  -F "title=Test Recipe" \
  -F "content=Test content" \
  -F "country=Egypt" \
  -F "region=Cairo" \
  -F "files=@image1.jpg"
```

**Get All Posts:**
```bash
curl -X GET "http://localhost:4000/api/posts?page=1&limit=10" \
  -H "Authorization: Bearer [token]"
```

**Get Post Details:**
```bash
curl -X GET http://localhost:4000/api/posts/1 \
  -H "Authorization: Bearer [token]"
```

#### Comments

**Add Comment:**
```bash
curl -X POST http://localhost:4000/api/comments/1 \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"text": "Great recipe!"}'
```

#### Likes

**Toggle Like:**
```bash
curl -X POST http://localhost:4000/api/likes/1 \
  -H "Authorization: Bearer [token]"
```

---

## What Gets Tested

### 1. **Data Access Layer (Repositories)**
- ✓ CRUD operations work correctly
- ✓ Pagination implemented and working
- ✓ Associations/relationships intact
- ✓ Error handling proper

### 2. **Business Logic (Controllers)**
- ✓ Controllers use repositories
- ✓ No direct model access
- ✓ Authorization working
- ✓ Validation proper

### 3. **Database Integrity**
- ✓ Foreign keys maintained
- ✓ Cascade operations working
- ✓ Data consistency preserved
- ✓ Transactions handled

### 4. **Integration Points**
- ✓ Repositories work with Storage Service
- ✓ Image upload/deletion works
- ✓ User authentication integrated
- ✓ Response formatting correct

### 5. **Error Handling**
- ✓ 401 for unauthorized access
- ✓ 403 for forbidden operations
- ✓ 404 for not found resources
- ✓ 400 for validation errors
- ✓ 500 with meaningful errors

---

## Success Criteria

### ✓ All tests pass
- All 50+ repository tests pass
- 100% success rate

### ✓ No database errors
- No constraint violations
- No orphaned records
- Cascade operations clean

### ✓ API responses correct
- Correct HTTP status codes
- Data properly formatted
- Relationships included

### ✓ Authorization works
- Only authenticated users can create/update/delete
- Users can only modify their own data
- Token validation working

### ✓ Performance acceptable
- Response times < 1 second
- No N+1 query problems
- Memory usage stable

---

## Troubleshooting

### "Database connection failed"
- Check `.env` file
- Verify PostgreSQL running
- Verify database exists
- Check credentials

### "Repository not initialized"
- Verify `server/repositories/index.js` exists
- Check imports in controllers
- Verify `getRepositoryManager()` called

### "Model not found"
- Check model files in `server/models/`
- Verify exports correct
- Check associations defined

### "Test failures"
- Read error message carefully
- Check database state
- Verify clean state between tests
- Check cascading deletions

---

## File Structure

```
server/
├── repositories/
│   ├── base.repository.js           # Generic CRUD
│   ├── repository.interface.js      # Contract definition
│   ├── index.js                     # Repository Manager
│   ├── user.repository.js           # User-specific operations
│   ├── post.repository.js           # Post-specific operations
│   ├── comment.repository.js        # Comment operations
│   ├── like.repository.js           # Like operations
│   └── post-image.repository.js     # Image operations
│
├── controllers/
│   ├── user.controller.js           # Updated with repositories
│   ├── post.controller.js           # Updated with repositories
│   ├── comment.controller.js        # Updated with repositories
│   └── like.controller.js           # Updated with repositories
│
├── tests/
│   ├── repositories.test.js         # Automated repository tests
│   └── integration-guide.js         # Manual integration steps
│
└── models/                          # No changes needed
```

---

## Next Steps

After all tests pass:

1. **Review Code Quality**
   - Check for console.logs
   - Verify error messages
   - Review performance

2. **Create Production Build**
   - Run full test suite
   - Check for deprecations
   - Verify dependencies

3. **Deploy**
   - Tag release
   - Push to GitHub
   - Deploy to production
   - Verify in production

---

## Support

For issues or questions:
1. Check error messages carefully
2. Review test output
3. Check database state
4. Verify environment setup
5. Review documentation

---

## License

MIT License - See LICENSE file

---

## Client-Side Testing (Vitest)

The client app uses **Vitest** with **jsdom** for unit testing and **Cypress** for E2E testing.

### Quick Start

```bash
cd app
npm install
npm test          # Run all unit tests once
npm run test:watch    # Watch mode (re-runs on changes)
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run Cypress E2E tests
```

### Test Files

| File | Tests | Purpose |
|------|-------|---------|
| `tests/types.test.ts` | 8 | Verify TypeScript types match server API responses |
| `tests/urls.test.ts` | 14 | Verify URL constants match server routes |
| `tests/postsEvents.test.ts` | 5 | Custom event bus (emit, subscribe, cleanup) |
| `tests/usePhotoGallery.test.ts` | 4 | Camera hook (capture, clear, error handling) |
| `tests/axios.test.ts` | 5 | API client config (baseURL, headers, interceptors) |
| `App.test.tsx` | 1 | Smoke test — app renders without errors |
| **Total** | **37** | |

### Setup

The `setupTests.ts` file configures:
- `@testing-library/jest-dom` matchers
- `window.matchMedia` mock (required by Ionic)
- Capacitor mocks: `Preferences`, `Camera`, `Geolocation`

### Expected Output

```
 ✓ src/tests/types.test.ts (8)
 ✓ src/tests/urls.test.ts (14)
 ✓ src/tests/postsEvents.test.ts (5)
 ✓ src/tests/usePhotoGallery.test.ts (4)
 ✓ src/tests/axios.test.ts (5)
 ✓ src/App.test.tsx (1)

 Test Files  6 passed (6)
      Tests  37 passed (37)
```

---

**Last Updated:** February 23, 2026  
**Repository Pattern Version:** 1.0.0  
**Client Tests:** 37 unit tests (Vitest) + E2E (Cypress)  
**App Version:** وصفاتي
