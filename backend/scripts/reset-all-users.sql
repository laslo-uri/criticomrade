-- One-time reset: remove all users and dependent rows. Roles and movies are kept.
-- Run: psql -U postgres -d criticomrade -f scripts/reset-all-users.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'
  ) THEN
    TRUNCATE TABLE password_reset_tokens RESTART IDENTITY;
  END IF;
END $$;

TRUNCATE TABLE users RESTART IDENTITY CASCADE;
