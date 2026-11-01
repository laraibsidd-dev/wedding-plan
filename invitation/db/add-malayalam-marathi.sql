-- Historical migration used when Malayalam and Marathi were added.
-- Do not rerun for the current English/Hinglish-only application.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.wedding_rsvps DROP CONSTRAINT IF EXISTS wedding_rsvps_language_check;
ALTER TABLE public.wedding_rsvps ADD CONSTRAINT wedding_rsvps_language_check
  CHECK (language IN ('en', 'hinglish', 'hi', 'ur', 'kn', 'ta', 'ml', 'mr'));
COMMIT;
