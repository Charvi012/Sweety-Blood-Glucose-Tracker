CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Emails are unique case-insensitively.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uniq ON users (lower(email));

CREATE TABLE IF NOT EXISTS readings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reading_date DATE        NOT NULL,
  slot         TEXT        NOT NULL
               CHECK (slot IN ('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner')),
  value        INTEGER     NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One reading per slot per day. With 4 slots this also guarantees "max 4 per day"
  -- at the database level, even under concurrent requests.
  CONSTRAINT readings_user_date_slot_uniq UNIQUE (user_id, reading_date, slot)
);
-- Roles: every account is a 'patient' (default) or a 'doctor'.
-- Existing users automatically receive the 'patient' role.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient'
  CHECK (role IN ('patient', 'doctor'));

-- A patient assigns a doctor; the doctor can then view that patient's reports.
CREATE TABLE IF NOT EXISTS doctor_patients (
  doctor_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  patient_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (doctor_id, patient_id),
  CHECK (doctor_id <> patient_id)
);

CREATE INDEX IF NOT EXISTS doctor_patients_patient_idx ON doctor_patients (patient_id);