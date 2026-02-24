# Contributing Guide — وصفاتي (mobile-recipes-e1)

> **Read this before making any change.**  
> These rules are non-negotiable and enforced at code review. Deviations require explicit
> justification.

---

## 1. Architecture First

Before writing any code, read the AI guidance docs:

| Document | Read when |
|----------|-----------|
| [`docs/ai/README.md`](docs/ai/README.md) | Always — start here |
| [`docs/ai/architecture.md`](docs/ai/architecture.md) | Making any server or client change |
| [`docs/ai/feature-guide.md`](docs/ai/feature-guide.md) | Adding a new entity or feature |

**Critical rules summary (full list in `docs/ai/README.md`):**
- Never import a Sequelize model directly in a controller — use `getRepositoryManager()`
- Route middleware order is fixed: `isAuthenticated` → `upload` → validators → `validateRequest` → controller
- Validators use `express-validator` (`body()` chains) — never inline validation in controllers
- Auth token via `Preferences` (Capacitor) — never `localStorage`
- File storage via `getStorageService()` — never instantiate `StorageService` directly
- URL constants in `app/src/config/urls.ts` — never hardcode paths
- HTTP requests via the `api` axios instance — never raw `fetch` or `axios`
- Sequelize associations via `model.associate(models)` in `models/index.js` only

---

## 2. Branch Naming

```
main           ← production-ready code only; never commit directly
feat/<topic>   ← new feature (e.g., feat/recipe-ratings)
fix/<topic>    ← bug fix (e.g., fix/image-upload-cleanup)
docs/<topic>   ← documentation only (e.g., docs/update-ai-guide)
chore/<topic>  ← tooling, dependencies, config (e.g., chore/add-prettier)
refactor/<topic> ← refactor without behavior change
```

---

## 3. Commit Messages

**Format:** [Conventional Commits](https://www.conventionalcommits.org/) — English only.

```
<type>(<scope>): <short description>

<body — list of changes, one per line starting with ->

<footer — breaking changes or issue references>
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or behavior |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code restructure without behavior change |
| `chore` | Tooling, config, dependencies, CI |
| `style` | Formatting only (no logic change) |

### Scopes

| Scope | Applies to |
|-------|-----------|
| `server` | `server/` directory |
| `app` | `app/` directory (Ionic client) |
| `docs` | `docs/` directory |
| `ci` | `.github/workflows/` |
| `ai` | `docs/ai/` specifically |

### Rules

1. **Subject line ≤ 72 characters**
2. **Subject uses imperative mood** — "add", "fix", "update", not "added", "fixed"
3. **No period at end of subject line**
4. **Body mandatory for non-trivial commits** — list each significant change
5. **Separate subject from body with a blank line**
6. **One logical change per commit** — do not mix server + app + docs in one commit

### Examples

```bash
# ✅ CORRECT
git commit -m "feat(server): add recipe rating entity with repository + validators

- Add Rating Sequelize model with associations to Recipe and User
- Register in models/index.js and add model.associate()
- Add RatingRepository extending BaseRepository
- Register in RepositoryManager as getRatingRepository()
- Add express-validator rules: score must be integer 1-5
- Add rating routes with correct middleware order
- Mount router at /posts/:id/ratings in app.js
- Cascade delete ratings when parent Recipe is deleted"

# ✅ CORRECT (patch)
git commit -m "fix(app): use api axios instance in RatingService

- Replace raw axios.post() with api.post() to ensure token injection"

# ✅ CORRECT (docs only)
git commit -m "docs(ai): update architecture with rating layer"

# ❌ WRONG — Arabic subject
git commit -m "إضافة التقييمات"

# ❌ WRONG — mixed scope
git commit -m "feat: add ratings server and app"

# ❌ WRONG — no body on non-trivial commit
git commit -m "feat(server): add repository pattern"

# ❌ WRONG — past tense
git commit -m "feat(server): added rating endpoint"
```

---

## 4. Tagging Strategy

Tags mark **meaningful release milestones** — not every commit.

### When to create a tag

| Version bump | Trigger |
|---|---|
| `v1.0.0` (major) | First production-ready version, or breaking change |
| `v1.X.0` (minor) | New feature complete with tests |
| `v1.X.Y` (patch) | Documentation fix, bug fix, minor correction |

**Never tag:**
- Work-in-progress commits
- Commits with failing tests
- Individual "Finished: X page" style commits
- Every commit in a feature branch

### Tag format — annotated tags only

```bash
# Annotated tag (ALWAYS use -a flag — never lightweight tags)
git tag -a v1.6.0 -m "v1.6.0 - Add Recipe Rating System

- Rating model + RatingRepository (Sequelize/PostgreSQL)
- REST routes: POST /posts/:id/ratings, DELETE /posts/:id/ratings/:ratingId
- express-validator rules: score integer 1-5, required
- Cascade delete when parent Recipe deleted
- Client: StarRating component + useRatings hook
- Server tests: 36 → 52 passing"

# Tag on a past commit
git tag -a v1.0.0 <hash> -m "v1.0.0 - ..."
```

### Tag message rules

1. **First line:** `vX.Y.Z - Human-readable title`
2. **Body:** bullet list of the most significant changes
3. **Include test counts** if tests changed
4. **English only**

---

## 5. Code Formatting

**All code is formatted with Prettier** before every commit. No manual indentation decisions.

```bash
# Format all source files (run from project root — works on all OS)
node format.mjs

# Check without writing (used in CI)
node format.mjs --check

# Or per-package:
cd server && npm run format
cd app && npm run format
```

**Prettier config** (`.prettierrc.json` in `server/` and `app/`):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Rules:**
- 2-space indentation — always, no tabs
- Single quotes for strings
- Trailing commas in multi-line structures (ES5 compatible)
- Max line width: 100 characters
- Never manually adjust whitespace — let Prettier decide

---

## 6. Pre-Commit Checklist

Run this before every `git commit`:

```bash
# 1. All server tests
cd server && npm run test:all

# 2. All client tests
cd app && npm run test

# 3. Prettier — ensure formatting is applied
node format.mjs --check
```

**All of the above must pass before committing.** A commit with failing tests or
unformatted code must never reach `main`.

---

## 7. Documentation Updates

When adding or changing a feature:

| Change type | Required doc updates |
|-------------|---------------------|
| New entity (model + repo + controller) | `docs/ai/feature-guide.md`, `docs/ai/architecture.md`, `docs/api-endpoints.md` |
| New REST endpoint | `docs/api-endpoints.md`, `docs/ai/README.md` (API table) |
| New env var | `docs/ai/README.md` (env vars section), `README.md` |
| New test file | `docs/testing.md` |
| New storage provider | `docs/storage.md`, `docs/ai/architecture.md` |
| Auth change | `docs/ai/architecture.md` (auth section) |

**Documentation commits must be separate from code commits** (use `docs` type).

---

## 8. Testing Requirements

| Test suite | Command | Must pass before |
|-----------|---------|-----------------|
| Server repository tests | `npm run test` | Any server commit |
| Server comprehensive tests | `npm run test:comprehensive` | Any server commit |
| Server integration tests | `npm run test:integration` | Any server commit |
| Server E2E tests | `npm run test:e2e` | Any server commit |
| Client Vitest tests | `npm run test` | Any client commit |

See [`docs/testing.md`](docs/testing.md) for full test documentation.

---

## 9. Storage Provider Notes

The server supports three file storage backends controlled by `STORAGE_PROVIDER` env var:

| Value | Backend |
|-------|---------|
| `local` | Local filesystem (`server/public/uploads/`) |
| `s3` | AWS S3 (requires `AWS_*` env vars) |
| `cloudinary` | Cloudinary (requires `CLOUDINARY_*` env vars) |

When adding a new storage provider: follow the guide in [`docs/ai/feature-guide.md`](docs/ai/feature-guide.md)
(New Storage Provider section) and add the provider to `docs/storage.md`.
