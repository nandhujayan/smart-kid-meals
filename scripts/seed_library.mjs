import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedLibrary() {
  const filePath = path.join(process.cwd(), 'data', 'massive_meals.json');
  if (!fs.existsSync(filePath)) {
    console.error("❌ Massive meals file not found. Run the generator script first.");
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const meals = JSON.parse(rawData);
  const total = meals.length;
  const BATCH_SIZE = 1000;

  console.log(`🚀 Seeding ${total} meals into 'meal_library'...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = meals.slice(i, i + BATCH_SIZE).map(meal => ({
      age_group: meal.ageGroup,
      diet_type: meal.diet,
      meal_type: meal.mealType,
      goal: meal.goal,
      meal_name: meal.mealName,
      ingredient_tags: meal.ingredient_tags,
      meal_data: meal
    }));

    const { error } = await supabase
      .from('meal_library')
      .insert(batch);

    if (error) {
      console.error(`❌ Error seeding batch starting at ${i}:`, error.message);
      if (error.code === '42P01') {
        console.log("💡 TIP: You MUST create the 'meal_library' table in Supabase first using the SQL provided.");
        break;
      }
    } else {
      console.log(`✅ Seeded ${i + batch.length}/${total} meals...`);
    }
  }

  console.log("\n✨ LIBRARY SEEDING COMPLETE!");
}

seedLibrary();
