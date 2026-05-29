CREATE TABLE IF NOT EXISTS medewerker_jaarplan_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  year INTEGER NOT NULL,
  afspraken TEXT NOT NULL,
  start_datum DATE,
  eind_datum DATE,
  status TEXT DEFAULT 'niet gestart',
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medewerker_jaarplan_acties (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  jaarplan_id VARCHAR NOT NULL REFERENCES medewerker_jaarplan_items(id),
  datum DATE NOT NULL,
  actie TEXT NOT NULL,
  status TEXT DEFAULT 'niet gestart',
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
