import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateAIMeal, generateAIWeeklyPlan } from "./gemini";
import { supabase } from "./supabase";
import { Alert } from "react-native";
const toast = { 
  success: (msg: string, opts?: any) => Alert.alert("Success", msg), 
  error: (msg: string, opts?: any) => Alert.alert("Error", msg),
  info: (msg: string, opts?: any) => Alert.alert("Info", msg)
};

export interface MealForm {
  childAge: string;
  diet: string;
  allergies: string[];
  goal: string;
  mealType: string;
  availableIngredients?: string[];
  cuisine?: string;
  onlyAvailable?: boolean;
  preferredMealName?: string; // hint for alternative meal selection
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  vitamins: string;
}

export interface GroceryList {
  vegetables: string[];
  dairy: string[];
  grains: string[];
  proteins: string[];
  others: string[];
}

export interface GroceryAvailability {
  [item: string]: boolean;
}

export interface MealIngredient {
  name: string;
  quantity: string;
}

export interface MealAlternative {
  mealName: string;
  reason: string;
}

export interface Meal {
  id: string;
  mealName: string;
  description: string;
  cookingTime: string;
  difficulty: string;
  ingredients: MealIngredient[];
  steps: string[];
  tips: string[];
  mealType: string;
  groceryList: GroceryList;
  nutrition: NutritionInfo;
  alternatives: MealAlternative[];
  costRank?: "Budget" | "Moderate" | "Premium";
  kidActivity?: string;
  insight?: string;
  savedAt?: string;
  childProfileName?: string;
  isAI?: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: string;
  gender?: 'boy' | 'girl';
  weight?: string;
  height?: string;
  diet: string;
  allergies: string[];
  goal: string;
}

export interface WeeklyPlan {
  id: string;
  childProfileId: string;
  days: DayPlan[];
  createdAt: string;
}

export interface GrowthLog {
  id: string;
  profile_id: string;
  weight: number;
  height: number;
  logged_at: string;
}

export interface DayPlan {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

export interface UserSubscription {
  tier: 'free' | 'pro';
  status: string;
  expires_at?: string;
}

export interface UserUsage {
  generation_count: number;
  last_generation_at?: string;
}

// Rate limits - MUST match server-side configuration in edge function
export const FREE_MEAL_LIMIT = 5;   // 5 meals per day for free users
export const PRO_MEAL_LIMIT = 1000; // 1000 meals per day for pro users (effectively unlimited)

const allMeals: Meal[] = [
  {
    id: "1", mealName: "Banana Oat Pancakes", description: "Fluffy, naturally sweet pancakes packed with fiber.", cookingTime: "15 min", difficulty: "Easy",
    ingredients: [
      { name: "ripe banana", quantity: "1" },
      { name: "rolled oats", quantity: "1/2 cup" },
      { name: "egg", quantity: "1" },
      { name: "milk", quantity: "1/4 cup" },
      { name: "cinnamon", quantity: "1/2 tsp" },
      { name: "honey", quantity: "1 tsp" }
    ],
    steps: ["Mash banana until smooth.", "Blend oats into flour or mix directly.", "Whisk in egg, milk, and cinnamon.", "Heat non-stick pan on medium-low with butter.", "Pour small circles, cook 2 min each side.", "Drizzle with honey and serve."],
    tips: ["Add blueberries for antioxidants.", "Freeze extras for busy mornings."],
    mealType: "breakfast",
    nutrition: { calories: 280, protein: 9, carbs: 42, fats: 8, vitamins: "B6, Potassium, Fiber" },
    groceryList: { vegetables: [], dairy: ["Milk", "Butter"], grains: ["Rolled oats"], proteins: ["Eggs"], others: ["Banana", "Cinnamon", "Honey"] },
    alternatives: [
      { mealName: "Berry Yogurt Bowl", reason: "Faster prep time" },
      { mealName: "Apple & Peanut Butter Bites", reason: "Higher protein" }
    ]
  },
  {
    id: "2", mealName: "Veggie Egg Muffins", description: "Protein-rich mini muffins with colorful vegetables.", cookingTime: "25 min", difficulty: "Easy",
    ingredients: [
      { name: "eggs", quantity: "4" },
      { name: "diced bell pepper", quantity: "1/4 cup" },
      { name: "spinach", quantity: "1/4 cup" },
      { name: "shredded cheese", quantity: "2 tbsp" },
      { name: "salt & pepper", quantity: "pinch" }
    ],
    steps: ["Preheat oven to 350°F.", "Whisk eggs and season.", "Stir in veggies and cheese.", "Pour into greased muffin tins.", "Bake 15-18 min until set.", "Cool slightly and serve."],
    tips: ["Makes 6 mini muffins — great for meal prep.", "Store in fridge up to 3 days."],
    mealType: "breakfast",
    nutrition: { calories: 220, protein: 16, carbs: 4, fats: 15, vitamins: "A, C, D, Iron" },
    groceryList: { vegetables: ["Bell pepper", "Spinach"], dairy: ["Cheese"], grains: [], proteins: ["Eggs"], others: ["Salt", "Pepper"] },
    alternatives: [
      { mealName: "Banana Oat Pancakes", reason: "More carbohydrates" },
      { mealName: "Berry Yogurt Bowl", reason: "Zero cooking time" }
    ]
  },
  {
    id: "3", mealName: "Berry Yogurt Bowl", description: "Creamy yogurt with fresh berries and granola.", cookingTime: "5 min", difficulty: "Easy",
    ingredients: [
      { name: "Greek yogurt", quantity: "1 cup" },
      { name: "mixed berries", quantity: "1/2 cup" },
      { name: "granola", quantity: "2 tbsp" },
      { name: "honey", quantity: "1 tsp" },
      { name: "chia seeds", quantity: "1 tbsp" }
    ],
    steps: ["Spoon yogurt into a bowl.", "Arrange berries on top.", "Sprinkle granola and chia seeds.", "Drizzle with honey.", "Serve immediately."],
    tips: ["Use frozen berries if fresh unavailable.", "Skip honey for babies under 1."],
    mealType: "breakfast",
    nutrition: { calories: 310, protein: 18, carbs: 38, fats: 10, vitamins: "C, Calcium, Probiotics" },
    groceryList: { vegetables: [], dairy: ["Greek yogurt"], grains: ["Granola"], proteins: [], others: ["Mixed berries", "Honey", "Chia seeds"] },
    alternatives: [
      { mealName: "Banana Oat Pancakes", reason: "Hearty meal" },
      { mealName: "Avocado Toast Fingers", reason: "Savory option" }
    ]
  },
  {
    id: "4", mealName: "Avocado Toast Fingers", description: "Creamy avocado on toast, perfect for little hands.", cookingTime: "5 min", difficulty: "Easy",
    ingredients: [
      { name: "whole wheat bread", quantity: "1 slice" },
      { name: "ripe avocado", quantity: "1/2" },
      { name: "lemon", quantity: "pinch" },
      { name: "salt", quantity: "pinch" }
    ],
    steps: ["Toast the bread lightly.", "Mash avocado with lemon and salt.", "Spread on toast.", "Cut into finger strips.", "Serve immediately."],
    tips: ["Add mashed egg on top for extra protein.", "Great first food for babies 6+ months."],
    mealType: "breakfast",
    nutrition: { calories: 240, protein: 5, carbs: 22, fats: 16, vitamins: "E, K, Folate, Fiber" },
    groceryList: { vegetables: [], dairy: [], grains: ["Whole wheat bread"], proteins: [], others: ["Avocado", "Lemon", "Salt"] },
    alternatives: [
      { mealName: "Berry Yogurt Bowl", reason: "Sweet option" },
      { mealName: "Veggie Egg Muffins", reason: "Higher protein" }
    ]
  },
  {
    id: "5", mealName: "Mini Chicken Wraps", description: "Soft tortilla wraps with chicken and fresh veggies.", cookingTime: "10 min", difficulty: "Easy",
    ingredients: [
      { name: "small tortillas", quantity: "2" },
      { name: "shredded chicken", quantity: "1/2 cup" },
      { name: "cucumber", quantity: "1/4 cup" },
      { name: "carrot", quantity: "1/4 cup" },
      { name: "cream cheese", quantity: "2 tbsp" },
      { name: "avocado", quantity: "1/4" }
    ],
    steps: ["Spread cream cheese on tortillas.", "Layer chicken evenly.", "Add cucumber, carrot, avocado.", "Roll tightly and cut into pinwheels.", "Serve on a plate."],
    tips: ["Use rotisserie chicken for quick prep.", "Pack in lunchbox with ice pack."],
    mealType: "lunch",
    nutrition: { calories: 350, protein: 22, carbs: 30, fats: 14, vitamins: "A, B12, Iron" },
    groceryList: { vegetables: ["Cucumber", "Carrot"], dairy: ["Cream cheese"], grains: ["Tortillas"], proteins: ["Chicken"], others: ["Avocado"] },
    alternatives: [
      { mealName: "Veggie Quesadilla", reason: "Warm meal" },
      { mealName: "Sweet Potato Mac & Cheese", reason: "Comfort food" }
    ]
  },
  {
    id: "6", mealName: "Sweet Potato Mac & Cheese", description: "Creamy, veggie-boosted mac and cheese.", cookingTime: "20 min", difficulty: "Easy",
    ingredients: [
      { name: "elbow pasta", quantity: "1 cup" },
      { name: "sweet potato (mashed)", quantity: "1/2 cup" },
      { name: "milk", quantity: "1/4 cup" },
      { name: "cheddar cheese", quantity: "1/2 cup" },
      { name: "butter", quantity: "1 tbsp" }
    ],
    steps: ["Cook pasta per package directions.", "Melt butter in saucepan.", "Stir in sweet potato and milk.", "Add cheese until smooth.", "Toss with pasta.", "Serve warm."],
    tips: ["Sneak in cauliflower puree for extra veggies.", "Use whole wheat pasta for fiber."],
    mealType: "lunch",
    nutrition: { calories: 420, protein: 15, carbs: 52, fats: 18, vitamins: "A, Calcium, B6" },
    groceryList: { vegetables: ["Sweet potato"], dairy: ["Milk", "Cheddar cheese", "Butter"], grains: ["Elbow pasta"], proteins: [], others: [] },
    alternatives: [
      { mealName: "Mini Chicken Wraps", reason: "Cold lunch option" },
      { mealName: "Tomato Soup & Grilled Cheese", reason: "Classic combo" }
    ]
  },
  {
    id: "7", mealName: "Veggie Quesadilla", description: "Crispy quesadilla loaded with melty cheese and veggies.", cookingTime: "10 min", difficulty: "Easy",
    ingredients: [
        { name: "large tortilla", quantity: "1" },
        { name: "shredded cheese", quantity: "1/4 cup" },
        { name: "diced bell pepper", quantity: "1/4 cup" },
        { name: "corn", quantity: "2 tbsp" },
        { name: "black beans", quantity: "2 tbsp" }
    ],
    steps: ["Place tortilla in a dry pan on medium.", "Sprinkle cheese on one half.", "Add veggies and beans on cheese.", "Fold tortilla in half.", "Cook 2 min each side until golden.", "Cut into wedges and serve."],
    tips: ["Add a side of guacamole for healthy fats.", "Great for picky eaters who love cheese."],
    mealType: "lunch",
    nutrition: { calories: 320, protein: 14, carbs: 36, fats: 13, vitamins: "C, Fiber, Iron" },
    groceryList: { vegetables: ["Bell pepper", "Corn"], dairy: ["Shredded cheese"], grains: ["Tortilla"], proteins: ["Black beans"], others: [] },
    alternatives: [
      { mealName: "Mini Chicken Wraps", reason: "Non-cooking option" },
      { mealName: "Sweet Potato Mac & Cheese", reason: "More filling" }
    ]
  },
  {
    id: "8", mealName: "Tomato Soup & Grilled Cheese Dippers", description: "Classic comfort food made nutritious.", cookingTime: "20 min", difficulty: "Easy",
    ingredients: [
        { name: "tomato soup", quantity: "1 can" },
        { name: "bread", quantity: "1 slice" },
        { name: "cheese", quantity: "1 slice" },
        { name: "butter", quantity: "1 tbsp" },
        { name: "basil", quantity: "pinch" }
    ],
    steps: ["Heat soup in a saucepan.", "Butter bread and place cheese inside.", "Grill sandwich until golden.", "Cut into strips for dipping.", "Serve soup in a mug with dippers."],
    tips: ["Use low-sodium soup for toddlers.", "Add hidden veggies to the soup with an immersion blender."],
    mealType: "lunch",
    nutrition: { calories: 290, protein: 10, carbs: 35, fats: 12, vitamins: "A, C, Lycopene" },
    groceryList: { vegetables: [], dairy: ["Cheese", "Butter"], grains: ["Bread"], proteins: [], others: ["Tomato soup", "Basil"] },
    alternatives: [
      { mealName: "Sweet Potato Mac & Cheese", reason: "Higher fiber" },
      { mealName: "Veggie Quesadilla", reason: "More protein" }
    ]
  },
  {
    id: "9", mealName: "Salmon & Broccoli Rice Bowl", description: "Omega-3 rich salmon with steamed broccoli.", cookingTime: "20 min", difficulty: "Medium",
    ingredients: [
        { name: "salmon fillet", quantity: "1" },
        { name: "broccoli", quantity: "1 cup" },
        { name: "rice", quantity: "1/2 cup" },
        { name: "soy sauce", quantity: "1 tbsp" },
        { name: "sesame oil", quantity: "1 tsp" },
        { name: "sesame seeds", quantity: "1 tsp" }
    ],
    steps: ["Steam broccoli 5 min.", "Bake salmon at 400°F for 12 min.", "Flake into bite-sized pieces.", "Arrange rice, broccoli, salmon in bowl.", "Drizzle soy sauce and sesame oil.", "Top with sesame seeds."],
    tips: ["Remove all bones for young children.", "Swap salmon for cod if preferred."],
    mealType: "dinner",
    nutrition: { calories: 440, protein: 30, carbs: 38, fats: 18, vitamins: "D, Omega-3, B12" },
    groceryList: { vegetables: ["Broccoli"], dairy: [], grains: ["Rice"], proteins: ["Salmon fillet"], others: ["Soy sauce", "Sesame oil", "Sesame seeds"] },
    alternatives: [
      { mealName: "Chicken Stir-Fry", reason: "Faster prep" },
      { mealName: "Turkey Meatball Pasta", reason: "Kid-favorite texture" }
    ]
  },
  {
    id: "10", mealName: "Turkey Meatball Pasta", description: "Tender turkey meatballs in simple tomato sauce.", cookingTime: "30 min", difficulty: "Medium",
    ingredients: [
        { name: "ground turkey", quantity: "200g" },
        { name: "breadcrumbs", quantity: "1/4 cup" },
        { name: "egg", quantity: "1" },
        { name: "pasta", quantity: "1 cup" },
        { name: "tomato sauce", quantity: "1/2 cup" },
        { name: "Italian herbs", quantity: "1 tsp" },
        { name: "parmesan", quantity: "1 tbsp" }
    ],
    steps: ["Mix turkey, breadcrumbs, egg, herbs.", "Roll into small meatballs.", "Bake at 375°F for 15 min.", "Cook pasta.", "Warm tomato sauce.", "Combine and top with parmesan."],
    tips: ["Make meatballs tiny for toddlers.", "Add grated zucchini to meat mix."],
    mealType: "dinner",
    nutrition: { calories: 480, protein: 28, carbs: 48, fats: 16, vitamins: "B6, Iron, Zinc" },
    groceryList: { vegetables: [], dairy: ["Parmesan"], grains: ["Pasta", "Breadcrumbs"], proteins: ["Ground turkey", "Eggs"], others: ["Tomato sauce", "Italian herbs"] },
    alternatives: [
      { mealName: "Chicken Stir-Fry", reason: "More vegetables" },
      { mealName: "Lentil & Veggie Soup", reason: "Plant-based version" }
    ]
  },
  {
    id: "11", mealName: "Chicken Stir-Fry", description: "Quick stir-fry with colorful vegetables and rice.", cookingTime: "15 min", difficulty: "Easy",
    ingredients: [
        { name: "diced chicken", quantity: "1/2 cup" },
        { name: "broccoli", quantity: "1/4 cup" },
        { name: "carrot", quantity: "1/4 cup" },
        { name: "snap peas", quantity: "1/4 cup" },
        { name: "soy sauce", quantity: "1 tbsp" },
        { name: "rice", quantity: "1/2 cup" }
    ],
    steps: ["Cook rice according to directions.", "Sauté chicken until cooked.", "Add vegetables and stir-fry 3 min.", "Add soy sauce and toss.", "Serve over rice."],
    tips: ["Cut veggies small for younger kids.", "Use tamari for gluten-free option."],
    mealType: "dinner",
    nutrition: { calories: 380, protein: 26, carbs: 42, fats: 10, vitamins: "A, C, B6, Iron" },
    groceryList: { vegetables: ["Broccoli", "Carrot", "Snap peas"], dairy: [], grains: ["Rice"], proteins: ["Chicken breast"], others: ["Soy sauce"] },
    alternatives: [
      { mealName: "Salmon & Broccoli Rice Bowl", reason: "More Omega-3s" },
      { mealName: "Turkey Meatball Pasta", reason: "Classic dinner" }
    ]
  },
  {
    id: "12", mealName: "Baked Fish Sticks", description: "Homemade crispy fish sticks, healthier than store-bought.", cookingTime: "25 min", difficulty: "Easy",
    ingredients: [
        { name: "white fish fillet", quantity: "1" },
        { name: "breadcrumbs", quantity: "1/4 cup" },
        { name: "flour", quantity: "1 tbsp" },
        { name: "egg", quantity: "1" },
        { name: "paprika", quantity: "pinch" }
    ],
    steps: ["Cut fish into strips.", "Set up breading station: flour, egg, breadcrumbs.", "Coat each strip.", "Place on lined baking sheet.", "Bake at 400°F for 15 min.", "Serve with lemon wedge."],
    tips: ["Serve with sweet potato fries.", "Great finger food for toddlers."],
    mealType: "dinner",
    nutrition: { calories: 260, protein: 22, carbs: 18, fats: 8, vitamins: "D, B12, Phosphorus" },
    groceryList: { vegetables: [], dairy: [], grains: ["Breadcrumbs", "Flour"], proteins: ["White fish fillet", "Eggs"], others: ["Paprika", "Lemon"] },
    alternatives: [
      { mealName: "Chicken Stir-Fry", reason: "More flavor variety" },
      { mealName: "Lentil & Veggie Soup", reason: "Lower fat" }
    ]
  },
  {
    id: "13", mealName: "Lentil & Veggie Soup", description: "Hearty, protein-packed soup for growing kids.", cookingTime: "30 min", difficulty: "Easy",
    ingredients: [
        { name: "red lentils", quantity: "1/2 cup" },
        { name: "carrot", quantity: "1/4 cup" },
        { name: "potato", quantity: "1/4 cup" },
        { name: "onion", quantity: "1/4" },
        { name: "broth", quantity: "1 cup" },
        { name: "cumin", quantity: "1 tsp" }
    ],
    steps: ["Sauté onion until soft.", "Add carrot, potato, lentils.", "Pour in broth and bring to boil.", "Simmer 20 min until tender.", "Blend if desired for younger kids.", "Season with cumin and serve."],
    tips: ["Freeze portions for easy weeknight dinners.", "Great source of iron and protein."],
    mealType: "dinner",
    nutrition: { calories: 320, protein: 18, carbs: 48, fats: 4, vitamins: "Iron, Folate, Fiber, B6" },
    groceryList: { vegetables: ["Carrot", "Potato", "Onion"], dairy: [], grains: ["Red lentils"], proteins: [], others: ["Broth", "Cumin"] },
    alternatives: [
      { mealName: "Baked Fish Sticks", reason: "Crunchier option" },
      { mealName: "Turkey Meatball Pasta", reason: "Favorite texture" }
    ]
  },
  {
    id: "14", mealName: "Apple & Peanut Butter Bites", description: "Crunchy apple slices with creamy peanut butter.", cookingTime: "5 min", difficulty: "Easy",
    ingredients: [
        { name: "apple", quantity: "1" },
        { name: "peanut butter", quantity: "2 tbsp" },
        { name: "granola", quantity: "1 tbsp" },
        { name: "cinnamon", quantity: "pinch" }
    ],
    steps: ["Slice apple into wedges.", "Spread peanut butter on each.", "Sprinkle with granola and cinnamon.", "Serve on a plate."],
    tips: ["Use sunflower butter for nut allergies.", "Great after-school snack."],
    mealType: "snack",
    nutrition: { calories: 250, protein: 7, carbs: 30, fats: 12, vitamins: "C, E, Fiber" },
    groceryList: { vegetables: [], dairy: [], grains: ["Granola"], proteins: ["Peanut butter"], others: ["Apple", "Cinnamon"] },
    alternatives: [
      { mealName: "Frozen Yogurt Bark", reason: "Cooler snack" },
      { mealName: "Hummus & Veggie Sticks", reason: "Savory option" }
    ]
  },
  {
    id: "15", mealName: "Frozen Yogurt Bark", description: "Fun frozen treat packed with fruit and calcium.", cookingTime: "5 min", difficulty: "Easy",
    ingredients: [
        { name: "Greek yogurt", quantity: "1 cup" },
        { name: "berries", quantity: "1/2 cup" },
        { name: "honey", quantity: "1 tbsp" },
        { name: "chocolate chips", quantity: "2 tbsp" }
    ],
    steps: ["Line baking sheet with parchment.", "Spread yogurt into thin layer.", "Press berries and chips into yogurt.", "Drizzle with honey.", "Freeze 2+ hours.", "Break into pieces and serve."],
    tips: ["Store in freezer bag up to 2 weeks.", "Perfect for teething toddlers."],
    mealType: "snack",
    nutrition: { calories: 270, protein: 14, carbs: 36, fats: 8, vitamins: "Calcium, Probiotics, C" },
    groceryList: { vegetables: [], dairy: ["Greek yogurt"], grains: [], proteins: [], others: ["Mixed berries", "Honey", "Chocolate chips"] },
    alternatives: [
      { mealName: "Apple & Peanut Butter Bites", reason: "Zero freeze time" },
      { mealName: "Hummus & Veggie Sticks", reason: "Higher fiber" }
    ]
  },
  {
    id: "16", mealName: "Hummus & Veggie Sticks", description: "Creamy hummus with colorful crunchy veggie sticks.", cookingTime: "5 min", difficulty: "Easy",
    ingredients: [
        { name: "hummus", quantity: "1/4 cup" },
        { name: "carrot", quantity: "1/2" },
        { name: "cucumber", quantity: "1/4" },
        { name: "cherry tomatoes", quantity: "3" },
        { name: "breadsticks", quantity: "2" }
    ],
    steps: ["Scoop hummus into a small bowl.", "Cut carrot and cucumber into sticks.", "Halve cherry tomatoes.", "Arrange veggies around hummus.", "Add breadsticks for dipping."],
    tips: ["Make hummus at home for less sodium.", "Kids love arranging their own plate."],
    mealType: "snack",
    nutrition: { calories: 180, protein: 6, carbs: 24, fats: 7, vitamins: "A, C, Fiber, Iron" },
    groceryList: { vegetables: ["Carrot", "Cucumber", "Cherry tomatoes"], dairy: [], grains: ["Breadsticks"], proteins: ["Hummus"], others: [] },
    alternatives: [
      { mealName: "Apple & Peanut Butter Bites", reason: "Sweet snack" },
      { mealName: "Frozen Yogurt Bark", reason: "Higher calcium" }
    ]
  },
];

function getMealsByType(type: string): Meal[] {
  return allMeals.filter(m => m.mealType === type.toLowerCase());
}

function pickRandom<T>(arr: T[], exclude: Set<string> = new Set(), getId: (item: T) => string = () => ""): T {
  const available = arr.filter(item => !exclude.has(getId(item)));
  const pool = available.length > 0 ? available : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getMockMeal(form: MealForm, excludeIds: string[] = []): Promise<Meal> {
  const meals = getMealsByType(form.mealType);
  const fallback = getMealsByType("breakfast");
  let pool = meals.length > 0 ? meals : fallback;
  
  if (excludeIds.length > 0) {
    const filtered = pool.filter(m => !excludeIds.includes(m.id));
    if (filtered.length > 0) pool = filtered;
  }
  
  const index = Math.floor(Math.random() * pool.length);
  const found = pool[index];
  
  return { 
    ...found, 
    id: Date.now().toString() 
  };
}

export async function generateMeal(form: MealForm, excludeIds: string[] = []): Promise<Meal> {
  try {
    const meal = await generateAIMeal(form);
    // Note: usage counting is handled server-side in the edge function
    return { ...meal, isAI: true };
  } catch (error: any) {
    console.warn("AI generation failed:", error.message);
    // Fall back to mock data for all errors including rate limit during dev
    console.warn("Falling back to mock meal data...");
    return { ...getMockMeal(form, excludeIds), isAI: false };
  }
}

export function generateAlternatives(form: MealForm, currentId: string): Meal[] {
  const meals = getMealsByType(form.mealType);
  const fallback = getMealsByType("breakfast");
  const pool = (meals.length > 0 ? meals : fallback).filter(m => m.id !== currentId);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2).map((m, i) => ({ ...m, id: `alt-${Date.now()}-${i}` }));
}

async function getMockWeeklyPlan(form: MealForm): Promise<DayPlan[]> {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const breakfasts = getMealsByType("breakfast");
  const lunches = getMealsByType("lunch");
  const dinners = getMealsByType("dinner");
  const usedB = new Set<string>();
  const usedL = new Set<string>();
  const usedD = new Set<string>();

  return days.map(day => {
    const b = pickRandom(breakfasts, usedB, m => m.id);
    usedB.add(b.id);
    const l = pickRandom(lunches, usedL, m => m.id);
    usedL.add(l.id);
    const d = pickRandom(dinners, usedD, m => m.id);
    usedD.add(d.id);
    return {
      day,
      breakfast: { ...b, id: `${day}-b-${Date.now()}` },
      lunch: { ...l, id: `${day}-l-${Date.now()}` },
      dinner: { ...d, id: `${day}-d-${Date.now()}` },
    };
  });
}

export async function generateWeeklyPlan(form: MealForm): Promise<DayPlan[]> {
  try {
    const plan = await generateAIWeeklyPlan(form);
    // Note: usage counting is handled server-side in the edge function
    return plan;
  } catch (error: any) {
    console.warn("AI weekly plan generation failed, falling back to mock data:", error.message);
    return getMockWeeklyPlan(form);
  }
}

export function combineGroceryLists(meals: Meal[]): GroceryList {
  const combined: GroceryList = { vegetables: [], dairy: [], grains: [], proteins: [], others: [] };
  meals.forEach(m => {
    (Object.keys(combined) as (keyof GroceryList)[]).forEach(cat => {
      m.groceryList[cat].forEach(item => {
        if (!combined[cat].includes(item)) combined[cat].push(item);
      });
    });
  });
  return combined;
}

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
}

export async function getUsageStats(): Promise<{ count: number; tier: string }> {
  try {
    const user_id = await getUserId();
    if (!user_id) return { count: 0, tier: 'free' };

    const { data: stats } = await supabase.from('usage_stats').select('generation_count').eq('user_id', user_id).single();
    const { data: sub } = await supabase.from('user_subscriptions').select('tier').eq('user_id', user_id).single();
    
    return { 
      count: stats?.generation_count || 0, 
      tier: sub?.tier || 'free' 
    };
  } catch {
    return { count: 0, tier: 'free' };
  }
}

async function incrementUsageCount() {
  // No-op: usage counting is handled server-side in the edge function only.
  // Do NOT call any RPC here — that would double-count against the rate limit.
}

export async function migrateLocalData() {
  const user_id = await getUserId();
  if (!user_id) return;

  const localProfiles = JSON.parse((await AsyncStorage.getItem("smartkids-profiles")) || "[]") as ChildProfile[];
  const localMeals = JSON.parse((await AsyncStorage.getItem("smartkids-saved-meals")) || "[]") as Meal[];

  // Migrate profiles
  for (const profile of localProfiles) {
    await saveChildProfile(profile);
  }

  // Migrate meals
  for (const meal of localMeals) {
    await saveMeal(meal);
  }

  // Clear local storage to prevent duplicate migrations
  await AsyncStorage.removeItem("smartkids-profiles");
  await AsyncStorage.removeItem("smartkids-saved-meals");
}

export async function getChildProfiles(): Promise<ChildProfile[]> {
  const localKey = "smartkids-profiles";
  let localProfiles: ChildProfile[] = [];
  try {
    const data = await AsyncStorage.getItem(localKey);
    localProfiles = data ? JSON.parse(data) : [];
  } catch (e) {}

  try {
    const user_id = await getUserId();
    if (!user_id) return localProfiles;

    // Fix: chain .eq() inline so filter is applied correctly
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id);

    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Supabase fetch profiles failed:", err);
  }

  return localProfiles;
}

// Helper for generating unique IDs even in non-secure contexts/older browsers
export function generateSafeId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) { /* Fallback */ }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function saveChildProfile(profile: ChildProfile): Promise<void> {
  // Save to Supabase (Cloud Sync)
  try {
    const user_id = await getUserId();
    if (user_id) {
      const { error } = await supabase.from('profiles').upsert({
        id: profile.id,
        user_id: user_id,
        name: profile.name,
        age: profile.age,
        diet: profile.diet,
        allergies: profile.allergies,
        goal: profile.goal,
        weight: profile.weight,
        height: profile.height
      });
      
      if (error) {
        console.warn("Supabase profile save error (Cloud):", error.message);
        // Only toast error if it's not a guest trying to save (which should be blocked above anyway)
        if (error.code !== '42501') {
           toast.error("Cloud Sync Failed", { description: "Your profile was saved locally instead." });
        }
      }
    }

    // Log initial growth entry if weight/height are provided
    if (profile.weight || profile.height) {
      const initialLog: GrowthLog = {
        id: generateSafeId(),
        profile_id: profile.id,
        weight: parseFloat(profile.weight || "0"),
        height: parseFloat(profile.height || "0"),
        logged_at: new Date().toISOString()
      };
      await saveGrowthLog(initialLog);
    }
  } catch (err) {
    console.error("Critical: Profile sync failed.", err);
  }

  // Fallback/Mirror to localStorage
  const profiles = await getChildProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile; else profiles.push(profile);
  await AsyncStorage.setItem("smartkids-profiles", JSON.stringify(profiles));
}

export async function removeChildProfile(id: string): Promise<void> {
  try {
    const user_id = await getUserId();
    if (user_id) {
       await supabase.from('profiles').delete().eq('id', id);
    }
  } catch (err) { console.error("Supabase profile delete failed:", err); }

  const profiles = (await getChildProfiles()).filter(p => p.id !== id);
  await AsyncStorage.setItem("smartkids-profiles", JSON.stringify(profiles));
}

// Saved meals
export async function getSavedMeals(): Promise<Meal[]> {
  const localKey = "smartkids-saved-meals";
  let localMeals: Meal[] = [];
  try {
    const data = await AsyncStorage.getItem(localKey);
    localMeals = data ? JSON.parse(data) : [];
  } catch (e) { console.error("Local fetch error:", e); }

  try {
    const user_id = await getUserId();
    if (!user_id) return localMeals;

    const { data, error } = await supabase
      .from('saved_meals')
      .select('*')
      .eq('user_id', user_id);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      const cloudMeals: Meal[] = data.map(m => ({
        id: m.id,
        mealName: m.meal_name,
        description: m.description,
        cookingTime: m.cooking_time,
        difficulty: m.difficulty,
        ingredients: m.ingredients,
        steps: Array.isArray(m.steps) ? m.steps : [],
        tips: Array.isArray(m.tips) ? m.tips : [],
        mealType: m.meal_type || 'breakfast',
        nutrition: m.nutrition || {},
        groceryList: m.grocery_list || { vegetables: [], dairy: [], grains: [], proteins: [], others: [] },
        alternatives: m.alternatives || [],
        childProfileName: m.child_profile_name,
        isAI: m.is_ai || false,
        savedAt: m.saved_at
      }));

      // Hydration: Merge cloud into local to ensure latest state is cached
      const merged = [...cloudMeals];
      localMeals.forEach(lm => {
        if (!merged.some(cm => cm.mealName === lm.mealName)) {
          merged.push(lm);
        }
      });
      await AsyncStorage.setItem(localKey, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn("Supabase fetch meals failed, using local:", err);
  }

  return localMeals;
}

export async function saveMeal(meal: Meal, profileName?: string): Promise<void> {
  const savedAt = new Date().toISOString();
  
  // 1. Cloud Save (Supabase)
  try {
    const user_id = await getUserId();
    if (user_id) {
      const { error } = await supabase.from('saved_meals').insert({
        user_id: user_id,
        meal_name: meal.mealName,
        description: meal.description,
        cooking_time: meal.cookingTime,
        difficulty: meal.difficulty,
        ingredients: meal.ingredients,
        steps: meal.steps,
        tips: meal.tips,
        meal_type: meal.mealType,
        nutrition: meal.nutrition,
        grocery_list: meal.groceryList,
        alternatives: meal.alternatives,
        child_profile_name: profileName || meal.childProfileName,
        is_ai: meal.isAI || false,
        saved_at: savedAt
      });
      if (error) console.warn("Supabase meal save failed, continuing locally:", error);
    }
  } catch (err) {
    console.error("Supabase meal save error:", err);
  }

  // 2. Local Save (Persistence/Offline)
  const localKey = "smartkids-saved-meals";
  const meals = JSON.parse((await AsyncStorage.getItem(localKey)) || "[]") as Meal[];
  const mealToSave = { 
    ...meal, 
    id: meal.id || generateSafeId(),
    savedAt: new Date().toLocaleDateString(), 
    childProfileName: profileName || meal.childProfileName 
  };
  
  if (!meals.some(m => m.mealName === meal.mealName)) {
    meals.unshift(mealToSave);
    await AsyncStorage.setItem(localKey, JSON.stringify(meals));
    toast.success("Meal saved to your collection! 📂");
  }
}

export async function removeSavedMeal(id: string): Promise<void> {
  try {
    await supabase.from('saved_meals').delete().eq('id', id);
  } catch (err) { console.error("Supabase meal delete failed:", err); }

  const meals = (await getSavedMeals()).filter(m => m.id !== id);
  await AsyncStorage.setItem("smartkids-saved-meals", JSON.stringify(meals));
}

// Notifications
export async function getNotificationSetting(): Promise<boolean> {
  return await AsyncStorage.getItem("smartkids-notifications") === "true";
}

export async function setNotificationSetting(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem("smartkids-notifications", JSON.stringify(enabled));
}

// Weekly Plan Persistence
export async function saveWeeklyPlan(plan: DayPlan[]): Promise<void> {
  // 1. Local Persistence (Session/Offline)
  await AsyncStorage.setItem("smartkids-weekly-plan", JSON.stringify(plan));

  // 2. Cloud Persistence — upsert (not insert) to prevent unbounded duplicate rows
  try {
    const user_id = await getUserId();
    if (user_id) {
      // Check if a plan already exists for this user
      const { data: existing } = await supabase
        .from('weekly_plans')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        await supabase.from('weekly_plans').update({ days: plan }).eq('id', existing.id);
      } else {
        await supabase.from('weekly_plans').insert({ user_id, days: plan });
      }
      toast.success("Saved to your account! ☁️");
    } else {
      toast.info("Saved locally! 📁", { description: "Sign in to sync your plans across devices." });
    }
  } catch (err: any) {
    console.error("Supabase weekly plan sync failed:", err);
    toast.error("Cloud Sync Delayed", { description: "We've saved it to your device for now." });
  }
}

export async function getSavedWeeklyPlan(): Promise<DayPlan[] | null> {
  const localKey = "smartkids-weekly-plan";
  let localPlan: DayPlan[] | null = null;
  try {
    const data = await AsyncStorage.getItem(localKey);
    localPlan = data ? JSON.parse(data) : null;
  } catch (e) { console.error("Local fetch error:", e); }

  try {
    const user_id = await getUserId();
    if (!user_id) return localPlan;

    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) {
       const cloudPlan = data.days as DayPlan[];
       // Sync to local for offline use
       await AsyncStorage.setItem(localKey, JSON.stringify(cloudPlan));
       return cloudPlan;
    }
  } catch (err) {
    console.warn("Supabase fetch weekly plan failed, using local:", err);
  }

  return localPlan;
}

export async function getSavedWeeklyPlans(): Promise<{id: string, days: DayPlan[], created_at: string}[]> {
  try {
    const user_id = await getUserId();
    if (!user_id) return [];

    const { data, error } = await supabase
      .from('weekly_plans')
      .select('id, days, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Supabase fetch weekly plans history failed:", err);
    return [];
  }
}

export async function removeWeeklyPlan(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('weekly_plans').delete().eq('id', id);
    if (error) throw error;
    toast.success("Plan removed");
  } catch (err) {
    console.error("Supabase weekly plan delete failed:", err);
    toast.error("Failed to remove plan");
  }
}

// Growth Tracking
export async function getGrowthLogs(profileId: string): Promise<GrowthLog[]> {
  try {
    const { data, error } = await supabase
      .from('growth_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('logged_at', { ascending: true });
    
    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Supabase fetch growth logs failed, falling back to local storage:", err);
  }

  try {
    const data = await AsyncStorage.getItem(`smartkids-growth-${profileId}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function saveGrowthLog(log: GrowthLog): Promise<void> {
  try {
    const user_id = await getUserId();
    if (user_id) {
      const { error } = await supabase.from('growth_logs').upsert({
        id: log.id,
        profile_id: log.profile_id,
        weight: log.weight,
        height: log.height,
        logged_at: log.logged_at
      });
      if (error) throw error;
    }
  } catch (err) {
    console.warn("Supabase growth log sync skipped or failed:", err);
  }

  // Fallback to localStorage
  const logs = await getGrowthLogs(log.profile_id);
  const idx = logs.findIndex(l => l.id === log.id);
  if (idx >= 0) logs[idx] = log; else logs.push(log);
  await AsyncStorage.setItem(`smartkids-growth-${log.profile_id}`, JSON.stringify(logs));
}
// Hydration Tracking
export interface WaterLog {
  id: string;
  profile_id: string;
  amount: number;
  logged_at: string;
}

export async function getWaterIntake(profileId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
      .from('water_logs')
      .select('amount')
      .eq('profile_id', profileId)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`);
    
    if (error) throw error;
    if (data && data.length > 0) {
      return data.reduce((acc, log) => acc + log.amount, 0);
    }
  } catch (err) {
    console.warn("Supabase fetch water logs failed:", err);
  }

  try {
    const key = `smartkids-water-${profileId}-${today}`;
    return parseInt(await AsyncStorage.getItem(key) || "0");
  } catch { return 0; }
}

export async function saveWaterIntake(profileId: string, amount: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const loggedAt = new Date().toISOString();

  try {
    const user_id = await getUserId();
    if (user_id) {
      const { error } = await supabase.from('water_logs').insert({
        id: generateSafeId(),
        profile_id: profileId,
        amount: amount,
        logged_at: loggedAt
      });
      if (error) throw error;
    }
  } catch (err) {
    console.warn("Supabase water log sync skipped or failed:", err);
  }

  // Fallback to localStorage
  const current = await getWaterIntake(profileId);
  const key = `smartkids-water-${profileId}-${today}`;
  await AsyncStorage.setItem(key, (current + amount).toString());
}

export async function resetWaterIntake(profileId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await supabase.from('water_logs')
      .delete()
      .eq('profile_id', profileId)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`);
  } catch (err) { console.error("Supabase water reset failed:", err); }

  await AsyncStorage.removeItem(`smartkids-water-${profileId}-${today}`);
}
// Liquid Nutrition Tracking
export interface Drink {
  id: string;
  drinkName: string;
  prepTime: string;
  ingredients: string[];
  steps: string[];
  calories: string;
  benefits: string[];
  category: string;
  costRank?: "Budget" | "Moderate" | "Premium";
  kidActivity?: string;
  insight?: string;
  isAI?: boolean;
}

export const predefinedDrinks: Drink[] = [
  // Milkshakes
  {
    id: "pre-shake-1", drinkName: "Classic Chocolate Power Shake", prepTime: "5 min",
    ingredients: ["1 cup full-fat milk", "2 tbsp unsweetened cocoa powder", "1 ripe banana", "1 tbsp peanut butter", "1 tsp honey"],
    steps: ["Peel and slice the banana.", "Add all ingredients into a blender.", "Blend on high until smooth and creamy.", "Pour into a glass and serve immediately."],
    calories: "350 kcal", benefits: ["High in protein", "Energy boosting", "Rich in calcium"],
    category: "Milkshake", costRank: "Budget",
    kidActivity: "Help peel the banana and drop it into the blender.",
    insight: "Cocoa provides antioxidants, while peanut butter offers healthy fats for brain development.",
    isAI: false
  },
  {
    id: "pre-shake-2", drinkName: "Creamy Vanilla Almond Shake", prepTime: "5 min",
    ingredients: ["1 cup milk", "1/2 tsp pure vanilla extract", "10 soaked almonds (peeled)", "1 tbsp maple syrup"],
    steps: ["Ensure almonds are soaked overnight and peeled.", "Blend almonds with a splash of milk to make a paste.", "Add the remaining milk, vanilla, and syrup.", "Blend until frothy."],
    calories: "280 kcal", benefits: ["Brain boosting", "Bone health", "Easy to digest"],
    category: "Milkshake", costRank: "Moderate",
    kidActivity: "Help peel the soaked almonds.",
    insight: "Almonds are fantastic for cognitive development in growing kids.",
    isAI: false
  },
  {
    id: "pre-shake-3", drinkName: "Pistachio Green Delight", prepTime: "10 min",
    ingredients: ["1 cup milk", "2 tbsp shelled pistachios", "1 cardamom pod (seeds only)", "1 tsp honey"],
    steps: ["Crush the pistachios slightly.", "Add milk, pistachios, cardamom, and honey to blender.", "Blend until smooth.", "Serve with a tiny pinch of crushed pistachios on top."],
    calories: "250 kcal", benefits: ["Rich in iron", "Vitamin B6", "Deliciously aromatic"],
    category: "Milkshake", costRank: "Premium",
    kidActivity: "Sprinkle the crushed pistachios on top of the finished shake.",
    insight: "Cardamom aids digestion and pistachios provide essential minerals.",
    isAI: false
  },
  {
    id: "pre-shake-4", drinkName: "Butterscotch Caramel Shake", prepTime: "5 min",
    ingredients: ["1 cup milk", "1 tbsp butterscotch syrup", "1/2 frozen banana", "1 pinch sea salt"],
    steps: ["Add milk and frozen banana to blender.", "Add the butterscotch syrup and salt.", "Blend until creamy.", "Serve cold."],
    calories: "300 kcal", benefits: ["Instant energy", "Mood booster", "Calcium rich"],
    category: "Milkshake", costRank: "Moderate",
    kidActivity: "Drizzle a tiny bit of extra syrup inside the glass before pouring.",
    insight: "A comforting treat that provides necessary calcium with a flavor kids love.",
    isAI: false
  },
  // Smoothies
  {
    id: "pre-smoothie-1", drinkName: "Berry Blast Smoothie", prepTime: "5 min",
    ingredients: ["1/2 cup mixed berries", "1/2 cup yogurt", "1/2 cup apple juice", "1 tsp chia seeds"],
    steps: ["Wash the berries thoroughly.", "Add berries, yogurt, and liquid to blender.", "Blend until smooth.", "Stir in chia seeds and serve."],
    calories: "180 kcal", benefits: ["Antioxidant powerhouse", "Immunity boosting", "Fiber rich"],
    category: "Smoothie", costRank: "Moderate",
    kidActivity: "Help wash the berries.",
    insight: "Berries are incredible for immune health, and yogurt provides probiotics for gut health.",
    isAI: false
  },
  {
    id: "pre-smoothie-2", drinkName: "Tropical Mango Smoothie", prepTime: "5 min",
    ingredients: ["1 cup chopped mango", "1/2 cup coconut milk", "1/2 banana"],
    steps: ["Add all ingredients to blender.", "Blend until perfectly smooth.", "Serve immediately."],
    calories: "220 kcal", benefits: ["Vitamin C", "Healthy fats", "Hydrating"],
    category: "Smoothie", costRank: "Budget",
    kidActivity: "Help drop the mango chunks into the blender.",
    insight: "Mango is packed with vitamins A and C, crucial for eye and immune health.",
    isAI: false
  },
  // Juices
  {
    id: "pre-juice-1", drinkName: "Fresh Orange & Carrot Juice", prepTime: "10 min",
    ingredients: ["2 sweet oranges", "1 medium carrot"],
    steps: ["Peel oranges and remove seeds.", "Wash, peel, and chop the carrot.", "Run both through a juicer.", "Stir and serve immediately."],
    calories: "120 kcal", benefits: ["Vision support", "Immunity", "Natural vitamin C"],
    category: "Juice", costRank: "Budget",
    kidActivity: "Help peel the oranges.",
    insight: "Carrots provide beta-carotene for healthy eyes, naturally sweetened by the oranges.",
    isAI: false
  },
  {
    id: "pre-juice-2", drinkName: "Hydrating Watermelon Splash", prepTime: "5 min",
    ingredients: ["2 cups diced watermelon", "1 tsp lime juice", "Mint leaves (optional)"],
    steps: ["Add watermelon to blender.", "Blend until liquid.", "Strain if desired, add lime juice, and serve."],
    calories: "90 kcal", benefits: ["Deep hydration", "Electrolytes", "Refreshing"],
    category: "Juice", costRank: "Budget",
    kidActivity: "Help squeeze the lime.",
    insight: "Watermelon is 92% water, making it the perfect hydrating juice for active kids.",
    isAI: false
  },
  // High-calorie
  {
    id: "pre-hc-1", drinkName: "Avocado Banana Weight-Gainer", prepTime: "5 min",
    ingredients: ["1/2 ripe avocado", "1 large banana", "1 cup whole milk", "1 tbsp honey", "1 tbsp chia seeds"],
    steps: ["Scoop avocado flesh into blender.", "Add banana, milk, and honey.", "Blend until smooth.", "Stir in chia seeds."],
    calories: "450 kcal", benefits: ["Healthy fats", "High calorie", "Brain development"],
    category: "High-calorie", costRank: "Premium",
    kidActivity: "Help scoop the avocado.",
    insight: "Avocados are rich in monounsaturated fats, perfect for healthy weight gain in growing children.",
    isAI: false
  }
];

export const getPredefinedDrinks = (category: string): Drink[] => {
  return predefinedDrinks.filter(d => d.category === category);
};

export async function generateDrink(type: string, age: string, goal: string): Promise<Drink> {
  const { generateAIDrink } = await import("./gemini");
  
  try {
    const drink = await generateAIDrink(type, age, goal);
    return {
      ...drink,
      id: Date.now().toString(),
      category: type,
      isAI: true
    };
  } catch (err) {
    console.warn("AI drink generation failed, using mock:", err);
    const categoryDrinks = getPredefinedDrinks(type);
    if (categoryDrinks.length > 0) {
      const randomDrink = categoryDrinks[Math.floor(Math.random() * categoryDrinks.length)];
      return { ...randomDrink, id: Date.now().toString() };
    }
    
    // Fallback if no predefined matches (shouldn't happen with our list)
    return {
      id: Date.now().toString(),
      drinkName: `Healthy ${type}`,
      prepTime: "5 min",
      ingredients: ["Fresh ingredients", "Love", "Care"],
      steps: ["Mix them all together", "Serve chilled"],
      calories: "150 kcal",
      benefits: ["Highly nutritious", "Great for development"],
      category: type,
      isAI: false
    };
  }
};

// --- SUBSCRIPTION & USAGE HELPERS ---

export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('tier, status, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      return { tier: 'free', status: 'active' }; // Fallback
    }
    return data;
  } catch (e) {
    return { tier: 'free', status: 'active' };
  }
};

export const getUserUsage = async (userId: string): Promise<UserUsage | null> => {
  try {
    const { data, error } = await supabase
      .from('usage_stats')
      .select('generation_count, last_generation_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching usage stats:", error);
      return { generation_count: 0 };
    }
    return data;
  } catch (e) {
    return { generation_count: 0 };
  }
};

export const incrementUsage = async (_userId: string): Promise<void> => {
  // No-op: usage counting is handled server-side in the edge function only.
  // Calling increment_generation_count here would double-count against the rate limit.
};
export const clearAllLocalData = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const keysToRemove = keys.filter(k => k.startsWith('smartkids-'));
  await AsyncStorage.multiRemove(keysToRemove);
};
