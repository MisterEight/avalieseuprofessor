-- Schema for AvaliaProf API

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institutions (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  UNIQUE (institution_id, nome)
);

CREATE TABLE IF NOT EXISTS professors (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  bio TEXT
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluation_status') THEN
    CREATE TYPE evaluation_status AS ENUM ('pendente', 'aprovada', 'rejeitada');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status evaluation_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professors_institution ON professors (institution_id);
CREATE INDEX IF NOT EXISTS idx_professors_department ON professors (department_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_professor_status ON evaluations (professor_id, status);
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON evaluations (user_id);
