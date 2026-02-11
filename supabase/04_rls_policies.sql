-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================
-- Run this AFTER step 3.
-- These policies control who can read/write what.
-- ============================================

-- PROFILES: users can only access their own profile
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CATEGORIES: users can only access their own categories
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- LINKS: users can only access their own links
CREATE POLICY "links_select" ON links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "links_insert" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "links_update" ON links
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTES: users can only access their own notes
CREATE POLICY "notes_select" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes_insert" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_update" ON notes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
