import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const { data, error } = await supabase.rpc('get_tables'); // Some projects have this, but let's try a direct query
  
  // Alternative: query information_schema
  const { data: tables, error: tableError } = await supabase
    .from('ai_meal_cache')
    .select('*', { count: 'exact', head: true });

  if (tableError) {
    console.error("Error checking ai_meal_cache:", tableError);
  } else {
    console.log("ai_meal_cache exists.");
  }

  // Try to check for a generic 'meals' table
  const { error: mealsPageError } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true });

  if (mealsPageError && mealsPageError.code === '42P01') {
    console.log("Table 'meals' does not exist.");
  } else if (!mealsPageError) {
    console.log("Table 'meals' exists.");
  }
}

checkTables();
