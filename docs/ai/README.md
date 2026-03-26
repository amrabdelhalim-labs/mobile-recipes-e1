# AI Documentation — وصفاتي (mobile-recipes-e1)

> **Purpose:** Entry point for AI tools working on this project. Read this first, then follow
> the links below for the specific context you need.
>
> **Project name in prose:** وصفاتي  
> **Folder:** `mobile-recipes-e1/`  
> **Last reviewed:** 2026-02-28

---

## Quick Identity

| Property | Value |
|----------|-------|
| App name | **وصفاتي** |
| Type | Recipe sharing mobile app (PWA + Android via Capacitor) |
| Server stack | Node.js · **JavaScript ESM** · Express 5 · PostgreSQL/Sequelize |
| API style | **REST** (`/account`, `/posts`, `/comments`, `/likes`) |
| Client stack | Ionic React · TypeScript · Vite · Capacitor |
| Auth | JWT via `Preferences` (Capacitor) — NOT localStorage |
| HTTP client | Axios (with interceptor that auto-injects token) |
| Architecture | Repository Pattern (JavaScript/Sequelize) + Storage Strategy Pattern |
| Testing — server | Node.js (ESM, no framework) custom helpers |
| Testing — client | Vitest + @testing-library/react |
| Deployment | GitHub Pages/Heroku + Docker delivery workflow |

---

## AI Docs in This Folder

| File | When to Use |
|------|-------------|
| [`architecture.md`](./architecture.md) | Before making any change — understand the full layer structure |
| [`feature-guide.md`](./feature-guide.md) | Adding a new entity/feature end-to-end |

---

## Critical Rules (Non-Negotiable)

1. **Never import a Sequelize model directly in a controller** — all data access through `getRepositoryManager()` from `../repositories/index.js`
2. **Route middleware order is fixed**: `isAuthenticated` → `upload` (if file) → `validatorArray` → `validateRequest` → `controller`
3. **Validators use `express-validator`** (`body()` chains) — never inline validation in controllers
4. **`validateRequest` middleware cleans up uploaded files on validation failure** — always apply it after validators
5. **Auth token stored via `Preferences` (Capacitor)** — never use `localStorage` in the client
6. **Storage is accessed via `getStorageService()`** — never instantiate or use `StorageService` directly
7. **All URL constants live in `app/src/config/urls.ts`** — never hardcode paths in components/pages
8. **HTTP requests use the `api` axios instance** from `app/src/config/axios.ts` — never use raw `fetch` or `axios` directly
9. **All Sequelize associations go through `model.associate(models)` in `models/index.js`** — never set associations inside the model files
10. **All entity repositories are ES module singletons** — use `get{Entity}Repository()` factory functions
11. **No Arabic characters inside code fences in documentation** — the Arabic comma `,` (U+060C) and other Arabic punctuation trigger the Unicode Bidi algorithm, causing code blocks to render right-to-left. Use only Latin punctuation inside `` ``` `` blocks. Arabic is allowed only in code **comments** (`// عربي`). See `docs/ai-patterns-reference.md §10` for the full rule.
12. **First line of every code block must start with a Latin character** — The Unicode Bidi Algorithm sets a code block's render direction from its **first strong-directional character**. If the first non-empty line starts with Arabic text (even inside a `// comment`), the **entire block** renders right-to-left. **Rule:** always put a real code line (`import`, `const`, class declaration…) on line 1 and move Arabic label comments to line 2+. Emoji (`✅`, `❌`) and `//` are Bidi-neutral and do **not** protect against this. See `docs/ai-tutorials-guide.md §2.6`.

---

## Key File Locations

### Server
```text
server/
├── app.js                          ← Express entry point (CORS, middleware, health check, error handler)
├── routes/
│   ├── index.js                    ← Mounts all routers (/account, /posts, /comments, /likes)
│   ├── user.routes.js              ← Auth + profile routes
│   ├── post.routes.js              ← Post CRUD routes
│   ├── comment.routes.js           ← Comment routes
│   └── like.routes.js              ← Like toggle routes
├── controllers/
│   ├── user.controller.js          ← register, login, profile ops
│   ├── post.controller.js          ← newPost, getAllPosts, getPostById, updatePost, deletePost
│   ├── comment.controller.js       ← addComment, updateComment, deleteComment
│   └── like.controller.js          ← toggleLike, getPostLikes, getMyLikes
├── validators/
│   ├── user.validator.js           ← newUser, updateInfo, updatePassword (express-validator arrays)
│   ├── post.validator.js           ← newPost, updatePost (express-validator arrays)
│   └── comment.validator.js        ← newComment, updateComment
├── middlewares/
│   ├── user.middleware.js          ← isAuthenticated (JWT from Authorization header)
│   └── validator.middleware.js     ← validateRequest (runs validationResult + file cleanup)
├── models/
│   ├── index.js                    ← Imports all models + runs associate(models) pattern
│   ├── users.model.js              ← User (id, name, email, password, ImageUrl)
│   ├── posts.model.js              ← Post (id, title, content, steps, country, region, UserId)
│   ├── postImages.model.js         ← Post_Image (id, imageUrl, PostId)
│   ├── comments.model.js           ← Comment (id, content, UserId, PostId)
│   └── likes.model.js              ← Like (id, UserId, PostId)
├── repositories/
│   ├── repository.interface.js     ← JSDoc IRepository typedef (documentation only)
│   ├── base.repository.js          ← BaseRepository class with generic Sequelize ops
│   ├── user.repository.js          ← findByEmail, emailExists, createAndReturn
│   ├── post.repository.js          ← findAllWithUser, findByUser, findWithDetails, createWithImages
│   ├── post-image.repository.js    ← createMany, deleteByPost
│   ├── comment.repository.js       ← findByPost, findByUser, deleteByPost
│   ├── like.repository.js          ← toggleLike, userHasLiked, countByPost
│   └── index.js                    ← RepositoryManager + getRepositoryManager()
├── services/storage/
│   ├── storage.interface.js        ← IStorageStrategy interface (JSDoc)
│   ├── local.strategy.js           ← LocalStorageStrategy (saves to public/images/)
│   ├── cloudinary.strategy.js      ← CloudinaryStrategy (uploads to Cloudinary)
│   ├── s3.strategy.js              ← S3Strategy (uploads to AWS S3)
│   └── storage.service.js          ← StorageService singleton (selects strategy from STORAGE_TYPE env)
├── utilities/
│   ├── database.js                 ← Sequelize instance (supports DATABASE_URL or individual params)
│   ├── files.js                    ← multer config + imagesRoot + extractFileName + getStorageService
│   └── jwt.js                      ← sign(payload) + verify(token) wrappers
└── tests/
    ├── test.helpers.js             ← assert, logSection, logStep, printSummary (same pattern as web-booking)
    ├── repositories.test.js        ← Unit tests for all repository methods
    ├── comprehensive.test.js       ← Integration workflow (create user → posts → comments → likes → cascades)
    ├── integration.test.js         ← REST API integration tests
    └── api.test.js                 ← E2E via real HTTP requests against test server
```

### Client
```text
app/src/
├── App.tsx                         ← AuthContextProvider wrapper + IonReactRouter routing
├── AppTabs.tsx                     ← IonTabs (Home, MyPosts, Likes, Profile tabs)
├── config/
│   ├── axios.ts                    ← Axios instance (baseURL = API_URL, Bearer token interceptor)
│   └── urls.ts                     ← All route URL constants (strings + functions for dynamic routes)
├── context/
│   ├── auth.types.ts               ← AuthContext + UserProfile + AuthContextType definitions
│   └── AuthContext.tsx             ← AuthContextProvider (useEffect auth check, login, logout, fetchProfile)
├── hooks/
│   └── (custom hooks per feature, e.g., usePhotoGallery.ts)
├── types/
│   ├── post.types.ts               ← PostData, PostDetail, CommentData, etc.
│   └── user.types.ts               ← UserData, ProfileData, etc.
├── pages/                          ← Route-level page components
├── components/                     ← Reusable UI components (Ionic-aware)
├── utils/                          ← Utility functions
└── tests/                          ← Vitest test files
```

---

## REST API Reference

### Auth Routes (`/account`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/account/register` | No | Create account |
| POST | `/account/login` | No | Login, returns JWT |
| GET | `/account/profile` | Yes | Get current user profile |
| PUT | `/account/profile/info` | Yes | Update name/bio |
| PUT | `/account/profile/image` | Yes | Upload profile image |
| DELETE | `/account/profile/image/reset` | Yes | Remove profile image |
| DELETE | `/account/profile` | Yes | Delete account + cascade |

### Post Routes (`/posts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/posts/create` | Yes | Create post with images (multipart) |
| GET | `/posts` | Yes | Get all posts (paginated) |
| GET | `/posts/me` | Yes | Get current user's posts |
| GET | `/posts/:id` | Yes | Get post with full details |
| PUT | `/posts/:id` | Yes | Update post + manage images |
| DELETE | `/posts/:id` | Yes | Delete post + cascade |

### Comment Routes (`/comments`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/comments/:postId` | Yes | Add comment |
| GET | `/comments/me` | Yes | Get my comments |
| PUT | `/comments/:id` | Yes | Update comment (owner only) |
| DELETE | `/comments/:id` | Yes | Delete comment (owner only) |

### Like Routes (`/likes`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/likes/:postId` | Yes | Toggle like (like/unlike) |
| GET | `/likes/me` | Yes | Get my liked posts |
| GET | `/likes/:postId` | Yes | Get likes for a post |

---

## Test Scripts

```bash
# Server (from server/)
npm run test              # repositories.test.js (36 tests)
npm run test:comprehensive # comprehensive.test.js (43 tests)
npm run test:integration  # integration.test.js (46 tests) — requires running server
npm run test:e2e          # api.test.js (7+ E2E tests)
npm run test:storage      # storage.test.js (48 unit tests — no network required)
npm run test:all          # all five sequentially

# Client (from app/)
npm run test              # vitest run (all tests)
npm run test:all          # all tests
```

---

## Environment Variables

### Server (`server/.env`)
```text
PORT=3000
NODE_ENV=development
DB_NAME=wosafati_dev
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432
# OR use DATABASE_URL for production:
# DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_jwt_secret
CORS_ORIGINS=http://localhost:5173,http://localhost:8100
STORAGE_TYPE=local  # local | cloudinary | s3
# Cloudinary (if STORAGE_TYPE=cloudinary):
# Option A — Heroku addon (sets CLOUDINARY_URL automatically):
# CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# Option B — manual:
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=mobile-recipes  # optional
# S3 (if STORAGE_TYPE=s3):
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=...
AWS_REGION=...
```

### Client (`app/.env`)
```text
VITE_API_URL=http://localhost:3000
```

---

*See [`architecture.md`](./architecture.md) for the full layer diagram and pattern details.*  
*See [`feature-guide.md`](./feature-guide.md) for step-by-step instructions when adding a new feature.*
