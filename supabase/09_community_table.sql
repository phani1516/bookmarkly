-- ============================================
-- STEP 9: CREATE COMMUNITY POSTS TABLE
-- ============================================
-- Run this AFTER step 8.
-- This table is shared across ALL users.
-- Everyone can read all posts.
-- Users can only create/delete their own posts.
-- ============================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  note TEXT DEFAULT '',
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- EVERYONE can read all community posts
CREATE POLICY "Anyone can read community posts"
  ON community_posts FOR SELECT
  USING (true);

-- Users can only insert their own posts
CREATE POLICY "Users can create community posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own posts
CREATE POLICY "Users can delete own community posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_community_created
  ON community_posts(created_at DESC);
