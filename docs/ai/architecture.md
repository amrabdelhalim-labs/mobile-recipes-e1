# Architecture Reference — وصفاتي (mobile-recipes-e1)

> Read this before touching any code. The architecture is intentional and consistent —
> every new feature must follow the same patterns.

---

## 1. Layer Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                 CLIENT (Ionic React / TypeScript)               │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  Pages   │  │  Components  │  │  Context / Hooks        │  │
│  └────┬─────┘  └──────┬───────┘  └──────────┬──────────────┘  │
│       │               │                     │                  │
│       └───────────────┴─────────────────────┘                  │
│                       │ Axios (api instance)                    │
│               auto Bearer token via interceptor                 │
└───────────────────────┼────────────────────────────────────────┘
                        │ REST (HTTP)
┌───────────────────────┼────────────────────────────────────────┐
│                 SERVER (Node.js / JavaScript ESM)               │
│                        │                                       │
│             ┌──────────▼──────────┐                            │
│             │    Express Router    │                            │
│             │  /account /posts    │                            │
│             │  /comments /likes   │                            │
│             └──────────┬──────────┘                            │
│                        │                                       │
│  ┌─────────────────────▼──────────────────────────────┐        │
│  │           Route Middleware Chain                     │        │
│  │  isAuthenticated → upload? → validators → validateRequest    │
│  └─────────────────────┬──────────────────────────────┘        │
│                        │                                       │
│             ┌──────────▼──────────┐                            │
│             │    Controllers       │                            │
│             └────┬─────────┬──────┘                            │
│                  │         │                                   │
│      ┌───────────▼──┐  ┌───▼────────────┐                     │
│      │  Validators   │  │Repository Mgr  │                     │
│      │ (express-val) │  │getRepositoryMgr│                     │
│      └───────────────┘  └──────┬─────────┘                     │
│                                │                               │
│              ┌─────────────────┼─────────────────┐            │
│      ┌───────▼──┐  ┌───────▼──┐  ┌──────▼──┐  ┌──▼────────┐  │
│      │   User   │  │   Post   │  │ Comment │  │   Like    │  │
│      │   Repo   │  │   Repo   │  │  Repo   │  │   Repo    │  │
│      └───┬───────┘  └───┬──────┘  └────┬────┘  └───┬───────┘  │
│          └──────────────┼──────────────┴────────────┘          │
│                         │ Sequelize                            │
│                ┌────────▼──────────┐                           │
│                │    PostgreSQL      │                           │
│                └───────────────────┘                           │
│                                                                │
│  File Operations:                                              │
│  Controllers → getStorageService() → StorageService singleton  │
│                → selects strategy (local/cloudinary/s3)        │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Server Architecture Details

### 2.1 Entry Point (`server/app.js`)

Key behaviors:
- CORS: reads `CORS_ORIGINS` env (comma-separated) or defaults to `localhost:5173,8100`
- Morgan dev logger loaded dynamically (only in `development`)
- Express 5 body parser: `json({ limit: '1mb' })`
- Static file serving: `/images` → `public/images/`
- Health check: `GET /health` → `{ status: 'OK', ... }`
- Global error handler: handles `MulterError`, Arabic error messages, 500 fallback
- Server init: `db.authenticate()` → Sequelize sync → `httpServer.listen(PORT)`

**Important:** The server uses `node:https` for HTTPS capability — if `SSL_KEY_PATH` and `SSL_CERT_PATH` are set, it starts an HTTPS server.

### 2.2 Database (`server/utilities/database.js`)

Sequelize instance configured two ways:
```javascript
// Production (DATABASE_URL):
new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', ssl: true })

// Development (individual params):
new Sequelize(DB_NAME, DB_USER, DB_PASS, { host, port, dialect: 'postgres' })
```

### 2.3 Model Associations (`server/models/index.js`)

**Critical:** All Sequelize associations run through the `associate(models)` pattern:
```javascript
// Each model defines:
static associate(models) {
  Post.belongsTo(models.User, { as: 'User' });
  Post.hasMany(models.Post_Image, { as: 'images', foreignKey: 'PostId' });
  // etc.
}

// models/index.js loads all models then calls:
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});
```

**Never define associations inside the model file's body** — only inside `associate()`.

### 2.4 Repository Pattern (JavaScript/Sequelize)

#### Base Repository (`base.repository.js`)
- Plain JavaScript class (no generics)
- `findAll(options)`, `findOne(options)`, `findByPk(id, options)`
- `findPaginated(page, limit, options)` → uses `findAndCountAll({ distinct: true })`
- `create(data)`, `update(id, data)` → returns plain object `{ toJSON }` or null
- `delete(id)`, `exists(id)`, `count(options)`
- Error logging: all methods wrap in try/catch, `console.error`, rethrow

#### Entity Repositories — Naming Convention (same as workspace standard)

| Pattern | Example |
|---------|---------|
| `findBy{Field}` | `findByEmail()` |
| `findAllWith{Rel}` | `findAllWithUser()` |
| `findWith{Details}` | `findWithDetails()` |
| `{field}Exists()` | `emailExists()`, `userHasLiked()` |
| `createAnd{Action}` | `createWithImages()` |
| `deleteBy{Entity}` | `deleteByPost()` |
| `toggleLike()` | toggle pattern (like/unlike) |
| `countBy{Field}` | `countByPost()` |

#### Repository Manager (`repositories/index.js`)
```javascript
const repos = getRepositoryManager();
repos.user.findByEmail(email)
repos.post.findAllWithUser(page, limit)
repos.post.findWithDetails(postId)
repos.like.userHasLiked(userId, postId)
repos.comment.deleteByPost(postId)
```

### 2.5 Route + Middleware Chain

**Mandatory order for protected routes with file upload:**
```javascript
router.post('/create',
  middleware.isAuthenticated,        // 1. Verify JWT → set req.currentUser
  upload.array('fieldName', maxCount), // 2. Parse multipart (optional)
  validator.newEntity,               // 3. express-validator array
  validateRequest,                   // 4. Runs validationResult + file cleanup on error
  controller.createEntity            // 5. Business logic
);
```

**For routes without file upload:**
```javascript
router.post('/new',
  middleware.isAuthenticated,
  validator.newEntity,
  validateRequest,
  controller.createEntity
);
```

**For public routes (no auth):**
```javascript
router.post('/register', validator.newUser, validateRequest, controller.register);
```

### 2.6 Authentication Middleware (`middlewares/user.middleware.js`)

```javascript
// JWT from Authorization header (Bearer TOKEN):
const token = authHeader.split(' ')[1];
const decoded = jwt.verify(token);   // from utilities/jwt.js
req.currentUser = decoded;           // { id, name, email, ... }
return next();
```

**In controllers:** always use `req.currentUser?.id` (optional chaining for safety).

### 2.7 Validators (`validators/*.validator.js`)

Uses `express-validator`'s `body()` chains:
```javascript
// validators/post.validator.js
export const newPost = [
  body('title').notEmpty().withMessage('العنوان مطلوب')
    .isString().trim()
    .isLength({ min: 3, max: 200 }).withMessage('العنوان يجب أن يكون بين 3 و 200 حرف'),
  body('content').notEmpty().withMessage('المحتوى مطلوب')
    .isString().trim()
    .isLength({ min: 10 }).withMessage('المحتوى يجب أن يكون 10 أحرف على الأقل'),
];

export const updatePost = [
  body('title').optional()
    .isLength({ min: 3, max: 200 }).withMessage(...),
  // optional() = only validate if field is present
];
```

### 2.8 `validateRequest` Middleware

Runs after validators in the chain:
```javascript
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Cleanup uploaded files (important for multipart requests)
    for (const file of req.files || [req.file].filter(Boolean)) {
      fs.promises.unlink(path.join(imagesRoot, file.filename)).catch(console.error);
    }
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};
```

**Note:** File cleanup runs because multer uses **memory storage** — files are not yet on disk at validator time. The actual disk writing happens in the storage service called from the controller.

### 2.9 Storage Strategy Pattern

```javascript
// Storage is selected by STORAGE_TYPE env variable
const storage = getStorageService();        // → StorageService.getInstance()

await storage.uploadFiles(req.files);        // returns [{ url, filename }]
await storage.deleteFile(filename);          // cleanup on post delete
```

Available strategies:
- `local` — saves to `server/public/images/`
- `cloudinary` — uploads to Cloudinary CDN
- `s3` — uploads to AWS S3

To switch storage: only change `STORAGE_TYPE` env var. No code changes needed.

**Cloudinary setup (two options):**
```env
# Option A — Heroku Addon (sets CLOUDINARY_URL automatically):
# heroku addons:create cloudinary:starter
STORAGE_TYPE=cloudinary
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME   # takes priority

# Option B — manual individual vars:
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLOUDINARY_FOLDER=mobile-recipes   # optional
```

### 2.10 JWT (`utilities/jwt.js`)

```javascript
import * as jwt from '../utilities/jwt.js';

const token = jwt.sign({ id: user.id, name: user.name, email: user.email });
const decoded = jwt.verify(token);  // returns payload or null
```

---

## 3. Client Architecture Details

### 3.1 Auth Flow (Critical: Capacitor Preferences)

**NOT localStorage, NOT sessionStorage** — uses Capacitor `Preferences`:
```typescript
import { Preferences } from '@capacitor/preferences';

// Store:
await Preferences.set({ key: 'accessToken', value: `Bearer ${token}` });

// Read (async):
const { value } = await Preferences.get({ key: 'accessToken' });

// Remove:
await Preferences.remove({ key: 'accessToken' });
```

The `api` axios instance reads this token via `interceptors.request.use(async config => ...)`.

### 3.2 Auth Context (`context/AuthContext.tsx` + `auth.types.ts`)

State: `loggedIn` (boolean), `jwt` (string | null), `user` (UserProfile | null), `showLoading` (boolean)

Methods: `login(token, userData)`, `logout()`, `fetchProfile()`, `getProfileImageUrl(imageUrl?)`

**On app mount**: `getAuthenticated()` checks Preferences → if token exists, verifies via `GET /account/profile` → sets state.

**Using in components:**
```typescript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const { loggedIn, user, login, logout } = useContext(AuthContext)!;
```

### 3.3 Axios Instance (`config/axios.ts`)

```typescript
const api = axios.create({ baseURL: API_URL });
// Interceptor auto-adds Bearer token from Capacitor Preferences
```

**In components/pages:**
```typescript
import api from '../config/axios';
import { GET_ALL_POSTS } from '../config/urls';

const response = await api.get(GET_ALL_POSTS, { params: { page, limit } });
```

### 3.4 URL Constants (`config/urls.ts`)

**Static routes:** string constants
```typescript
export const GET_ALL_POSTS = 'posts';
```

**Dynamic routes:** functions
```typescript
export const GET_POST_BY_ID = (id: string | number) => `posts/${id}`;
// Usage:
await api.get(GET_POST_BY_ID(postId));
```

**When adding a new entity:** add all URL constants here. Never hardcode paths.

### 3.5 Ionic Routing (`App.tsx` + `AppTabs.tsx`)

- Root: `IonReactRouter` + `IonRouterOutlet` in `App.tsx`
- Tabbed navigation: `IonTabs` with `IonTabBar` in `AppTabs.tsx`
- Route paths: `/tabs/home`, `/tabs/my-posts`, `/tabs/likes`, `/tabs/profile`
- Auth pages: `/account/login`, `/account/register`

**Protected routes:** components check `loggedIn` from context → redirect to login.

### 3.6 TypeScript Types (`types/`)

- `post.types.ts` — `PostData`, `PostDetail`, `CommentData`, `LikeData`
- `user.types.ts` — `UserData`, `ProfileData`

**When adding a new entity:** add its TypeScript types to the appropriate file.

---

## 4. Testing Architecture

### Server Tests

| File | Tests | Strategy | Runs against |
|------|-------|----------|--------------|
| `repositories.test.js` | 36 | Unit — per repository method | Real PostgreSQL (test DB) |
| `comprehensive.test.js` | 43 | Integration — full multi-entity workflow | Real PostgreSQL (test DB) |
| `integration.test.js` | 46 | REST API integration tests | Running server |
| `api.test.js` | 7+ | E2E — real HTTP requests | Server started on test port |
| `storage.test.js` | 48 unit (56 with live Cloudinary) | Unit + Integration — storage layer only | No network (unit); Cloudinary CDN (live) |

**Total server tests (unit-only): 180** — all run via `npm run test:all`

```bash
cd server
npm run test:all            # all 5 suites sequentially
npm test                    # repositories.test.js (36)
npm run test:comprehensive  # comprehensive.test.js (43)
npm run test:integration    # integration.test.js (46) — requires running server
npm run test:e2e            # api.test.js (7+)
npm run test:storage        # storage.test.js (48 unit / 56 with live Cloudinary)
```

**Test helper pattern:**
```javascript
import { assert, logSection, logStep, printSummary } from './test.helpers.js';

logSection("Post Repository Tests");
logStep("1. Create post with images");
const post = await repos.post.createWithImages({ title: "Test" }, [{ imageUrl: '/img.jpg' }]);
assert(!!post.id, "يجب أن يكون للمنشور معرّف");
```

### Client Tests

**Framework:** Vitest + `@testing-library/react` + jsdom

**Test files** (`app/src/tests/` or `app/src/`):
- `App.test.tsx` — root component rendering
- Type shape tests, config tests, hook tests, API integration tests

---

## 5. Models Reference

### Users
```javascript
{ id, name: String (required), email: String (required, unique), password: String (required, hashed),
  ImageUrl: String (nullable), bio: String (optional), timestamps: true }
```

### Posts
```javascript
{ id, title: String (required), content: String (required), steps: JSON (nullable),
  country: String (nullable), region: String (nullable), UserId: FK→Users, timestamps: true }
// Associations: belongsTo User, hasMany Post_Image (as 'images'), hasMany Comment, hasMany Like
```

### Post_Image
```javascript
{ id, imageUrl: String (required), PostId: FK→Posts }
// Association: belongsTo Post
```

### Comments
```javascript
{ id, content: String (required), UserId: FK→Users, PostId: FK→Posts, timestamps: true }
```

### Likes
```javascript
{ id, UserId: FK→Users, PostId: FK→Posts, timestamps: true }
// Unique constraint: [UserId, PostId] — one like per user per post
```

---

## 6. Data Flow for a Complete Request

```
1. Client: User submits create post form (title, content, image files)
2. Client: api.post(CREATE_POST, formData, { headers: { Content-Type: multipart/form-data } })
           → axios interceptor adds Bearer token from Capacitor Preferences
3. Server: Express → /posts router → /create route
4. Server middleware chain:
   a. isAuthenticated → validates Bearer JWT → sets req.currentUser
   b. upload.array('postImages', 10) → stores file buffers in memory
   c. validator.newPost → express-validator validates title, content, steps, etc.
   d. validateRequest → checks validation results; if errors: cleans files, returns 400
   e. controller.newPost → business logic
5. Controller:
   a. Reads req.currentUser.id, req.body, req.files
   b. getRepositoryManager() → repos.user.findByPk(userId)
   c. getStorageService() → storage.uploadFiles(req.files) → returns [{ url }]
   d. repos.post.createWithImages({ title, content, ... }, images)
   e. Return 201 { message, post }
6. Client: handles response → updates state → navigates/shows success
```

---

## 7. CI/CD Workflow

### GitHub Actions (`.github/workflows/build-and-deploy.yml`)

مهمتان متوازيتان تعملان عند Push إلى `main` أو `workflow_dispatch`:

| المهمة | الخدمات | الخطوات | هدف النشر |
|--------|---------|---------|----------|
| **deploy-server** | PostgreSQL 15 | `npm ci` → `npm run test:all` → نشر على فرع `server` | Heroku / Render |
| **deploy-app** | — | `npm ci` → `npm test` → `npm run build` → نشر على فرع `web` | GitHub Pages / Netlify |

### آلية نشر الخادم

الخادم JavaScript خالص — لا توجد خطوة بناء. يُنسخ الكود المصدري مباشرة مع استبعاد ملفات التطوير:

```bash
rsync -r \
  --exclude=node_modules \
  --exclude=tests \
  --exclude=coverage \
  --exclude=.eslintcache \
  --exclude='*.log' \
  --exclude='.prettierrc*' \
  --exclude='.prettierignore' \
  server/ /tmp/server-deploy/
```

ثم يُعدَّل `package.json` بحذف `devDependencies` و scripts التطوير والاختبار قبل النشر.

### فروع النشر

- **`server`** — فرع يتيم يحتوي فقط على: الكود المصدري بدون مجلد `tests/`، `package.json` بدون devDependencies، `Procfile`
- **`web`** — فرع يتيم يحتوي فقط على محتويات `app/dist/` + `.nojekyll`
- جميع commits النشر تحمل لاحقة `[skip ci]` لمنع الحلقات اللانهائية

### القرارات التصميمية

1. **لا خطوة بناء للخادم** — JavaScript ESM ينفذ مباشرة
2. **استبعاد `tests/` صريح** — ملفات الاختبار لا تُنشر في الإنتاج
3. **استبعاد `node_modules/`** — يُعيد Heroku تثبيتها من `package.json` (dependencies فقط)
4. **`cancel-in-progress: true`** — يلغي الـ run القديم عند push جديد

---

*This document is the single authoritative reference for وصفاتي architecture.*  
*See [`feature-guide.md`](./feature-guide.md) for how to add a new feature using these patterns.*
