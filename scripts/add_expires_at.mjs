import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addExpiresAt() {
  console.log("Adding expires_at column to user_subscriptions...");
  const { error } = await supabase.rpc('execute_sql', {
    sql: `ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;`
  });

  if (error) {
    console.error("Error adding column:", error);
  } else {
    console.log("Success!");
  }
}

addExpiresAt();
