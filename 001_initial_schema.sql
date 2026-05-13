-- ============================================================
-- Motion Architecture Portfolio — Initial Schema Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. EXTENSIONS
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- gives us uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "citext";      -- case-insensitive text for slugs/emails

-- ──────────────────────────────────────────────
-- 2. TABLES
-- ──────────────────────────────────────────────

-- projects -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  slug          CITEXT      NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category      TEXT        NOT NULL,                     -- e.g. "Residential", "Commercial"
  description   TEXT        NOT NULL,
  tools_used    TEXT[]      NOT NULL DEFAULT '{}',        -- e.g. ARRAY['Blender', 'After Effects']
  thumbnail_url TEXT        NOT NULL,                     -- Supabase Storage public URL
  video_url     TEXT,                                     -- optional Supabase Storage public URL
  is_featured   BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email      CITEXT      NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  subject    TEXT        NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  message    TEXT        NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 3. INDEXES
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_slug       ON public.projects (slug);
CREATE INDEX IF NOT EXISTS idx_projects_category   ON public.projects (category);
CREATE INDEX IF NOT EXISTS idx_projects_featured   ON public.projects (is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_created    ON public.projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created    ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread     ON public.messages (is_read) WHERE is_read = FALSE;

-- ──────────────────────────────────────────────
-- 4. UPDATED-AT TRIGGER
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ──────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────

-- Enable RLS on both tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ── projects policies ──────────────────────────
-- Anyone (anonymous + authenticated) can read projects
CREATE POLICY "projects_public_read"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Only service_role (your backend) can insert / update / delete
CREATE POLICY "projects_service_insert"
  ON public.projects
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "projects_service_update"
  ON public.projects
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "projects_service_delete"
  ON public.projects
  FOR DELETE
  TO service_role
  USING (TRUE);

-- ── messages policies ─────────────────────────
-- Anonymous users can INSERT (submit contact form)
CREATE POLICY "messages_anon_insert"
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Only service_role can read / update messages
CREATE POLICY "messages_service_read"
  ON public.messages
  FOR SELECT
  TO service_role
  USING (TRUE);

CREATE POLICY "messages_service_update"
  ON public.messages
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "messages_service_delete"
  ON public.messages
  FOR DELETE
  TO service_role
  USING (TRUE);