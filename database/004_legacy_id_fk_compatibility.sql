-- CareBridge legacy Neon schema compatibility.
-- Older deployments may have INTEGER victims.id / checkins.victim_id.
-- CareBridge now uses string identifiers such as V001 and CHK-*.

BEGIN;

ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_victim_id_fkey;
ALTER TABLE checkins DROP CONSTRAINT IF EXISTS fk_victim;

ALTER TABLE victims
  ALTER COLUMN id TYPE VARCHAR(255) USING id::text;

ALTER TABLE checkins
  ALTER COLUMN victim_id TYPE VARCHAR(255) USING victim_id::text;

ALTER TABLE checkins
  ALTER COLUMN id DROP DEFAULT;

ALTER TABLE checkins
  ALTER COLUMN id TYPE VARCHAR(255) USING id::text;

ALTER TABLE checkins
  ADD CONSTRAINT checkins_victim_id_fkey
  FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE;

COMMIT;
