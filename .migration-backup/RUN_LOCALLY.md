# Lokaal draaien

Stap-voor-stap instructies om de applicatie op je eigen computer te draaien.

---

## Vereiste software

| Software | Versie | Download |
|---|---|---|
| **Node.js** | v20 of hoger (getest op v20.20.0) | https://nodejs.org |
| **npm** | Meegeleverd met Node.js | — |
| **PostgreSQL** | v14 of hoger aanbevolen | https://www.postgresql.org/download |

---

## Stap-voor-stap installatie

### 1. Project kopiëren

Zorg dat je de volgende mappen meekopieert vanuit Replit (of de bronmap):

```
/                        ← projectroot (alle bestanden)
├── uploads/             ← geüploade bestanden (zie sectie "Mappen")
└── attached_assets/     ← afbeeldingen en PDF's voor de frontend
```

### 2. Dependencies installeren

```bash
npm install
```

### 3. Omgevingsvariabelen instellen

Maak een bestand `.env` aan in de projectroot met de volgende inhoud:

```env
DATABASE_URL=postgresql://gebruiker:wachtwoord@localhost:5432/dbnaam
SESSION_SECRET=vervang-dit-door-een-lang-willekeurig-geheim
NODE_ENV=development
```

| Variabele | Verplicht | Standaard | Uitleg |
|---|---|---|---|
| `DATABASE_URL` | Ja | — | PostgreSQL verbindingsstring. De app start niet zonder dit. |
| `SESSION_SECRET` | Nee | Auto-gegenereerd | Sleutel voor het versleutelen van sessies. Stel in voor productie, anders worden sessies niet persistent na herstarts. |
| `NODE_ENV` | Nee | `development` | Gebruik `development` lokaal, `production` voor live. |
| `PORT` | Nee | `5000` | Poortnummer waarop de server luistert. |

### 4. Database aanmaken

Maak eerst een lege PostgreSQL database aan (bijv. `hrapp`), daarna:

```bash
npm run db:push
```

Dit maakt alle 42 tabellen automatisch aan op basis van het schema.

> **Met bestaande data:** Exporteer de database vanuit Replit met `pg_dump` en importeer deze lokaal met `psql`. Neem contact op met de beheerder voor een dump van de productiedata.

### 5. Applicatie starten

```bash
npm run dev
```

De app is daarna beschikbaar op: **http://localhost:5000**

---

## Beschikbare opdrachten

| Opdracht | Uitleg |
|---|---|
| `npm run dev` | Start de applicatie in ontwikkelmodus (server + frontend via Vite) |
| `npm run build` | Bouw de applicatie voor productie (output naar `dist/`) |
| `npm run start` | Start de gebouwde productieversie |
| `npm run db:push` | Synchroniseer het databaseschema (maak/update tabellen) |
| `npm run check` | Voer een TypeScript typecheck uit |

---

## Database

De applicatie gebruikt PostgreSQL met **42 tabellen**, waaronder:

- `users`, `departments`, `job_functions` — gebruikers en organisatie
- `absences`, `absence_cancellations` — verzuimregistratie
- `announcements`, `events`, `messages` — aankondigingen en berichten
- `functionering_reviews`, `beoordeling_reviews`, `beoordeling_scores` — functionering en beoordeling
- `maand_prod_kartograaf`, `maand_prod_landmeter` — maandelijkse productiedata
- `trend_km_buiten`, `trend_km_info`, `trend_or_info`, enz. — historische trenddata (t/m 2024)
- `rewards`, `yearly_awards` — beloningen
- `session` — sessieopslag (PostgreSQL-gebaseerd)

---

## Mappen die meegekopieerd moeten worden

De applicatie slaat bestanden op in de `uploads/` map. De server maakt de submappen automatisch aan als ze niet bestaan, maar de **inhoud** moet handmatig worden meegekopieerd als je bestaande data wilt behouden.

### `uploads/`

| Submap | Inhoud |
|---|---|
| `uploads/Aankondigingen/` | PDF-bijlagen bij aankondigingen |
| `uploads/Beloning/` | Afbeeldingen bij beloningen |
| `uploads/Functies/` | Functiebeschrijvingen (PDF/Word) |
| `uploads/Pasfoto/` | Pasfoto's van medewerkers |
| `uploads/App_pics/` | Achtergrondfoto's en app-afbeeldingen |
| `uploads/Huishoudelijkreglement/` | PDF van het huishoudelijk reglement |
| `uploads/CAO/` | CAO-documenten (PDF) |
| `uploads/Wetgeving/` | Wetgevingsdocumenten (PDF) |
| `uploads/Nieuwsbrief/` | Nieuwsbrieven (PDF) |
| `uploads/Instructies/` | Instructiedocumenten |

### `attached_assets/`

Bevat afbeeldingen en PDF's die direct in de frontend worden gebruikt (bijv. voorbeeldfoto's voor het loginscherm en dashboard).

---

## Replit-specifieke onderdelen

De `vite.config.ts` bevat drie Replit-plugins. Twee daarvan (`cartographer` en `dev-banner`) worden **automatisch overgeslagen** lokaal: ze laden alleen als de omgevingsvariabele `REPL_ID` aanwezig is én `NODE_ENV` niet `production` is. De derde plugin (`runtime-error-modal`) wordt altijd geladen maar heeft geen nadelig effect op lokaal gebruik. Er hoeft niets aan de configuratie te worden gewijzigd.

---

## Veelvoorkomende problemen

| Probleem | Oplossing |
|---|---|
| `DATABASE_URL` foutmelding bij opstarten | Controleer of `.env` bestaat en de variabele correct is ingesteld |
| Tabellen bestaan niet | Voer `npm run db:push` opnieuw uit |
| Bestanden ontbreken (foto's, PDF's) | Kopieer de `uploads/` en `attached_assets/` mappen |
| Poort 5000 al in gebruik | Stel `PORT=3000` (of ander getal) in in `.env` |
| Sessies verlopen na herstart | Stel `SESSION_SECRET` in als vaste waarde in `.env` |
