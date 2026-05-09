import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAllTables() {
  const { data, error } = await supabase.from('saved_meals').select('*').limit(1);
  console.log("saved_meals structure:", data?.[0] ? Object.keys(data[0]) : "Empty");

  const { data: cacheData, error: cacheError } = await supabase.from('ai_meal_cache').select('*').limit(1);
  console.log("ai_meal_cache structure:", cacheData?.[0] ? Object.keys(cacheData[0]) : "Empty");
}

listAllTables();
