import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is verplicht voor migrations.");
  process.exit(1);
}

const migrationsFolder = path.resolve(__dirname, "..", "migrations");

if (!fs.existsSync(migrationsFolder)) {
  console.error(
    `Geen migrations gevonden in ${migrationsFolder}. Genereer ze eerst met: pnpm --filter @workspace/db run generate`,
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

try {
  await migrate(db, { migrationsFolder });
  console.log(`Migrations succesvol toegepast vanuit ${migrationsFolder}`);
} catch (err) {
  console.error("Migration mislukt:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
