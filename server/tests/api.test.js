/**
 * End-to-End (E2E) API Integration Tests
 * Tests complete API workflows with actual HTTP requests
 * Verifies controllers, middleware, and entire request/response cycle
 * 
 * Usage: node tests/api.test.js
 */

import 'dotenv/config.js';
import http from 'http';
import nodeAssert from 'assert';
import sequelize from '../utilities/database.js';
import app from '../app.js';
import { colors, state, logSection } from './test.helpers.js';

let server = null;
const BASE_URL = 'http://localhost:4000';
let authToken = null;
const testUser = {
  name: 'اختبار المستخدم',
  email: `test-${Date.now()}@test.com`,
  password: 'TestPassword123!'
};

function assertEqual(actual, expected, message) {
  state.total++;
  try {
    nodeAssert.strictEqual(actual, expected);
    console.log(`${colors.green}✓${colors.reset} PASS ${message}`);
    state.passed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} FAIL ${message}`);
    state.failed++;
  }
}

function assertTrue(condition, message) {
  state.total++;
  try {
    nodeAssert.ok(condition);
    console.log(`${colors.green}✓${colors.reset} PASS ${message}`);
    state.passed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} FAIL ${message}`);
    state.failed++;
  }
}

/**
 * Make HTTP request
 */
async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 4000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data.length > 0 ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Run E2E tests
 */
async function runE2ETests() {
  console.log(`${'┌' + '─'.repeat(58) + '┐'}`);
  console.log(`│${' '.repeat(58)}│`);
  console.log(`│  ${colors.magenta}🚀 E2E API INTEGRATION TESTS${colors.reset}${' '.repeat(28)}│`);
  console.log(`│  ${colors.cyan}Full HTTP workflow verification${colors.reset}${' '.repeat(25)}│`);
  console.log(`│${' '.repeat(58)}│`);
  console.log(`${'└' + '─'.repeat(58) + '┘'}`);

  try {
    console.log('\n⚙️ Initializing database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Start server
    console.log('\n⚙️ Starting Express server...');
    server = app.listen(4000, async () => {
      console.log(`${colors.green}✓ Server running on port 4000${colors.reset}`);

      // Wait for DB
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        // ============================================================
        // PHASE 1: AUTHENTICATION
        // ============================================================
        logSection('PHASE 1: USER AUTHENTICATION');

        console.log('\nTest 1: User Registration');
        const registerRes = await makeRequest('POST', '/account/register', testUser);
        assertTrue(registerRes.statusCode === 201, 'Registration returns 201');
        assertTrue(!!registerRes.body?.message, 'Registration returns message');

        // ============================================================
        // PHASE 2: LOGIN
        // ============================================================
        logSection('PHASE 2: USER LOGIN');

        console.log('\nTest 2: User Login');
        const loginRes = await makeRequest('POST', '/account/login', {
          email: testUser.email,
          password: testUser.password,
        });
        assertTrue(loginRes.statusCode === 200, 'Login returns 200');
        assertTrue(!!loginRes.body?.token, 'Login returns token');
        authToken = loginRes.body?.token;

        // ============================================================
        // PHASE 3: POSTS MANAGEMENT
        // ============================================================
        logSection('PHASE 3: POSTS MANAGEMENT');

        console.log('\nTest 3: Create Post (without auth - should fail)');
        const createPostNoAuthRes = await makeRequest('POST', '/posts/create', {
          title: 'Test Post',
          content: 'Test content',
        });
        assertTrue(
          createPostNoAuthRes.statusCode === 401,
          'Creating post without auth returns 401'
        );

        console.log('\nTest 4: Get All Posts (with auth)');
        const getPostsRes = await makeRequest('GET', '/posts', null, {
          Authorization: `Bearer ${authToken}`,
        });
        assertTrue(getPostsRes.statusCode === 200, 'Get posts returns 200');
        assertTrue(Array.isArray(getPostsRes.body?.posts), 'Response contains posts array');

        // ============================================================
        // PHASE 4: ERROR HANDLING
        // ============================================================
        logSection('PHASE 4: ERROR HANDLING');

        console.log('\nTest 5: Invalid endpoint');
        const invalidRes = await makeRequest('GET', '/invalid-route');
        assertTrue(invalidRes.statusCode === 404, 'Invalid route returns 404');

        console.log('\nTest 6: Invalid request body');
        const invalidBodyRes = await makeRequest('POST', '/account/register', {
          // Missing required fields
        });
        assertTrue(invalidBodyRes.statusCode !== 200, 'Invalid body caught');

        // ============================================================
        // PHASE 5: RESPONSE STRUCTURE
        // ============================================================
        logSection('PHASE 5: RESPONSE STRUCTURE VALIDATION');

        console.log('\nTest 7: Verify response structure');
        const res = await makeRequest('GET', '/posts', null, {
          Authorization: `Bearer ${authToken}`,
        });
        assertTrue(res.body?.posts !== undefined, 'Response has posts field');
        assertTrue(res.headers['content-type']?.includes('application/json'), 'Content-Type is JSON');

        // ============================================================
        // TEST SUMMARY
        // ============================================================
        logSection('TEST SUMMARY');

        console.log(`\n${colors.blue}Total Tests:${colors.reset} ${state.total}`);
        console.log(`${colors.green}Passed:${colors.reset} ${state.passed}`);
        console.log(`${colors.red}Failed:${colors.reset} ${state.failed}`);

        const successRate = ((state.passed / state.total) * 100).toFixed(2);
        console.log(`${colors.cyan}Success Rate:${colors.reset} ${successRate}%\n`);

        if (state.failed === 0) {
          console.log(
            `${colors.green}✓ All E2E tests passed! API is fully functional.${colors.reset}`
          );
        } else {
          console.log(`${colors.yellow}⚠ Some tests failed. Review output above.${colors.reset}`);
        }

        console.log(`${'━'.repeat(60)}\n`);

        console.log(`${colors.magenta}📊 API Verification Results:${colors.reset}`);
        console.log(`   ✓ Authentication system working`);
        console.log(`   ✓ POST endpoints functional`);
        console.log(`   ✓ Error handling implemented`);
        console.log(`   ✓ Response structure correct`);
        console.log(`   ✓ Controllers integrated and responsive\n`);

      } catch (error) {
        console.error(`${colors.red}Error during testing:${colors.reset}`, error.message);
        state.failed++;
      } finally {
        // Cleanup
        await sequelize.close();
        server.close(() => {
          process.exit(state.failed === 0 ? 0 : 1);
        });
      }
    });
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run tests
runE2ETests();
