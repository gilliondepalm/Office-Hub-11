CREATE TABLE IF NOT EXISTS medewerker_jaarplan_voortgang (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  actie_id VARCHAR NOT NULL REFERENCES medewerker_jaarplan_acties(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  toelichting TEXT NOT NULL,
  percentage INTEGER,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
