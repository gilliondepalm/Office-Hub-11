# Running Kantoor Dashboard Locally

## Prerequisites

### Node.js
- **Version:** 20.x (tested with v20.20.0)
- Download from [nodejs.org](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm)

### PostgreSQL
- **Version:** 14 or higher recommended
- Install via your package manager or download from [postgresql.org](https://www.postgresql.org/download/)
- Create an empty database:
  ```sql
  CREATE DATABASE kantoordashboard;
  ```

## Environment Variables

Create a `.env` file in the project root (or set these in your shell):

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:password@localhost:5432/kantoordashboard` |
| `SESSION_SECRET` | Recommended | Secret for session encryption (any random string) | `my-secret-key-change-this` |

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Push database schema (creates all tables)
npm run db:push

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:5000` (Express serves both the API and the Vite frontend).

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Express + Vite with hot reload) |
| `npm run build` | Build for production (frontend + backend bundled) |
| `npm run start` | Start production server from `dist/` |
| `npm run db:push` | Synchronize database schema with Drizzle |
| `npm run check` | Run TypeScript type checking |

## Production Build

```bash
# Build the application
npm run build

# Set environment variables and start
DATABASE_URL="postgresql://user:password@localhost:5432/kantoordashboard" npm run start
```

## Project Structure

```
├── client/               # Frontend (React + Vite)
│   └── src/
│       ├── components/   # UI components (Shadcn/UI)
│       ├── pages/        # Page components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities (auth, query client)
├── server/               # Backend (Express)
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database access layer
│   ├── db.ts             # Database connection (pg Pool + Drizzle)
│   └── seed.ts           # Database seeding
├── shared/
│   └── schema.ts         # Drizzle ORM schema + Zod validation (shared between frontend & backend)
├── uploads/              # File uploads (PDFs, photos) — created automatically
├── drizzle.config.ts     # Drizzle Kit configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## Key Technology Stack

**Backend:**
- Express 5 — HTTP server and API
- Drizzle ORM — Database queries and schema management
- bcryptjs — Password hashing
- express-session + connect-pg-simple — Sessions stored in PostgreSQL
- multer — File upload handling

**Frontend:**
- React 18 — UI framework
- Vite — Build tool and dev server
- TailwindCSS — Utility-first CSS
- Shadcn/UI (Radix UI) — Component library
- TanStack React Query — Server state management
- Wouter — Client-side routing
- date-fns — Date formatting (Dutch locale)
- Recharts — Charts and graphs
- Lucide React — Icons

## Database Tables

The schema (defined in `shared/schema.ts`) includes the following tables:

- `users` — User accounts with roles, departments, permissions
- `departments` — Organization departments
- `events` — Calendar events
- `announcements` — Company announcements
- `absences` — Leave/absence requests
- `rewards` — Employee reward points
- `applications` — External application links
- `app_access` — Application access permissions per user
- `messages` / `message_replies` — Internal messaging
- `ao_procedures` / `ao_instructions` — Administrative procedures
- `position_history` / `personal_development` — Employee history
- `legislation_links` — Legal references
- `cao_documents` — Collective labor agreement documents
- `functionering_reviews` — Performance review records
- `competencies` — Competency definitions per role
- `beoordeling_reviews` / `beoordeling_scores` — Competency-based assessments
- `jaarplan_items` — Annual plan items with progress tracking
- `help_content` — Page-specific help documentation
- `site_settings` — Application settings (login photo, etc.)

## Notes

- **Replit-specific Vite plugins** (`@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal`) are only loaded when the `REPL_ID` environment variable is set. They are safely skipped when running locally.
- **Uploads directory:** The app stores uploaded files (PDFs, photos) in the `uploads/` folder. Subdirectories are created automatically as needed.
- **Default admin account:** After running `db:push`, the seed script creates initial users. Check `server/seed.ts` for default credentials.
