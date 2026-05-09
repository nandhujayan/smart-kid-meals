import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStatus() {
  console.log("🔍 Checking 'meal_library' table...");
  const { error: tableError } = await supabase
    .from('meal_library')
    .select('*', { count: 'exact', head: true });

  if (tableError) {
    console.log("❌ Table 'meal_library' error:", tableError.message);
  } else {
    console.log("✅ Table 'meal_library' exists.");
    
    // Check for ingredient_tags column
    const { error: colError } = await supabase
      .from('meal_library')
      .select('ingredient_tags')
      .limit(1);
    
    if (colError) {
      console.log("❌ Column 'ingredient_tags' does NOT exist.");
    } else {
      console.log("✅ Column 'ingredient_tags' exists.");
    }
  }

  console.log("🔍 Checking RPC 'find_meal_in_library'...");
  try {
    const { data, error: rpcError } = await supabase.rpc('find_meal_in_library', {
      p_age_group: '6-12 months',
      p_diet_type: 'regular',
      p_meal_type: 'breakfast',
      p_goal: 'balanced'
    });

    if (rpcError) {
      console.log("❌ RPC 'find_meal_in_library' error:", rpcError.message);
    } else {
      console.log("✅ RPC 'find_meal_in_library' is available.");
    }
  } catch (err) {
    console.log("❌ RPC 'find_meal_in_library' call threw error:", err.message);
  }
}

checkStatus();
