# Office Hub — Deploy gids (extern, buiten Replit)

Dit document beschrijft hoe je Office Hub kunt installeren en draaien op een
andere host (bv. Render, Fly.io, Railway, Hetzner, je eigen VPS) met een
externe PostgreSQL-database, en de bijbehorende mobiele app via EAS publiceert.

> **Doel:** dezelfde codebase draaien zonder Replit-specifieke afhankelijkheden.

---

## 1. Wat draait er?

Het project bestaat uit drie hoofd-onderdelen (in een **pnpm monorepo**):

| Onderdeel              | Pad                                | Wat het is                          |
| ---------------------- | ---------------------------------- | ----------------------------------- |
| API server             | `artifacts/api-server`             | Express + TypeScript + PostgreSQL   |
| Web app                | `artifacts/office-hub`             | React 18 + Vite, gebouwd naar `dist/public` |
| Mobile app             | `artifacts/office-hub-mobile`      | Expo / React Native, gebouwd via EAS |
| Gedeelde DB-schema's   | `lib/db`                           | Drizzle ORM schema's en migrations   |

Voor productie-hosting zijn er twee aanbevolen vormen:

* **Eén service** — de Express server dient ook de gebouwde web-app als
  statische bestanden. Eenvoudig en goedkoop. (Stel `SERVE_WEB_DIR` in.)
* **Twee services** — API en web apart. Meer flexibel maar complexer.

De mobile app draait **altijd** los: gebruikers installeren de gebouwde
APK/IPA via TestFlight, Play Store, of een interne distributie.

---

## 2. Vereisten

* **Node.js 24.x** (zie `.nvmrc` indien aanwezig).
* **pnpm 10.x** (`corepack enable && corepack prepare pnpm@10 --activate`).
* **PostgreSQL 14+** (managed: Neon, Supabase, RDS, of zelf gehost).
* Voor mobile: een **EAS-account** (`npm i -g eas-cli && eas login`).

---

## 3. Omgevingsvariabelen

Kopieer `.env.example` en vul in. De belangrijkste variabelen:

### API server (verplicht in productie)

| Variabele                | Beschrijving                                              |
| ------------------------ | --------------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string                              |
| `SESSION_SECRET`         | Lange willekeurige string (`openssl rand -hex 32`)        |
| `CORS_ALLOWED_ORIGINS`   | Komma-gescheiden lijst van toegestane web-origins         |
| `NODE_ENV=production`    | Schakelt secure cookies, hard-fails op missende secrets   |
| `PORT`                   | Poort waarop de server luistert (host bepaalt dit vaak)   |

### API server (optioneel)

| Variabele                | Beschrijving                                              |
| ------------------------ | --------------------------------------------------------- |
| `SERVE_WEB_DIR`          | Pad naar `office-hub/dist/public` om web mee te dienen    |
| `ADMIN_INITIAL_PASSWORD` | Wachtwoord voor 'admin' bij eerste opstart (lege DB)      |
| `SAMPLE_USER_PASSWORD`   | Wachtwoord voor demo-gebruikers (alleen relevant in dev)  |

### Web (build-tijd)

| Variabele                | Beschrijving                                              |
| ------------------------ | --------------------------------------------------------- |
| `BASE_PATH`              | Sub-pad indien gehost onder bv. `/app/`. Standaard `/`.   |

### Mobile (Expo / EAS)

| Variabele                | Beschrijving                                              |
| ------------------------ | --------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`    | Volledige API-URL die de mobiele app aanroept             |

`EXPO_PUBLIC_API_URL` wordt **bij build time** in de bundle ingebakken (zo
werkt Expo). Stel het in via `eas.json` per profiel.

---

## 4. Database opzetten

```bash
# 1. installeer dependencies
pnpm install

# 2. genereer een baseline migration vanuit het huidige schema
#    (eenmalig, lokaal — committeer de output in lib/db/migrations/)
DATABASE_URL=postgres://… pnpm --filter @workspace/db run generate

# 3a. Verse database — pas migrations toe
DATABASE_URL=postgres://… pnpm --filter @workspace/db run migrate

# 3b. Bestaande database (huidige Replit data) — sync schema zonder migration
DATABASE_URL=postgres://… pnpm --filter @workspace/db run push
```

Op een productie-host draai je vóór elke release:

```bash
pnpm --filter @workspace/db run migrate
```

> **Eerste keer:** als je een **bestaande** database overneemt (bv. een dump
> van de huidige Replit-DB), draai dan **niet** direct `migrate` — gebruik
> eerst eenmalig `push` om de schema-staat te synchroniseren, en markeer
> daarna de baseline migration als toegepast. Of begin met een verse DB en
> importeer je data na de migration.

### Data migreren vanaf Replit

```bash
# Op je werkmachine:
pg_dump $REPLIT_DATABASE_URL --no-owner --no-acl > office-hub-backup.sql

# Naar je nieuwe DB:
psql $NEW_DATABASE_URL < office-hub-backup.sql
```

---

## 5. Bouwen

```bash
# Web (genereert artifacts/office-hub/dist/public/)
pnpm --filter @workspace/office-hub run build

# API (genereert artifacts/api-server/dist/index.mjs)
pnpm --filter @workspace/api-server run build
```

Of in één commando:

```bash
pnpm -r --filter "./artifacts/api-server" --filter "./artifacts/office-hub" run build
```

---

## 6. Draaien

### Optie A — Eén service (web + API samen)

Draai het commando vanuit de **repo-root**. `SERVE_WEB_DIR` wordt geresolved
relatief aan de werkmap (cwd):

```bash
NODE_ENV=production \
DATABASE_URL=postgres://… \
SESSION_SECRET=… \
CORS_ALLOWED_ORIGINS=https://office-hub.example.com \
SERVE_WEB_DIR=artifacts/office-hub/dist/public \
PORT=8080 \
node artifacts/api-server/dist/index.mjs
```

Tip: gebruik altijd een absoluut pad als je niet zeker weet wat de cwd is
op je host (bv. `/app/artifacts/office-hub/dist/public` op Render).

De Express server dient nu:
* `/api/*` → API endpoints
* `/uploads/*` → bestanden (lokale schijf, zie waarschuwing onder)
* alles anders → de gebouwde React-app (SPA fallback)

### Optie B — Twee services

* **API:** zelfde commando als boven, **zonder** `SERVE_WEB_DIR`.
* **Web:** serveer `artifacts/office-hub/dist/public/` met een willekeurige
  static-host (Cloudflare Pages, Netlify, Nginx, …). Configureer een proxy
  zodat `/api/*` doorgestuurd wordt naar de API service.

---

## 7. ⚠️ Bestanden / uploads — actie vereist

**Belangrijk:** in deze codebase worden uploads (PDF's, foto's, beloningen,
nieuwsbrieven, CAO-documenten, …) momenteel opgeslagen op de **lokale
schijf** van de API server, in `artifacts/api-server/uploads/`.

Dit werkt **niet** op platforms zonder persistente schijf:

* **Render Free** — schijf wordt bij elke deploy gewist.
* **Fly.io / Heroku** — ephemerale containers; uploads verdwijnen bij restart.
* **Railway / VPS** — werkt mits je een volume mount instelt.

Voor productie buiten Replit raden we object storage aan (S3-compatible):

| Provider           | Compatibel? | Kosten (richtprijs)            |
| ------------------ | ----------- | ------------------------------ |
| Cloudflare R2      | ✅ S3 API   | Gratis < 10 GB, geen egress    |
| AWS S3             | ✅          | ~$0.023/GB/maand               |
| Backblaze B2       | ✅ S3 API   | $0.006/GB/maand                |
| MinIO (self-hosted)| ✅ S3 API   | Gratis, je betaalt de server   |

**Migratie naar object storage is een aparte werkpost** — er moeten
upload-routes en serve-routes worden aangepast (o.a. `multer.diskStorage`
vervangen door een S3 client, en `express.static` vervangen door een
proxy of presigned URLs). Tijdelijk kun je een persistent volume gebruiken
(Fly.io volumes, Railway volumes, of `/var/data` op een VPS) en later
migreren.

Plaats de huidige uploads-map (`artifacts/api-server/uploads/`, ~51 MB)
op die volume; de bestaande paden (`/uploads/Aankondigingen/...`,
`/uploads/CAO/...`, …) blijven dan werken.

---

## 8. Mobile (Expo / EAS)

### Configuratie

In `artifacts/office-hub-mobile/app.json`:

* `expo.extra.apiUrl` — fallback API-URL, alleen gebruikt als
  `EXPO_PUBLIC_API_URL` niet is ingesteld bij build-time.
* `expo.plugins.expo-router.origin` — vervang
  `https://office-hub.example.com/` met **jouw productie web-domein**
  (gebruikt voor universal links / deep linking).

### `eas.json` (voorbeeld)

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.office-hub.example.com"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.office-hub.example.com"
      },
      "distribution": "internal"
    }
  }
}
```

### Bouwen

```bash
cd artifacts/office-hub-mobile
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Lokale ontwikkeling (zonder Replit)

```bash
pnpm --filter @workspace/office-hub-mobile run dev:local
```

---

## 9. Voorbeeld: Render.com (één service, gratis tier-vriendelijk)

1. Maak een nieuwe **Web Service** aan, gekoppeld aan je GitHub repo.
2. Build command:
   ```
   corepack enable && pnpm install --frozen-lockfile && \
   pnpm --filter @workspace/db run migrate && \
   pnpm --filter @workspace/office-hub run build && \
   pnpm --filter @workspace/api-server run build
   ```
3. Start command:
   ```
   node artifacts/api-server/dist/index.mjs
   ```
4. Environment variables (zie sectie 3). Vergeet niet:
   * `SERVE_WEB_DIR=/opt/render/project/src/artifacts/office-hub/dist/public`
   * `NODE_ENV=production`
5. Voeg een **PostgreSQL** add-on of externe DB toe en koppel `DATABASE_URL`.
6. Voeg een **Persistent Disk** toe gemount op
   `/opt/render/project/src/artifacts/api-server/uploads`
   (of migreer eerst naar object storage — zie sectie 7).

---

## 10. Eerste keer inloggen (productie)

Bij een **lege gebruikers-tabel** maakt de server automatisch een `admin`
account aan op de eerste start.

* Indien `ADMIN_INITIAL_PASSWORD` is ingesteld → dat wachtwoord wordt gebruikt.
* Anders (in productie) → een willekeurig wachtwoord wordt gegenereerd en
  **eenmalig** in de logs getoond. Voorbeeld:

  ```
  ============================================================
  [BOOTSTRAP] Geen ADMIN_INITIAL_PASSWORD ingesteld in productie.
  Tijdelijk admin-wachtwoord: aB3kZxq9_LmN2tPv-Q4yR8…
  Log in als 'admin' en wijzig dit wachtwoord onmiddellijk.
  ============================================================
  ```

Log in en wijzig het wachtwoord direct via Beheer → Profiel.

---

## 11. Health check

```bash
curl https://api.office-hub.example.com/api/healthz
# {"status":"ok"}
```

Gebruik dit endpoint voor uptime monitoring (UptimeRobot, BetterStack, …).

---

## 12. Wat is er **niet** geregeld in deze release?

Bewust uitgesteld — vereist een eigen task:

* **Object storage migratie** (zie sectie 7). Code-aanpassingen aan
  upload-routes nodig, plus een data-kopie van de bestaande 51 MB.
* **Geforceerd wachtwoord wijzigen na eerste login.** Voor nu is de
  beveiliging dat het wachtwoord random is en éénmalig in de logs staat.
* **Automatische rollback / blue-green deploys.** Afhankelijk van je host.
* **Backups van de database.** Configureer dit bij je DB-provider
  (Neon en Supabase doen dit automatisch).

---

## 13. Hulp / debugging

* API logs: structured JSON via pino. In productie pipe je deze naar je
  log-aggregator (Datadog, BetterStack, Logtail, …).
* Web-app preview path: stel `BASE_PATH=/` in (of laat leeg) tenzij je onder
  een sub-pad host.
* Als de mobiele app niet kan inloggen: controleer dat `EXPO_PUBLIC_API_URL`
  in de **gebouwde** bundle staat (`eas build` ipv lokale `dev`) en dat het
  domein in `CORS_ALLOWED_ORIGINS` van de API staat.
