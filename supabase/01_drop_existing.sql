-- ============================================
-- STEP 1: DROP EXISTING TABLES (if any)
-- ============================================
-- Run this FIRST if you have old tables.
-- If this is a fresh Supabase project, skip this file.
-- ============================================

DROP POLICY IF EXISTS "Users own links" ON links;
DROP POLICY IF EXISTS "Users own categories" ON categories;
DROP POLICY IF EXISTS "Users own notes" ON notes;
DROP POLICY IF EXISTS "Users own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own links" ON links;
DROP POLICY IF EXISTS "Users can insert own links" ON links;
DROP POLICY IF EXISTS "Users can update own links" ON links;
DROP POLICY IF EXISTS "Users can read own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can read own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
