ALTER TABLE medewerker_jaarplan_acties
  ADD COLUMN IF NOT EXISTS startdatum DATE,
  ADD COLUMN IF NOT EXISTS einddatum DATE,
  ADD COLUMN IF NOT EXISTS voortgang INTEGER;
