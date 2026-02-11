-- ============================================
-- STEP 8: ADD position AND color COLUMNS
-- ============================================
-- Run this AFTER step 7.
-- Adds position ordering and color to categories/links.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================

-- Add position to categories (for reordering left/right)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Add color to categories (user-chosen color hex)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT;

-- Add position to links (for reordering up/down)
ALTER TABLE links ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
