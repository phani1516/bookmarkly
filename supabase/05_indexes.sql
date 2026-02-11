-- ============================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================
-- Run this AFTER step 4.
-- These make queries faster.
-- ============================================

CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_categories_deleted ON categories(is_deleted);

CREATE INDEX idx_links_user ON links(user_id);
CREATE INDEX idx_links_deleted ON links(is_deleted);
CREATE INDEX idx_links_category ON links(category_id);
CREATE INDEX idx_links_type ON links(type);

CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_deleted ON notes(is_deleted);
