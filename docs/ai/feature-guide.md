# Feature Development Guide — وصفاتي (mobile-recipes-e1)

> **Purpose:** Exact steps to follow when adding a new entity or feature to this project.
> Every instruction maps directly to the existing codebase patterns.
>
> **Prerequisite:** Read [`architecture.md`](./architecture.md) first.

---

## Adding a New Server-Side Entity

This guide uses a hypothetical `Rating` entity as a running example (a star rating for posts).
Adapt field names and logic to your actual entity.

### Step 1: Define the Sequelize Model

Location: `server/models/ratings.model.js`

```javascript
import { DataTypes, Model } from 'sequelize';
import { db } from '../utilities/database.js';

class Rating extends Model {
  static associate(models) {
    Rating.belongsTo(models.User, { as: 'User', foreignKey: 'UserId' });
    Rating.belongsTo(models.Post, { as: 'Post', foreignKey: 'PostId' });
  }
}

Rating.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    score: { type: DataTypes.INTEGER, allowNull: false,
      validate: { min: 1, max: 5 } },
    UserId: { type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'Users', key: 'id' } },
    PostId: { type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'Posts', key: 'id' } },
  },
  {
    sequelize: db,
    modelName: 'Rating',
    tableName: 'Ratings',
    timestamps: true,
    indexes: [{ unique: true, fields: ['UserId', 'PostId'] }], // one rating per user per post
  }
);

export default Rating;
```

### Step 2: Register Model + Associations

Location: `server/models/index.js`

```javascript
// Add import:
import Rating from './ratings.model.js';

// Register in models object:
const models = {
  User, Post, Post_Image, Comment, Like,
  Rating,   // ← Add
};
```

The `associate(models)` calls run automatically. But also update the **Post** model's `associate`:

```javascript
// In posts.model.js → static associate(models):
Post.hasMany(models.Rating, { as: 'ratings', foreignKey: 'PostId' });
```

### Step 3: Create the Repository

Location: `server/repositories/rating.repository.js`

```javascript
import BaseRepository from './base.repository.js';
import Rating from '../models/ratings.model.js';
import User from '../models/users.model.js';

class RatingRepository extends BaseRepository {
  constructor() {
    super(Rating);
  }

  // ── Domain-specific methods ──────────────────────────────────────────────────

  async findByPost(postId, page = 1, limit = 10) {
    return this.findPaginated(page, limit, {
      where: { PostId: postId },
      include: [{ association: 'User', attributes: ['id', 'name', 'ImageUrl'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findByUser(userId, page = 1, limit = 10) {
    return this.findPaginated(page, limit, {
      where: { UserId: userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async userHasRated(userId, postId) {
    return this.exists({ where: { UserId: userId, PostId: postId } });
  }

  async getUserRating(userId, postId) {
    return this.findOne({ where: { UserId: userId, PostId: postId } });
  }

  async averageForPost(postId) {
    const { fn, col } = await import('sequelize');
    const result = await Rating.findOne({
      where: { PostId: postId },
      attributes: [[fn('AVG', col('score')), 'average']],
      raw: true,
    });
    return parseFloat(result?.average) || 0;
  }

  async deleteByPost(postId) {
    return this.deleteWhere({ PostId: postId });
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

let instance = null;

export const getRatingRepository = () => {
  if (!instance) instance = new RatingRepository();
  return instance;
};

export default getRatingRepository;
```

### Step 4: Register in Repository Manager

Location: `server/repositories/index.js`

```javascript
// Add import:
import { getRatingRepository } from './rating.repository.js';

// Add to RepositoryManager constructor:
constructor() {
  // ... existing
  this.rating = getRatingRepository();
}

// Add to healthCheck():
healthCheck() {
  return {
    // ... existing
    rating: !!this.rating,
    all: [this.user, this.post, ..., this.rating].every(Boolean),
  };
}
```

### Step 5: Add Validators

Location: `server/validators/rating.validator.js`

```javascript
import { body } from 'express-validator';

const newRating = [
  body('score')
    .notEmpty().withMessage('التقييم مطلوب')
    .isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
];

const updateRating = [
  body('score')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
];

export { newRating, updateRating };
```

### Step 6: Create the Controller

Location: `server/controllers/rating.controller.js`

```javascript
import { getRepositoryManager } from '../repositories/index.js';

const ratePost = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) return res.status(401).json({ message: 'غير مصرح' });

    const postId = parseInt(req.params.postId);
    const { score } = req.body;

    const repositories = getRepositoryManager();

    // Check post exists
    const post = await repositories.post.findByPk(postId);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

    // Check already rated
    const alreadyRated = await repositories.rating.userHasRated(userId, postId);
    if (alreadyRated) return res.status(400).json({ message: 'لقد قمت بتقييم هذا المنشور مسبقاً' });

    const rating = await repositories.rating.create({ score, UserId: userId, PostId: postId });
    return res.status(201).json({ message: 'تم التقييم بنجاح', rating });
  } catch (error) {
    console.error('Error rating post:', error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const getPostRatings = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { page = 1, limit = 10 } = req.query;
    const repositories = getRepositoryManager();
    const result = await repositories.rating.findByPost(postId, Number(page), Number(limit));
    const average = await repositories.rating.averageForPost(postId);
    return res.status(200).json({ ...result, average });
  } catch (error) {
    console.error('Error getting ratings:', error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

export { ratePost, getPostRatings };
```

### Step 7: Create Routes

Location: `server/routes/rating.routes.js`

```javascript
import express from 'express';
import * as controller from '../controllers/rating.controller.js';
import * as validator from '../validators/rating.validator.js';
import * as middleware from '../middlewares/user.middleware.js';
import { validateRequest } from '../middlewares/validator.middleware.js';

const router = express.Router();

router.post('/:postId',
  middleware.isAuthenticated,
  validator.newRating,
  validateRequest,
  controller.ratePost
);

router.get('/:postId',
  middleware.isAuthenticated,
  controller.getPostRatings
);

export default router;
```

### Step 8: Mount the Router

Location: `server/routes/index.js`

```javascript
import ratingRouter from './rating.routes.js';

router.use('/ratings', ratingRouter);
```

### Step 9: Handle Cascade on Post Delete

In the post controller's `deletePost` function, add before deleting the post:

```javascript
// After deletes for comments, likes, images — add:
await repositories.rating.deleteByPost(postId);
```

### Step 10: Add Tests

#### Repository tests — `server/tests/repositories.test.js`

```javascript
logSection("Rating Repository Tests");
logStep("1. Create rating");
const rating = await repos.rating.create({ score: 4, UserId: testUser.id, PostId: testPost.id });
assert(!!rating.id, "يجب أن يكون للتقييم معرّف");
assert(rating.score === 4, "يجب أن يكون التقييم 4");

logStep("2. Check userHasRated");
const hasRated = await repos.rating.userHasRated(testUser.id, testPost.id);
assert(hasRated === true, "يجب أن يكون المستخدم قد قيّم");

logStep("3. averageForPost");
const avg = await repos.rating.averageForPost(testPost.id);
assert(avg === 4, "يجب أن يكون المتوسط 4");
```

#### API tests — `server/tests/api.test.js`

```javascript
logSection("Rating API Tests");
const result = await makeRequest('POST', `/ratings/${testPost.id}`, { score: 5 }, token);
assert(result.status === 201, "يجب أن يتم إنشاء التقييم");

const getResult = await makeRequest('GET', `/ratings/${testPost.id}`, null, token);
assert(Array.isArray(getResult.data.rows), "يجب أن تُعاد قائمة التقييمات");
```

**Run tests:**
```bash
cd server && npm run test:all
```

---

## Adding a New Client-Side Feature

### Step 1: Add URL Constants

Location: `app/src/config/urls.ts`

```typescript
// Rating routes (/ratings)
export const RATE_POST = (postId: string | number) => `ratings/${postId}`;
export const GET_POST_RATINGS = (postId: string | number) => `ratings/${postId}`;
```

### Step 2: Add TypeScript Types

Location: `app/src/types/post.types.ts` (or a new file)

```typescript
export interface RatingData {
  id: number;
  score: number;
  createdAt: string;
  User: {
    id: number;
    name: string;
    ImageUrl: string | null;
  };
}

export interface RatingsResponse {
  rows: RatingData[];
  count: number;
  page: number;
  totalPages: number;
  average: number;
}
```

### Step 3: Create a Hook for the Feature (Optional but Recommended)

Location: `app/src/hooks/useRatings.ts`

```typescript
import { useState } from 'react';
import api from '../config/axios';
import { RATE_POST, GET_POST_RATINGS } from '../config/urls';
import { RatingsResponse } from '../types/post.types';

export function useRatings(postId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratePost = async (score: number): Promise<boolean> => {
    setLoading(true);
    try {
      await api.post(RATE_POST(postId), { score });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في التقييم');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRatings = async (page = 1, limit = 10): Promise<RatingsResponse | null> => {
    try {
      const res = await api.get(GET_POST_RATINGS(postId), { params: { page, limit } });
      return res.data;
    } catch {
      return null;
    }
  };

  return { ratePost, getRatings, loading, error };
}
```

### Step 4: Create the Component

Location: `app/src/components/RatingStars/RatingStars.tsx`

```typescript
import { IonIcon } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';

interface Props {
  value: number;
  onChange?: (score: number) => void;
  readonly?: boolean;
}

export default function RatingStars({ value, onChange, readonly = false }: Props) {
  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <IonIcon
          key={n}
          icon={n <= value ? star : starOutline}
          onClick={() => !readonly && onChange?.(n)}
          style={{ cursor: readonly ? 'default' : 'pointer', color: '#ffc107' }}
        />
      ))}
    </div>
  );
}
```

### Step 5: Use in a Page

```typescript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../config/axios';
import { RATE_POST } from '../config/urls';
import RatingStars from '../components/RatingStars/RatingStars';
import { useRatings } from '../hooks/useRatings';

function PostDetailPage({ postId }: { postId: number }) {
  const { loggedIn } = useContext(AuthContext)!;  // ← use context
  const { ratePost, loading } = useRatings(postId);

  const handleRate = async (score: number) => {
    if (!loggedIn) return;  // guard
    await ratePost(score);
  };

  return <RatingStars value={0} onChange={handleRate} />;
}
```

---

## Modifying Auth (Adding a Field to Auth State)

1. **Server**: Add field to JWT payload in `utilities/jwt.js` → `jwt.sign({ id, name, email, newField })`
2. **Server**: Return new field from `POST /account/login` and `POST /account/register` responses
3. **Client** — `context/auth.types.ts`: Add field to `UserProfile` and/or `AuthContextType`
4. **Client** — `context/AuthContext.tsx`: Update `setUser(res.data.user)` response mapping
5. **Components**: No changes needed if field is in `user` object (already available via context)

---

## Adding a New Storage Provider

1. Create `server/services/storage/{provider}.strategy.js` implementing `IStorageStrategy`:
   - `upload(file)` → returns `{ url, filename }`
   - `delete(filename)` → deletes from provider
2. Export the class
3. In `storage.service.js`, add the provider to the strategy selection switch:
   ```javascript
   case 'myprovider': return new MyProviderStrategy();
   ```
4. Add required env vars to `.env.example` and deployment docs

---

## Quality Checklist Before Committing

### Server
- [ ] Sequelize model defined with proper `DataTypes` and `indexes`
- [ ] `static associate(models)` method defined in model
- [ ] Model imported and added to `models/index.js`
- [ ] Related models updated with `hasMany` / `hasOne` associations
- [ ] Repository extends `BaseRepository`, has singleton factory `get{Entity}Repository()`
- [ ] Repository registered in `RepositoryManager` in `repositories/index.js`
- [ ] Validators use `express-validator` `body()` chains with Arabic messages
- [ ] Routes use **correct middleware order**: `isAuthenticated → upload? → validators → validateRequest → controller`
- [ ] Router mounted in `routes/index.js`
- [ ] Cascade deletes handled in parent entity's delete controller
- [ ] Tests updated + `npm run test:all` passes

### Client
- [ ] URL constants added to `config/urls.ts` (static string or function for dynamic)
- [ ] TypeScript types added to appropriate `types/*.ts` file
- [ ] HTTP requests use the `api` axios instance — never raw `axios` or `fetch`
- [ ] Auth check via `useContext(AuthContext)!` — never direct `Preferences.get()`
- [ ] Capacitor `Preferences` used for token storage — never `localStorage`
- [ ] Client tests updated + `npm run test` passes

### Commit
```bash
# Server changes:
git add server/ && git commit -m "feat(server): add rating entity with repository + tests"
# Client changes:
git add app/ && git commit -m "feat(client): add rating UI components + hooks"
```

---

*Companion document: [`architecture.md`](./architecture.md)*  
*Workspace improvement guide: [`docs/ai-improvement-guide.md`](../../../../docs/ai-improvement-guide.md)*
