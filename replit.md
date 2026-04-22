# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (ESM bundle for api-server), Vite v7 (office-hub)

## Artifacts

### Office Hub (`artifacts/office-hub/`) — port 23442
- React + Vite + Tailwind CSS v3 web app
- Dutch-language HR/office management system
- Preview path: `/`
- Uses relative `/api/*` calls to the API server (proxied via reverse proxy)

### API Server (`artifacts/api-server/`) — port 8080
- Express 5 + Drizzle ORM + PostgreSQL
- Routes: `src/routes/routes.ts` — 3927-line legacy `registerRoutes` function
- Paths served: `/api`, `/uploads`, `/PDF`
- Session auth via `express-session` + `connect-pg-simple`
- File uploads via `multer` (pasfoto, beloningen, functies, aankondigingen, CSV)

### Shared Libraries
- `lib/db/` — Drizzle schema + DB connection (`@workspace/db`)

## Key Commands

- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/office-hub run dev` — run frontend locally

## Migration Notes (from `.migration-backup/`)

- Original monolithic Express + Vite app split into two artifacts
- Frontend type imports from `@shared/schema` → `src/lib/shared-schema.ts` (frontend-safe copy)
- Backend uses `@workspace/db` for database schema and connection
- DB tables already migrated; all 49 tables present in PostgreSQL
- Admin credentials: username `admin`, password `admin123`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
