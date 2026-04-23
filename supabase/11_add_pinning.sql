-- ============================================
-- STEP 11: ADD is_pinned COLUMNS
-- ============================================
-- Run this AFTER step 10.
-- Adds pinning support for categories and links.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================

-- Add is_pinned to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_pinned to links
ALTER TABLE links ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Add indexes for pinned items
CREATE INDEX IF NOT EXISTS idx_categories_pinned ON categories(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_links_pinned ON links(is_pinned) WHERE is_pinned = TRUE;
