import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectMeals() {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error inspecting meals table:", error);
  } else {
    console.log("Sample meal row:", data[0]);
  }
}

inspectMeals();
