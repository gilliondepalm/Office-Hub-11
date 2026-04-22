# Running Kantoor Dashboard Locally

## Prerequisites

1. **Node.js** — version 20 (tested on v20.20.0)
2. **PostgreSQL** — a running PostgreSQL database (version 14+ recommended)
3. **npm** — comes with Node.js

## Environment Variables

Set these before running:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:password@localhost:5432/kantoor` |
| `SESSION_SECRET` | Recommended | A random string for session security. The app generates a temporary one if missing, but warns it's not safe for production |
| `PORT` | Optional | Defaults to `5000` |

## Setup Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database tables

This pushes the Drizzle ORM schema directly to your PostgreSQL database:

```bash
npm run db:push
```

### 3. Create upload directories

These folders must exist for file uploads to work:

```
uploads/Aankondigingen/
uploads/App_pics/
uploads/Beloning/
uploads/CAO/
uploads/Instructies/
uploads/Nieuwsbrief/
uploads/Wetgeving/
```

You can create them all at once:

```bash
mkdir -p uploads/Aankondigingen uploads/App_pics uploads/Beloning uploads/CAO uploads/Instructies uploads/Nieuwsbrief uploads/Wetgeving
```

The `uploads/App_pics/` folder contains the hero banner images for each page. Without these images, the app works but the page banners will be blank.

### 4. Run in development mode

```bash
npm run dev
```

This starts both the Express backend and Vite frontend dev server on port 5000.

### 5. First login

The app automatically seeds the database with default users when it starts with an empty database.

Default admin account:
- **Username:** `admin`
- **Password:** `admin123`

## Production Build

### Build

```bash
npm run build
```

This bundles the frontend with Vite and the backend with esbuild into the `dist/` folder.

### Start

```bash
npm start
```

Runs the production server from `dist/index.cjs`.

## Notes

- The Vite config includes some Replit-specific plugins. These are harmless — they only activate when running on Replit and are skipped locally and in production builds.
- The database schema uses Drizzle ORM with `drizzle-kit push` (no migration files). It syncs the schema directly to your database.
- Sessions are stored in PostgreSQL (via `connect-pg-simple`) in production, or in memory during development.
