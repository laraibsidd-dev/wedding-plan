CREATE TABLE IF NOT EXISTS wedding_rsvps (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guest_name VARCHAR(80) NOT NULL,
  attending BOOLEAN NOT NULL,
  party_size SMALLINT NOT NULL DEFAULT 0 CHECK (party_size BETWEEN 0 AND 6),
  plus_one BOOLEAN NOT NULL DEFAULT FALSE,
  arrival_date DATE,
  message VARCHAR(500),
  invite_route VARCHAR(24) NOT NULL CHECK (invite_route IN ('all', 'haldi-mehendi', 'nikah', 'walima')),
  language VARCHAR(10) NOT NULL CHECK (language IN ('en', 'hinglish')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((attending AND party_size BETWEEN 1 AND 6) OR (NOT attending AND party_size = 0))
);

-- Additive upgrades for RSVP tables created before plus-one and arrival tracking.
ALTER TABLE wedding_rsvps ADD COLUMN IF NOT EXISTS plus_one BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE wedding_rsvps ADD COLUMN IF NOT EXISTS arrival_date DATE;
