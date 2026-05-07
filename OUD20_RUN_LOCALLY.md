# Kantoor Dashboard - Lokaal Installeren

## Vereisten

Installeer de volgende software op uw computer:

- **Node.js** (versie 20 of hoger) - https://nodejs.org
- **PostgreSQL** (versie 14 of hoger) - https://www.postgresql.org/download/
- **Git** (optioneel, om de code van GitHub te klonen)

## Stap 1: Code ophalen

```bash
git clone https://github.com/gilliondepalm/Office-hub1.git
cd Office-hub1
```

## Stap 2: Dependencies installeren

```bash
npm install
```

Dit installeert automatisch alle benodigde packages, waaronder:
- Express (webserver)
- React + Vite (frontend)
- Drizzle ORM (database)
- bcryptjs (wachtwoorden)
- connect-pg-simple (sessies)
- TanStack React Query (data fetching)
- Tailwind CSS + shadcn/ui (styling)

## Stap 3: PostgreSQL database aanmaken

Open een terminal of command prompt en maak een nieuwe database aan:

```bash
createdb kantoor_dashboard
```

## Stap 4: Omgevingsvariabelen instellen

Maak een `.env` bestand aan in de hoofdmap van het project met de volgende inhoud:

```
DATABASE_URL=postgresql://gebruikersnaam:wachtwoord@localhost:5432/kantoor_dashboard
SESSION_SECRET=een_willekeurige_lange_tekst_hier
```

Vervang `gebruikersnaam` en `wachtwoord` door uw PostgreSQL-inloggegevens.

## Stap 5: Database tabellen aanmaken

```bash
npm run db:push
```

Dit maakt automatisch alle benodigde tabellen aan in de database.

## Stap 6: Applicatie starten

```bash
npm run dev
```

De applicatie draait nu op **http://localhost:5000**

## Productie

Voor een geoptimaliseerde versie:

1. `npm run build` — maakt een productieversie
2. `npm start` — draait de productieversie

## Overzicht commando's

| Commando | Wat het doet |
|---|---|
| `npm install` | Downloadt alle benodigde bibliotheken |
| `npm run db:push` | Maakt/actualiseert de databasetabellen |
| `npm run dev` | Start de app in ontwikkelmodus (herlaadt automatisch bij wijzigingen) |
| `npm run build` | Maakt een productieversie |
| `npm start` | Draait de productieversie |

## Inloggegevens

Bij de eerste keer starten wordt automatisch voorbeelddata aangemaakt. U kunt inloggen met:

| Gebruikersnaam | Wachtwoord | Rol |
|---|---|---|
| admin | admin123 | Beheerder (volledige toegang) |
| manager | user123 | Manager |
| diana | user123 | Manager |
| pieter | user123 | Medewerker |
| sophie | user123 | Medewerker |
| thomas | user123 | Medewerker |
| lisa | user123 | Medewerker |
| kevin | user123 | Medewerker |
| annemarie | user123 | Medewerker |
| ricardo | user123 | Medewerker |

## Belangrijke opmerkingen

- De applicatie draait op **poort 5000** (frontend en backend samen)
- De PostgreSQL database moet draaien voordat u de applicatie start
- Alle database-tabellen worden automatisch aangemaakt via `npm run db:push`
- Voorbeelddata (gebruikers, afdelingen, evenementen, etc.) wordt automatisch geladen bij de eerste start
- Het `file:///` protocol voor lokale documenten (zoals de Registration PDF onder Wetgeving) werkt alleen wanneer de app lokaal draait, niet vanuit Replit
- Het bestand `vite.config.ts` bevat enkele Replit-specifieke plugins die lokaal automatisch worden overgeslagen en geen problemen veroorzaken
