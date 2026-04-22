# Running This Application Locally

## Prerequisites

1. **Node.js** v20 or higher
2. **npm** v10 or higher
3. **PostgreSQL** v14 or higher (running locally or remotely)

## Environment Variable

Set one environment variable before running:

- `DATABASE_URL` — Your PostgreSQL connection string

Example:
```
DATABASE_URL=postgresql://username:password@localhost:5432/kantoor_dashboard
```

You can set this in your terminal session or create a `.env` file (note: the app reads from `process.env` directly, so you may need a tool like `dotenv` or export it manually).

## Installation

```bash
npm install
```

## Database Setup

Create a PostgreSQL database, then push the schema:

```bash
npm run db:push
```

This uses Drizzle Kit to automatically create all required tables:

- `users` — User accounts with roles, departments, and permissions
- `departments` — Organizational departments
- `absences` — Leave and absence requests
- `announcements` — Company announcements
- `rewards` — Employee reward points
- `events` — Calendar events
- `ao_procedures` / `ao_procedure_steps` — Organizational procedures
- `legislation_links` — Legislation references
- `functionering_reviews` — Performance review forms
- `competencies` — Competencies per job function with normering descriptions
- `beoordeling_reviews` / `beoordeling_scores` — Competency-based assessments
- `site_settings` — Application settings (dashboard photo, login photo, etc.)
- `session` — User sessions (managed by connect-pg-simple)

## Running in Development

```bash
npm run dev
```

This starts an Express backend and Vite frontend dev server together on port **5000**.

Open your browser at: `http://localhost:5000`

## Building for Production

```bash
npm run build
```

This builds the Vite frontend and bundles the Express server into `dist/`.

## Running in Production

```bash
npm run start
```

Starts the production server from `dist/index.cjs`.

## Uploaded Files

The `uploads/` directory contains static files used by the application (photos, PDFs), organized in subdirectories:

- `uploads/Aankondigingen/` — Announcement PDF attachments
- `uploads/CAO/` — Collective labor agreement documents
- `uploads/Wetgeving/` — Legislation documents
- `uploads/Instructies/` — Instruction documents
- `uploads/Nieuwsbrief/` — Newsletter documents
- `uploads/sample-dashboard-photo.jpg` — Default dashboard photo
- `uploads/sample-login-photo.jpg` — Default login photo
- `uploads/curacao_login.jpg` — Login background photo

Copy this entire `uploads/` folder when setting up locally to preserve existing content.

## Default Admin Account

After first setup, the application seeds a default admin account. Check `server/seed.ts` (if present) or create a user manually in the database.

## Replit-Specific Plugins

The `vite.config.ts` includes three Replit-specific dev plugins:

- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`
- `@replit/vite-plugin-runtime-error-modal`

These only activate when running on Replit (when the `REPL_ID` environment variable is set). They will not load or cause issues when running locally. You can optionally remove them from `vite.config.ts` and `devDependencies` in `package.json` for a cleaner local setup.

## TypeScript Check

To verify there are no type errors:

```bash
npm run check
```
