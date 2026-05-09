import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function calculateHash(meal) {
  const inputString = `${meal.ageGroup}-${meal.diet}-${[]}-${meal.goal}-${meal.mealType}`;
  return crypto.createHash('sha256').update(inputString).digest('hex');
}

async function seedData() {
  const filePath = path.join(process.cwd(), 'data', 'massive_meals.json');
  if (!fs.existsSync(filePath)) {
    console.error("❌ Massive meals file not found. Run the generator script first.");
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const allMeals = JSON.parse(rawData);
  const totalRaw = allMeals.length;

  console.log(`🔍 Deduplicating ${totalRaw} meals into category cache...`);
  
  const uniqueCache = new Map();
  for (const meal of allMeals) {
    const hash = calculateHash(meal);
    if (!uniqueCache.has(hash)) {
      uniqueCache.set(hash, meal);
    }
  }

  const meals = Array.from(uniqueCache.values());
  const total = meals.length;
  const BATCH_SIZE = 100;

  console.log(`🚀 Seeding ${total} unique category combinations into 'ai_meal_cache'...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = meals.slice(i, i + BATCH_SIZE).map(meal => ({
      input_hash: calculateHash(meal),
      meal_data: meal,
      age_group: meal.ageGroup,
      diet_type: meal.diet,
      meal_type: meal.mealType,
      goal: meal.goal,
      is_drink: false
    }));

    const { error } = await supabase
      .from('ai_meal_cache')
      .upsert(batch, { onConflict: 'input_hash' });

    if (error) {
      console.error(`❌ Error seeding batch starting at ${i}:`, error.message);
    } else {
      console.log(`✅ Seeded ${i + batch.length}/${total} categories...`);
    }
  }

  console.log("\n✨ CACHE WARMING COMPLETE!");
  console.log(`💡 Your app now has instant "AI" results for all ${total} possible user selection categories.`);
}

seedData();
