-- ============================================
-- STEP 2: CREATE ALL TABLES
-- ============================================
-- Run this AFTER step 1.
-- ============================================

-- Profiles table (stores user display name)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table (folders for organizing links)
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT NOT NULL DEFAULT 'None',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Links table (the saved URLs)
CREATE TABLE links (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT DEFAULT '',
  type TEXT NOT NULL,
  subtype TEXT NOT NULL DEFAULT 'None',
  category_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  file_name TEXT,
  file_url TEXT,
  notes TEXT DEFAULT '',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Notes table (standalone notes)
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
