import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is verplicht in productie. Stel een PostgreSQL connection string in (zie .env.example en DEPLOY.md sectie 3).",
    );
  }
  // In development we still throw — silent fallbacks lead to hard-to-debug
  // failures further down the call chain. Be explicit.
  throw new Error(
    "DATABASE_URL is niet ingesteld. Maak een lokale PostgreSQL aan en zet DATABASE_URL in je .env.",
  );
}

const pool = new pg.Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
