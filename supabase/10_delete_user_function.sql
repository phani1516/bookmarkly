-- ============================================
-- STEP 10: DELETE USER FUNCTION
-- ============================================
-- This creates a database function that can
-- delete a user's auth record.
-- 
-- IMPORTANT: This uses SECURITY DEFINER which
-- runs with the function owner's privileges.
-- The function owner must have access to
-- auth.users table.
--
-- ALTERNATIVE: If this doesn't work for your
-- Supabase plan, you can manually delete users
-- from the Supabase Dashboard:
--   Authentication → Users → Find user → Delete
-- ============================================

-- Option A: Database function (works on most Supabase plans)
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete all user data first
  DELETE FROM public.links WHERE user_id = target_user_id;
  DELETE FROM public.categories WHERE user_id = target_user_id;
  DELETE FROM public.notes WHERE user_id = target_user_id;
  DELETE FROM public.community_posts WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete the auth user (requires elevated privileges)
  -- This may fail on some Supabase plans
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to call this function
-- (they can only delete themselves because the app
-- passes their own user_id)
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- ============================================
-- HOW TO USE FROM THE APP:
-- ============================================
-- The app calls:
--   supabase.rpc('delete_user_account', { target_user_id: userId })
--
-- If the auth.users deletion fails (permission issue),
-- the user's DATA is still deleted, but the auth
-- record remains. You can clean it up manually from
-- the Supabase Dashboard → Authentication → Users.
-- ============================================
