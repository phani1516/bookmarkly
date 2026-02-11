-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================
-- Run this AFTER step 2.
-- This ensures users can only access their own data.
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
