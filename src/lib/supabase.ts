import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dupnqfzzhcxtzewnlaft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cG5xZnp6aGN4dHpld25sYWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDM2MDMsImV4cCI6MjA4NjE3OTYwM30.404qW1CAlHacEVz75KAuZwrYN3cZUvXYHOKAX2L6lvk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
