-- CareBridge: clinical baseline migration
ALTER TABLE victims ADD COLUMN IF NOT EXISTS baseline_distress_score NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE victims ADD COLUMN IF NOT EXISTS doctor_initial_score NUMERIC(5,2);
ALTER TABLE victims ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255);
ALTER TABLE victims ADD COLUMN IF NOT EXISTS doctor_notes TEXT;

-- Set a clinician's baseline explicitly for each case.
-- Example:
-- UPDATE victims
-- SET doctor_initial_score = 42,
--     baseline_distress_score = 42,
--     doctor_name = 'Dr. Sharma',
--     doctor_notes = 'Initial clinical assessment'
-- WHERE id = 'V001';

-- Verify longitudinal data:
SELECT v.id, v.name, v.baseline_distress_score, v.doctor_initial_score,
       v.latest_score, COUNT(c.id) AS checkin_count
FROM victims v
LEFT JOIN checkins c ON c.victim_id = v.id
GROUP BY v.id, v.name, v.baseline_distress_score, v.doctor_initial_score, v.latest_score
ORDER BY v.id;
