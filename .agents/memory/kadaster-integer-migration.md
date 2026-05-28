---
name: kadasterId integer migration
description: kadaster_id and related userid fields were migrated from text/varchar to INTEGER throughout the stack.
---

## Rule
All `kadaster_id` / `userid` fields in `users`, `correctieverzoeken`, `werktijden`, `overuur_aanvragen`, and `prikklok_event_log` are INTEGER in the database. They must be treated as numbers throughout the backend and stored as numbers.

**Why:** Migration was applied via ALTER TABLE. Drizzle schema already reflects `integer()`. Storing strings would cause Postgres type-cast errors.

**How to apply:**
- Backend: `getNextKadasterId()` returns `number`. `getWerktijden()` accepts `number | string`. CSV prikklok import uses `parseInt(rawUserId, 10)`.
- Frontend forms (e.g. personalia.tsx): keep Zod field as `z.string().optional()` (text input), but convert with `Number(data.kadasterId)` before sending to API, and `String(user.kadasterId)` when populating form defaults.
- Comparisons: when comparing state strings to DB numbers, use `String(dbValue) === stateString` or `dbValue === Number(stateString)`.
- Sorting in rapporten.tsx: use numeric subtraction `(a.kadasterId ?? 0) - (b.kadasterId ?? 0)` not `localeCompare`.
