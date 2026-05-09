import fs from 'fs';
import path from 'path';

/**
 * MASSIVE MEAL GENERATOR
 * Generates 100,000+ unique, realistic meal plans for kids.
 */

const AGE_GROUPS = ["6-12 months", "1-2 years", "3-5 years", "6-10 years", "11+ years"];
const DIETS = ["regular", "vegetarian", "vegan"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const GOALS = ["balanced", "weight gain", "brain boost"];

// Ingredient Pools
const PROTEINS = {
  regular: ["Chicken breast", "Turkey mince", "Salmon fillet", "Cod", "Lean beef", "Eggs", "Greek yogurt", "Tuna", "Shrimp", "Pork tenderloin"],
  vegetarian: ["Tofu", "Tempeh", "Lentils", "Chickpeas", "Black beans", "Quinoa", "Eggs", "Cottage cheese", "Paneer", "Edamame"],
  vegan: ["Tofu", "Tempeh", "Red lentils", "Green lentils", "Chickpeas", "Kidney beans", "Seitan", "Nutritional yeast", "Hemp seeds", "Chia seeds"]
};

const GRAINS = ["Brown rice", "Quinoa", "Whole wheat pasta", "Rolled oats", "Sweet potato", "Buckwheat", "Millet", "Couscous", "Polenta", "Whole grain bread"];
const VEGGIES = ["Broccoli", "Spinach", "Carrots", "Peas", "Zucchini", "Cauliflower", "Bell peppers", "Sweet corn", "Kale", "Green beans"];
const FRUITS = ["Banana", "Apple", "Blueberries", "Strawberries", "Mango", "Pear", "Avocado", "Raspberries", "Peach", "Kiwi"];
const FATS = {
  regular: ["Olive oil", "Butter", "Avocado oil", "Coconut oil", "Ghee"],
  vegan: ["Olive oil", "Avocado oil", "Coconut oil", "Flaxseed oil", "Tahini"]
};

// Culinary Combinations
const METHODS = ["Steam", "Bake", "Sauté", "Mash", "Roast", "Grill", "Slow cook", "Simmer"];
const FLAVORS = ["Mild", "Savory", "Sweet", "Creamy", "Zesty", "Herby", "Nutty", "Tangy"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUniqueMeal(id, age, diet, type, goal) {
  const method = getRandom(METHODS);
  const flavor = getRandom(FLAVORS);
  const protein = getRandom(PROTEINS[diet] || PROTEINS.regular);
  const grain = getRandom(GRAINS);
  const veggie = getRandom(VEGGIES);
  const fruit = getRandom(FRUITS);
  const fat = getRandom(diet === 'vegan' ? FATS.vegan : FATS.regular);

  const normalizeTag = (s) =>
    String(s || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      // strip common cut/descriptor words so user tags like "chicken" match "chicken breast"
      .replace(/\b(breast|fillet|mince|tenderloin|ground|lean|diced|shredded)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Dynamic Name Generation
  const nameParts = [flavor, method, protein, "with", veggie, "&", grain];
  if (type === 'snack') nameParts[2] = fruit;
  const mealName = nameParts.join(" ").replace(/&/g, "and");

  // Quantity variation based on age
  let qtyFactor = 1;
  if (age === "6-12 months") qtyFactor = 0.5;
  if (age === "11+ years") qtyFactor = 1.5;

  const ingredients = [
    `${(100 * qtyFactor).toFixed(0)}g ${protein}`,
    `${(50 * qtyFactor).toFixed(0)}g ${grain}`,
    `${(30 * qtyFactor).toFixed(0)}g ${veggie}`,
    `1 tsp ${fat}`
  ];

  // Clean tags used for library searching (lowercased canonical-ish tokens)
  const ingredient_tags = Array.from(new Set([protein, grain, veggie, fat].map(normalizeTag).filter(Boolean)));

  const steps = [
    `Prepare the ${protein} by ${method.toLowerCase()}ing until fully cooked.`,
    `Cook the ${grain} separately according to package instructions.`,
    `Gently ${method.toLowerCase()} the ${veggie} until tender.`,
    `Combine all ingredients in a kid-friendly bowl.`,
    `Drizzle with ${fat} and let cool before serving.`
  ];

  // Logic for 6-12 months (pureed or soft)
  if (age === "6-12 months") {
    steps[3] = "Mash or blend into a smooth puree/soft texture.";
  }

  // Nutrition simulation
  const baseCals = (type === 'snack' ? 150 : 350) * qtyFactor;
  const goalModifier = goal === 'weight gain' ? 1.3 : 1.0;
  const calories = (baseCals * goalModifier).toFixed(0);

  return {
    id,
    ageGroup: age,
    diet,
    mealType: type,
    goal,
    mealName,
    ingredients,
    ingredient_tags,
    steps,
    calories,
    nutrition: {
      protein: (15 * qtyFactor).toFixed(1) + "g",
      carbs: (40 * qtyFactor).toFixed(1) + "g",
      fat: (10 * qtyFactor * goalModifier).toFixed(1) + "g"
    }
  };
}

async function runGenerator() {
  const count = 100000;
  const outputDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  
  const filePath = path.join(outputDir, 'massive_meals.json');
  console.log(`🚀 Starting generation of ${count} meals...`);
  
  const stream = fs.createWriteStream(filePath);
  stream.write('[\n');

  for (let i = 0; i < count; i++) {
    const age = getRandom(AGE_GROUPS);
    const diet = getRandom(DIETS);
    const type = getRandom(MEAL_TYPES);
    const goal = getRandom(GOALS);

    const meal = generateUniqueMeal(i + 1, age, diet, type, goal);
    
    // Write in chunks to save memory
    const comma = i === count - 1 ? '' : ',';
    stream.write(JSON.stringify(meal, null, 2) + comma + '\n');

    if (i % 10000 === 0 && i > 0) {
      console.log(`✅ Generated ${i} meals...`);
    }
  }

  stream.write(']');
  stream.end();

  stream.on('finish', () => {
    console.log(`\n✨ DONE! Generated ${count} meals.`);
    console.log(`📁 File saved to: ${filePath}`);
    console.log(`📊 Approximate file size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
  });
}

runGenerator();
