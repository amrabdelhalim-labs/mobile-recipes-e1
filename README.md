# My Recipes - من رسمي

A **production-ready** full-stack mobile-first social recipe sharing application. Users can post recipes with photos, comment, and like each other's posts. Built with **Ionic/React + TypeScript** for the front-end and **Node.js/Express/PostgreSQL** for the back-end, with **flexible file storage** architecture supporting local, Cloudinary, and AWS S3.

> **الاسم العربي:** منٌ رسمي | **الاسم الإنجليزي:** My Recipes | **الترخيص:** MIT

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT-based auth with bcrypt password hashing |
| 📝 **Posts** | Create recipes with up to 10 images, edit, delete, browse |
| 💬 **Comments** | Add, edit, delete comments on posts |
| ❤️ **Likes** | Toggle likes, view liked posts |
| 👤 **Profiles** | Update name, upload/reset profile picture, delete account |
| 📱 **Mobile Native** | iOS & Android support via Capacitor |
| 🌐 **PWA** | Progressive Web App for web deployment |
| 🗄️ **Flexible Storage** | Pluggable architecture: Local, Cloudinary, or S3 |
| 🚀 **Production Ready** | CORS, error handling, security best practices |
| ⚡ **Auto Deploy** | GitHub Actions → Heroku + GitHub Pages |

---

## 🏗️ Tech Stack

### Server (`server/`)

| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js | JavaScript runtime | 22.x |
| Express | Web framework | 5.x |
| PostgreSQL | Relational database | Latest |
| Sequelize | ORM with auto-sync | 6.x |
| JWT | Stateless authentication | 9.x |
| bcrypt | Password hashing | 6.x |
| multer | File upload handling | 2.x |
| express-validator | Input validation | 7.x |
| dotenv | Environment config | 17.x |

### App (`app/`)

| Technology | Purpose | Version |
|-----------|---------|---------|
| Ionic React | UI component library | 8.x |
| React | UI framework | 18.x |
| TypeScript | Type safety | 5.x |
| Capacitor | Native bridge | 8.x |
| Vite | Build tool | 5.x |
| Axios | HTTP client | 1.x |

---

## 📁 Project Structure

```
mobile-recipes-e1/
├── server/                      # Node.js REST API
│   ├── app.js                   # Express server entry point
│   ├── services/
│   │   └── storage/             # 🆕 Pluggable storage architecture
│   │       ├── storage.service.js    # Factory pattern
│   │       ├── local.strategy.js     # Local filesystem
│   │       ├── cloudinary.strategy.js # Cloudinary cloud
│   │       └── s3.strategy.js        # AWS S3
│   ├── routes/                  # API routes
│   │   ├── index.js             # Mounts /account, /posts, /comments, /likes
│   │   ├── user.routes.js
│   │   ├── post.routes.js
│   │   ├── comment.routes.js
│   │   └── like.routes.js
│   ├── controllers/             # Business logic
│   │   ├── user.controller.js   # Auth, profile management
│   │   ├── post.controller.js   # Posts CRUD
│   │   ├── comment.controller.js
│   │   └── like.controller.js
│   ├── models/                  # Sequelize models
│   │   ├── users.model.js
│   │   ├── posts.model.js
│   │   ├── postImages.model.js
│   │   ├── comments.model.js
│   │   └── likes.model.js
│   ├── middlewares/             # Auth guard, validation
│   ├── validators/              # express-validator rules
│   ├── utilities/               # DB config, file handling
│   ├── Procfile                 # Heroku process definition
│   ├── .env.example             # 🆕 Comprehensive env template
│   └── package.json
│
├── app/                         # Ionic/React front-end
│   ├── src/
│   │   ├── App.tsx              # Root component
│   │   ├── AppTabs.tsx          # Tab navigation
│   │   ├── pages/               # AllPosts, CreatePost, MyPosts, Profile, etc.
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Global auth state
│   │   ├── config/
│   │   │   ├── urls.ts          # API endpoints
│   │   │   └── axios.ts         # HTTP client config
│   │   ├── components/          # Reusable UI components
## 🚀 Getting Started

### Prerequisites

- **Node.js** 22.x or later
- **PostgreSQL** 14 or later
- **npm** 9+ or pnpm/yarn
- *(Optional)* Capacitor CLI: `npm install -g @capacitor/cli`

---

### 🔧 Server Setup

```bash
# 1. Navigate to server folder
cd server

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Start development server
npm run dev
# — OR — production mode
npm start
```

Server runs on `http://localhost:3000` by default.  
Health check: `http://localhost:3000/health`

**Auto-sync:** Sequelize runs `db.sync({ alter: true })` on startup.

---

### 📱 App Setup

```bash
# 1. Navigate to app folder
cd app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Set VITE_API_URL to your server URL

# 4. Start development server
npm run dev
```

App runs on `http://localhost:5173`.

#### 🍎 Native Build (iOS/Android)

```bash
# Build web assets
npm run build

# Sync to native projects
npx cap sync

# Open in IDE
npx cap open ios
npx cap open android
```

---

## 🔐 Environment Variables

### Server Configuration

**File:** `server/.env` (copy from `.env.example`)

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | **CRITICAL** - Secret for signing tokens | Generate with: `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection string (production) | `postgresql://user:pass@host:5432/db` |

#### Database (Development)

Use individual vars instead of `DATABASE_URL`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `myrecipes` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASS` | — | Database password |

#### Storage Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | `local` | Storage backend: `local` \| `cloudinary` \| `s3` |

**For Cloudinary:**
```bash
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mobile-recipes
```

**For AWS S3:**
```bash
STORAGE_TYPE=s3
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_FOLDER=uploads/images
```

#### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8100` | Comma-separated allowed origins |
| `NODE_ENV` | `development` | `development` \| `production` |
| `PORT` | `3000` | Server port |

#### Optional (HTTPS)

| Variable | Description |
|----------|-------------|
| `HTTPS_KEY_PATH` | Path to TLS private key |
| `HTTPS_CERT_PATH` | Path to TLS certificate |
| `HTTPS_CA_PATH` | Path to CA bundle |

---

### App Configuration

**File:** `app/.env.local` (copy from `.env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend URL (e.g., `http://localhost:3000`) |
| `VITE_BASE_URL` | No | Base path (auto-detected in CI) |

---

## 📡 API Reference

### Authentication

All endpoints require `Authorization: Bearer <token>` except Login/Register.

#### Account (`/account`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | Public | Create new account |
| `POST` | `/login` | Public | Get JWT token |
| `GET` | `/profile` | Auth | Get user profile |
| `PUT` | `/profile/info` | Auth | Update name/password |
| `PUT` | `/profile/image` | Auth | Upload profile picture |
| `PUT` | `/profile/image/reset` | Auth | Reset to default image |
| `DELETE` | `/profile` | Auth | Delete account |

#### Posts (`/posts`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/create` | Auth | Create post (max 10 images) |
| `GET` | `/` | Auth | Get all posts (paginated) |
| `GET` | `/me` | Auth | Get user's posts |
| `GET` | `/:id` | Auth | Get post by ID |
| `PUT` | `/:id` | Auth | Update post |
| `DELETE` | `/:id` | Auth | Delete post |

#### Comments (`/comments`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/:postId` | Auth | Add comment |
| `PUT` | `/:id` | Auth | Update comment |
| `DELETE` | `/:id` | Auth | Delete comment |
| `GET` | `/me` | Auth | Get user's comments |

#### Likes (`/likes`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/:postId` | Auth | Toggle like |
| `GET` | `/:postId` | Auth | Get post likes |
| `GET` | `/me` | Auth | Get liked posts |

---

## 🧪 Running Tests

```bash
# From app/ directory

# Unit tests (Vitest)
npm run test.unit

# E2E tests (Cypress)
npm run test.e2e
```

---

## 🌐 Deployment

### 📚 Documentation

- **[PRODUCTION.md](PRODUCTION.md)** - Complete production deployment guide
- **[STORAGE.md](STORAGE.md)** - File storage architecture & configuration

### Quick Deploy to Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set CORS_ORIGINS=https://yourapp.com
heroku config:set STORAGE_TYPE=cloudinary
heroku config:set CLOUDINARY_CLOUD_NAME=xxx
heroku config:set CLOUDINARY_API_KEY=xxx
heroku config:set CLOUDINARY_API_SECRET=xxx

# Deploy (via GitHub Actions or manual push)
git push heroku main
```

### GitHub Pages (Frontend)

1. Set GitHub Secrets in `Settings → Secrets → Actions`:
   - `VITE_API_URL`: Your Heroku app URL
2. Push to `main` branch
3. GitHub Actions automatically deploys to `web` branch
4. Enable Pages: `Settings → Pages → Deploy from branch → web`

---

## ⚙️ CI/CD Pipeline

**Workflow:** `.github/workflows/deploy.yml`

### Triggers

| Event | Action |
|-------|--------|
| Push to `main` | Auto-deploy server + app |
| Pull Request | Build verification only |
| Manual dispatch | Deploy server, app, or both |

### GitHub Secrets/Variables

| Name | Type | Description |
|------|------|-------------|
| `VITE_API_URL` | Variable | Production API URL |
| `VITE_BASE_URL` | Variable | App base path (optional) |

### Branch Strategy

| Branch | Purpose | Deployed To |
|--------|---------|-------------|
| `main` | Development & source code | — |
| `server` | Production server files | Heroku |
| `web` | Production app build | GitHub Pages |

---

## 🛡️ Security Features

- ✅ JWT authentication with bcrypt password hashing
- ✅ CORS protection with configurable origins  
- ✅ File upload validation (size, type)
- ✅ Input validation via express-validator
- ✅ SQL injection protection (Sequelize ORM)
- ✅ XSS protection (parameterized queries)
- ✅ Error handling without exposing internals

---

## 📚 Additional Documentation

- **[docs/storage.md](docs/storage.md)** - Comprehensive storage service guide (Arabic)
  - Local, Cloudinary, and S3 strategies
  - Strategy pattern implementation
  - Configuration examples
  - Troubleshooting

- **[docs/deployment.md](docs/deployment.md)** - Production deployment guide (Arabic)
  - Security best practices
  - Environment configuration
  - Heroku deployment steps
  - Monitoring and debugging
  - CI/CD pipeline setup

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
## 📚 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify and distribute
- ✅ Use for private purposes

You must:
- ℹ️ Include license and copyright notice

---
## 🙏 Acknowledgments

- [Ionic Framework](https://ionicframework.com/) - Mobile UI components
- [React](https://react.dev/) - UI library
- [Express](https://expressjs.com/) - Web framework
- [Sequelize](https://sequelize.org/) - ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Cloudinary](https://cloudinary.com/) - Image hosting
- [Heroku](https://www.heroku.com/) - Platform as a service

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check [docs/deployment.md](docs/deployment.md) for troubleshooting
- Review [docs/storage.md](docs/storage.md) for storage configuration

---

**Built with ❤️ using modern web technologies**
