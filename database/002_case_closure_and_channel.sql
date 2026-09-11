ALTER TABLE victims ADD COLUMN IF NOT EXISTS closed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE victims ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE victims ADD COLUMN IF NOT EXISTS closed_by VARCHAR(255);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS ingestion_channel VARCHAR(50) NOT NULL DEFAULT 'victim_dashboard';

CREATE INDEX IF NOT EXISTS idx_victims_closed ON victims(closed);
CREATE INDEX IF NOT EXISTS idx_checkins_channel ON checkins(ingestion_channel);
