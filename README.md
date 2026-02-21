# mobile-recipes-e1

A full-stack mobile-first social recipe sharing application. Users can post recipes with photos, comment, and like each other's posts. Built with **Ionic / React** for the front-end and **Node.js / Express / PostgreSQL** for the back-end, with optional native packaging via **Capacitor**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Server Setup](#server-setup)
  - [App Setup](#app-setup)
- [Environment Variables](#environment-variables)
  - [Server](#server-env)
  - [App](#app-env)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [License](#license)

---

## Features

| Area | Details |
|------|---------|
| **Authentication** | Register, login with JWT, profile management |
| **Posts** | Create with up to 10 images, edit, delete, browse all or own |
| **Comments** | Add, edit, delete comments per post |
| **Likes** | Toggle like on a post, view your liked posts |
| **Profiles** | Update display name / bio, upload or reset profile picture, delete account |
| **Mobile-ready** | Installable on iOS & Android via Capacitor |
| **PWA** | Progressive Web App support for web deployment |
| **HTTPS** | Optional TLS termination at the Express level (dev / self-hosted) |

---

## Tech Stack

### Back-end (`server/`)

| Technology | Purpose |
|-----------|---------|
| Node.js (ESM) | Runtime |
| Express 5 | HTTP framework |
| PostgreSQL | Relational database |
| Sequelize | ORM (`db.sync({ alter: true })`) |
| JSON Web Tokens | Stateless authentication |
| bcrypt | Password hashing |
| multer | Image upload handling |
| express-validator | Input validation |
| dotenv | Environment configuration |

### Front-end (`app/`)

| Technology | Purpose |
|-----------|---------|
| Ionic React 8 | UI component library + tab navigation |
| React 18 | UI rendering |
| TypeScript | Type safety |
| Capacitor 8 | Native iOS / Android bridge |
| Vite | Build tool |
| Axios | HTTP client |
| Vitest | Unit testing |
| Cypress | End-to-end testing |

---

## Project Structure

```
mobile-recipes-e1/
├── server/                  # Node.js REST API
│   ├── app.js               # Entry point (Express + Sequelize start-up)
│   ├── routes/              # Route definitions
│   │   ├── index.js         # Mounts /account, /posts, /comments, /likes
│   │   ├── user.routes.js
│   │   ├── post.routes.js
│   │   ├── comment.routes.js
│   │   └── like.routes.js
│   ├── controllers/         # Business logic
│   ├── models/              # Sequelize models (users, posts, comments, likes, postImages)
│   ├── middlewares/         # Auth guard, validation helpers
│   ├── validators/          # express-validator rule sets
│   ├── utilities/           # File upload config (multer)
│   ├── config/              # DB connection
│   └── .env.example
│
├── app/                     # Ionic / React front-end
│   ├── src/
│   │   ├── App.tsx          # Root routes (login, register, tabs, 404)
│   │   ├── AppTabs.tsx      # Tab bar (Home, Create, My Posts, Profile)
│   │   ├── pages/           # AllPosts, CreatePost, GetPost, UpdatePost,
│   │   │                    # MyPosts, Profile, Login, Register, NotFound
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── components/      # Shared UI components
│   ├── vite.config.ts
│   └── .env.example
│
└── .github/
    └── workflows/
        └── deploy.yml       # CI/CD — builds and deploys app + server
```

---

## Getting Started

### Prerequisites

- **Node.js** 22.x or later
- **PostgreSQL** 14 or later (running locally or a cloud instance)
- **npm** 9+ (or pnpm / yarn)
- *(Optional)* Capacitor CLI for native builds: `npm install -g @capacitor/cli`

---

### Server Setup

```bash
# 1. Navigate to the server folder
cd server

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
#    → Edit .env and fill in your DB credentials, JWT secret, etc.

# 4. Start in development mode (auto-restarts on file change)
npm run dev

# 5. — OR — start in production mode
npm start
```

The server listens on `http://localhost:3000` by default (configurable via `PORT`).  
Static images are served at `/images`.  
A health-check endpoint is available at `/health`.

Sequelize runs `db.sync({ alter: true })` on start-up, so the database schema is created / updated automatically.

---

### App Setup

```bash
# 1. Navigate to the app folder
cd app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
#    → Set VITE_API_URL to your running server URL

# 4. Start development server
npm run dev
```

Open `http://localhost:5173` in a browser.

#### Native Build (iOS / Android)

```bash
# Build the web assets first
npm run build

# Sync to native projects
npx cap sync

# Open in Xcode / Android Studio
npx cap open ios
npx cap open android
```

---

## Environment Variables

### Server env

File: `server/.env` (copy from `server/.env.example`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port the HTTP/HTTPS server listens on |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DB_HOST` | Yes* | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | Yes* | `myrecipes` | Database name |
| `DB_USER` | Yes* | `postgres` | Database user |
| `DB_PASS` | Yes* | — | Database password |
| `DATABASE_URL` | Yes* | — | Full connection string (overrides individual DB_* vars on cloud hosts) |
| `JWT` | **Yes** | — | Secret key used to sign/verify tokens |
| `HTTPS_KEY_PATH` | No | — | Path to TLS private key file (enables HTTPS) |
| `HTTPS_CERT_PATH` | No | — | Path to TLS certificate file |
| `HTTPS_CA_PATH` | No | — | Path to CA bundle file |

> \* Either `DATABASE_URL` **or** all of `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` must be provided.

---

### App env

File: `app/.env.local` (copy from `app/.env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Base URL of the back-end server, e.g. `http://localhost:3000` |
| `VITE_BASE_URL` | No | Base path for the app (auto-detected in CI to `/mobile-recipes-e1/`) |

---

## API Reference

All endpoints are prefixed with `/api` and require a `Bearer` JWT token unless noted.

### Account — `/api/account`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | Public | Create a new account |
| `POST` | `/login` | Public | Authenticate and receive a JWT |
| `GET` | `/profile` | Required | Fetch the authenticated user's profile |
| `PUT` | `/profile/info` | Required | Update display name / bio |
| `PUT` | `/profile/image` | Required | Upload a new profile picture |
| `PUT` | `/profile/image/reset` | Required | Reset profile picture to default |
| `DELETE` | `/profile` | Required | Delete the authenticated user's account |

### Posts — `/api/posts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/create` | Required | Create a post (up to 10 images via `multipart/form-data`) |
| `GET` | `/` | Required | Get all posts |
| `GET` | `/me` | Required | Get the authenticated user's posts |
| `GET` | `/:id` | Required | Get a single post by ID |
| `PUT` | `/:id` | Required | Update a post (replace images) |
| `DELETE` | `/:id` | Required | Delete a post |

### Comments — `/api/comments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/:postId` | Required | Add a comment to a post |
| `PUT` | `/:id` | Required | Update a comment |
| `DELETE` | `/:id` | Required | Delete a comment |
| `GET` | `/me` | Required | Get all comments by the authenticated user |

### Likes — `/api/likes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/:postId` | Required | Toggle like on a post |
| `GET` | `/:postId` | Required | Get likes for a post |
| `GET` | `/me` | Required | Get all posts liked by the authenticated user |

---

## Running Tests

```bash
# From the app/ directory

# Unit tests (Vitest)
npm run test.unit

# End-to-end tests (Cypress)
npm run test.e2e
```

---

## Deployment

### Back-end

Any Node.js-compatible host works (Railway, Render, Fly.io, Heroku, VPS, etc.).

1. Set all required environment variables on the host (see [Server env](#server-env)).
2. The start command is: `node app.js` (no build step required).
3. Make sure PostgreSQL is accessible from the host.

The **`server` branch** in this repository contains only the production server files and is kept up to date by the CI/CD pipeline automatically.

### Front-end (GitHub Pages)

1. In your repository settings → **Pages**, set the source to **Deploy from a branch** and select the `web` branch, folder `/`.
2. Set the `VITE_API_URL` secret in **Settings → Secrets and variables → Actions**.
3. Push to `main` — the workflow builds the app and pushes the `app/dist/` output to the `web` branch.

The app is then available at:

```
https://<your-username>.github.io/mobile-recipes-e1/
```

---

## CI/CD

The workflow file is at [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### Triggers

| Event | Behavior |
|-------|---------|
| Push to `main` | Deploys both server and app |
| Pull Request to `main` | Runs build/check only (no deploy) |
| `workflow_dispatch` | Manual trigger — choose `server`, `app`, or `both` |

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VITE_API_URL` | Production URL of the back-end server |
| `VITE_BASE_URL` | *(Optional)* Custom base path for the app |

### Branch Strategy

| Branch | Contents |
|--------|---------|
| `main` | Source code |
| `server` | Server files ready for deployment (force-pushed by CI) |
| `web` | Built front-end (`app/dist/`) for GitHub Pages (force-pushed by CI) |

See [.github/workflows/README.md](.github/workflows/README.md) for detailed workflow documentation and troubleshooting.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
