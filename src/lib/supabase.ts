import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables. Check your .env file.");
} else {
  console.log("[DEBUG] Supabase client initialized with URL:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
