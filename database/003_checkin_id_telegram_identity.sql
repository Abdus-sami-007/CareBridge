-- CareBridge compatibility migration for existing Neon databases.
-- Fixes legacy integer check-in IDs so generated CHK-* string IDs can be stored.
ALTER TABLE checkins ALTER COLUMN id DROP DEFAULT;
ALTER TABLE checkins ALTER COLUMN id TYPE VARCHAR(255) USING id::text;

-- Link a Telegram account to one active victim record.
ALTER TABLE victims ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_victims_telegram_username
ON victims ((LOWER(REPLACE(telegram_username, '@', ''))))
WHERE telegram_username IS NOT NULL;
