# Bookmarkly — Supabase Setup Guide

## How to run these SQL files

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy-paste each file below **one at a time, in order**
6. Click **Run** after each one

## Order of execution

| Step | File | What it does |
|------|------|-------------|
| 1 | `01_drop_existing.sql` | Removes old tables (skip if fresh project) |
| 2 | `02_create_tables.sql` | Creates profiles, categories, links, notes tables |
| 3 | `03_enable_rls.sql` | Enables Row Level Security on all tables |
| 4 | `04_rls_policies.sql` | Creates policies so users only see their own data |
| 5 | `05_indexes.sql` | Adds indexes for faster queries |
| 6 | `06_storage_bucket.sql` | Creates document upload bucket |
| 7 | `07_auto_profile_trigger.sql` | Auto-creates profile when user signs up |
| 8 | `08_add_position_color.sql` | Adds position & color columns for reordering |
| 9 | `09_community_table.sql` | Creates shared community_posts table |
| 10 | `10_delete_user_function.sql` | Creates delete account database function |

## After running all SQL files

### Enable Email Auth
1. Go to **Authentication** → **Providers** → **Email**
2. Make sure it is **ON**
3. For testing: turn OFF "Confirm email" (turn it back ON for production)

### Enable Google Auth
1. Go to **Authentication** → **Providers** → **Google**
2. Toggle it **ON**
3. Go to Google Cloud Console: https://console.cloud.google.com
4. Create or select a project
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **OAuth 2.0 Client ID**
7. Application type: **Web application**
8. Add Authorized redirect URI: `https://dupnqfzzhcxtzewnlaft.supabase.co/auth/v1/callback`
9. Copy **Client ID** and **Client Secret**
10. Paste them into the Supabase Google provider settings
11. Save

### Set Redirect URL
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g., `https://your-app.vercel.app`)
3. Add the same URL to **Redirect URLs**
4. Save

## Verify setup

After running all SQL, go to **Table Editor** in your Supabase dashboard.
You should see these 4 tables:
- `profiles`
- `categories`
- `links`
- `notes`

Each table should show a lock icon (RLS enabled).

## That's it!

The app will now:
- Save links to Supabase when user is signed in
- Pull all data back when user signs in on a new device
- Work offline using localStorage when not signed in
