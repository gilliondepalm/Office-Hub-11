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
- **PWA** enabled via `vite-plugin-pwa` (autoUpdate service worker, Workbox precaching, Google Fonts runtime cache). Icons are SVGs in `public/`.

### Office Hub Mobile (`artifacts/office-hub-mobile/`) — port 22654
- Expo (React Native) app mirroring the web app's branding (green #27865A, dark sidebar #213B2F, yellow #FACC14)
- Tabs: Dashboard, Werktijden, Verzuim, Beloningen, Persoonlijk
- Calls the same `/api/*` endpoints as the web app via `EXPO_PUBLIC_DOMAIN`
- `metro.config.js` has a `blockList` excluding `.vite/` and `dist/` dirs from other artifacts to prevent Metro crash on ephemeral Vite cache files
- Auth via signed `X-Session-Token` header (server returns it in login response when `X-Client: mobile`); token stored in `AsyncStorage` (`lib/api.ts`)
- Brand assets in `assets/brand/` mirrored from api-server `uploads/App_pics/`
- **API base URL resolution** (`lib/api.ts` → `resolveApiBase()`), in order:
  1. `EXPO_PUBLIC_DOMAIN` env var, if set — explicit override (any environment)
  2. In production builds (`!__DEV__`, e.g. EAS Store builds): `expo.extra.apiUrl` from `app.json` — points at the published api-server (default: `https://workspace-gilliondepalm.replit.app`)
  3. Web preview (Expo for Web): derived from `window.location.hostname` (maps the `.expo.` Replit dev host back to the matching API host)
  4. Expo Go on a phone: derived from the dev server `hostUri` reported by `expo-constants`
- The api-server is the production target for `expo.extra.apiUrl`. Its production deploy is configured in `artifacts/api-server/.replit-artifact/artifact.toml` (autoscale, build via esbuild, run via `node dist/index.mjs`, health probe `/api/healthz`). After the user clicks Publish, confirm the resulting `.replit.app` domain matches `expo.extra.apiUrl` (or update `app.json` and rebuild the mobile app).

### API Server (`artifacts/api-server/`) — port 8080
- Express 5 + Drizzle ORM + PostgreSQL
- Routes: `src/routes/routes.ts` — 3927-line legacy `registerRoutes` function
- Paths served: `/api`, `/uploads`, `/PDF`
- Session auth via `express-session` + `connect-pg-simple`
- `X-Session-Token` header bridge (read pre-session, re-injected as `connect.sid` cookie) used by web (inside Replit iframe where Chrome blocks third-party cookies) and mobile clients
- Login returns `sessionToken` in body when `X-Client: web` or `X-Client: mobile` header is present
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
