export interface MealForm {
  childAge: string;
  diet: string;
  allergies: string;
  goal: string;
  mealType: string;
}

export interface GroceryList {
  vegetables: string[];
  dairy: string[];
  grains: string[];
  proteins: string[];
  others: string[];
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  cookingTime: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
  mealType: string;
  groceryList: GroceryList;
  savedAt?: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: string;
  diet: string;
  allergies: string;
  goal: string;
}

export interface WeeklyPlan {
  id: string;
  childProfileId: string;
  days: DayPlan[];
  createdAt: string;
}

export interface DayPlan {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

const allMeals: Meal[] = [
  {
    id: "1", name: "Banana Oat Pancakes", description: "Fluffy, naturally sweet pancakes packed with fiber.", cookingTime: "15 min",
    ingredients: ["1 ripe banana", "1/2 cup rolled oats", "1 egg", "1/4 cup milk", "1/2 tsp cinnamon", "1 tsp honey"],
    steps: ["Mash banana until smooth.", "Blend oats into flour or mix directly.", "Whisk in egg, milk, and cinnamon.", "Heat non-stick pan on medium-low with butter.", "Pour small circles, cook 2 min each side.", "Drizzle with honey and serve."],
    tips: ["Add blueberries for antioxidants.", "Freeze extras for busy mornings."],
    mealType: "breakfast",
    groceryList: { vegetables: [], dairy: ["Milk", "Butter"], grains: ["Rolled oats"], proteins: ["Eggs"], others: ["Banana", "Cinnamon", "Honey"] }
  },
  {
    id: "2", name: "Veggie Egg Muffins", description: "Protein-rich mini muffins with colorful vegetables.", cookingTime: "25 min",
    ingredients: ["4 eggs", "1/4 cup diced bell pepper", "1/4 cup spinach", "2 tbsp shredded cheese", "Salt & pepper"],
    steps: ["Preheat oven to 350°F.", "Whisk eggs and season.", "Stir in veggies and cheese.", "Pour into greased muffin tins.", "Bake 15-18 min until set.", "Cool slightly and serve."],
    tips: ["Makes 6 mini muffins — great for meal prep.", "Store in fridge up to 3 days."],
    mealType: "breakfast",
    groceryList: { vegetables: ["Bell pepper", "Spinach"], dairy: ["Cheese"], grains: [], proteins: ["Eggs"], others: ["Salt", "Pepper"] }
  },
  {
    id: "3", name: "Berry Yogurt Bowl", description: "Creamy yogurt with fresh berries and granola.", cookingTime: "5 min",
    ingredients: ["1 cup Greek yogurt", "1/2 cup mixed berries", "2 tbsp granola", "1 tsp honey", "1 tbsp chia seeds"],
    steps: ["Spoon yogurt into a bowl.", "Arrange berries on top.", "Sprinkle granola and chia seeds.", "Drizzle with honey.", "Serve immediately."],
    tips: ["Use frozen berries if fresh unavailable.", "Skip honey for babies under 1."],
    mealType: "breakfast",
    groceryList: { vegetables: [], dairy: ["Greek yogurt"], grains: ["Granola"], proteins: [], others: ["Mixed berries", "Honey", "Chia seeds"] }
  },
  {
    id: "4", name: "Avocado Toast Fingers", description: "Creamy avocado on toast, perfect for little hands.", cookingTime: "5 min",
    ingredients: ["1 slice whole wheat bread", "1/2 ripe avocado", "Squeeze of lemon", "Pinch of salt"],
    steps: ["Toast the bread lightly.", "Mash avocado with lemon and salt.", "Spread on toast.", "Cut into finger strips.", "Serve immediately."],
    tips: ["Add mashed egg on top for extra protein.", "Great first food for babies 6+ months."],
    mealType: "breakfast",
    groceryList: { vegetables: [], dairy: [], grains: ["Whole wheat bread"], proteins: [], others: ["Avocado", "Lemon", "Salt"] }
  },
  {
    id: "5", name: "Mini Chicken Wraps", description: "Soft tortilla wraps with chicken and fresh veggies.", cookingTime: "10 min",
    ingredients: ["2 small tortillas", "1/2 cup shredded chicken", "1/4 cup cucumber", "1/4 cup carrot", "2 tbsp cream cheese", "1/4 avocado"],
    steps: ["Spread cream cheese on tortillas.", "Layer chicken evenly.", "Add cucumber, carrot, avocado.", "Roll tightly and cut into pinwheels.", "Serve on a plate."],
    tips: ["Use rotisserie chicken for quick prep.", "Pack in lunchbox with ice pack."],
    mealType: "lunch",
    groceryList: { vegetables: ["Cucumber", "Carrot"], dairy: ["Cream cheese"], grains: ["Tortillas"], proteins: ["Chicken"], others: ["Avocado"] }
  },
  {
    id: "6", name: "Sweet Potato Mac & Cheese", description: "Creamy, veggie-boosted mac and cheese.", cookingTime: "20 min",
    ingredients: ["1 cup elbow pasta", "1/2 cup sweet potato (mashed)", "1/4 cup milk", "1/2 cup cheddar cheese", "1 tbsp butter"],
    steps: ["Cook pasta per package directions.", "Melt butter in saucepan.", "Stir in sweet potato and milk.", "Add cheese until smooth.", "Toss with pasta.", "Serve warm."],
    tips: ["Sneak in cauliflower puree for extra veggies.", "Use whole wheat pasta for fiber."],
    mealType: "lunch",
    groceryList: { vegetables: ["Sweet potato"], dairy: ["Milk", "Cheddar cheese", "Butter"], grains: ["Elbow pasta"], proteins: [], others: [] }
  },
  {
    id: "7", name: "Veggie Quesadilla", description: "Crispy quesadilla loaded with melty cheese and veggies.", cookingTime: "10 min",
    ingredients: ["1 large tortilla", "1/4 cup shredded cheese", "1/4 cup diced bell pepper", "2 tbsp corn", "2 tbsp black beans"],
    steps: ["Place tortilla in a dry pan on medium.", "Sprinkle cheese on one half.", "Add veggies and beans on cheese.", "Fold tortilla in half.", "Cook 2 min each side until golden.", "Cut into wedges and serve."],
    tips: ["Add a side of guacamole for healthy fats.", "Great for picky eaters who love cheese."],
    mealType: "lunch",
    groceryList: { vegetables: ["Bell pepper", "Corn"], dairy: ["Shredded cheese"], grains: ["Tortilla"], proteins: ["Black beans"], others: [] }
  },
  {
    id: "8", name: "Tomato Soup & Grilled Cheese Dippers", description: "Classic comfort food made nutritious.", cookingTime: "20 min",
    ingredients: ["1 can tomato soup", "1 slice bread", "1 slice cheese", "1 tbsp butter", "Pinch of basil"],
    steps: ["Heat soup in a saucepan.", "Butter bread and place cheese inside.", "Grill sandwich until golden.", "Cut into strips for dipping.", "Serve soup in a mug with dippers."],
    tips: ["Use low-sodium soup for toddlers.", "Add hidden veggies to the soup with an immersion blender."],
    mealType: "lunch",
    groceryList: { vegetables: [], dairy: ["Cheese", "Butter"], grains: ["Bread"], proteins: [], others: ["Tomato soup", "Basil"] }
  },
  {
    id: "9", name: "Salmon & Broccoli Rice Bowl", description: "Omega-3 rich salmon with steamed broccoli.", cookingTime: "20 min",
    ingredients: ["1 salmon fillet", "1 cup broccoli", "1/2 cup rice", "1 tbsp soy sauce", "1 tsp sesame oil", "Sesame seeds"],
    steps: ["Steam broccoli 5 min.", "Bake salmon at 400°F for 12 min.", "Flake into bite-sized pieces.", "Arrange rice, broccoli, salmon in bowl.", "Drizzle soy sauce and sesame oil.", "Top with sesame seeds."],
    tips: ["Remove all bones for young children.", "Swap salmon for cod if preferred."],
    mealType: "dinner",
    groceryList: { vegetables: ["Broccoli"], dairy: [], grains: ["Rice"], proteins: ["Salmon fillet"], others: ["Soy sauce", "Sesame oil", "Sesame seeds"] }
  },
  {
    id: "10", name: "Turkey Meatball Pasta", description: "Tender turkey meatballs in simple tomato sauce.", cookingTime: "30 min",
    ingredients: ["200g ground turkey", "1/4 cup breadcrumbs", "1 egg", "1 cup pasta", "1/2 cup tomato sauce", "Italian herbs", "Parmesan"],
    steps: ["Mix turkey, breadcrumbs, egg, herbs.", "Roll into small meatballs.", "Bake at 375°F for 15 min.", "Cook pasta.", "Warm tomato sauce.", "Combine and top with parmesan."],
    tips: ["Make meatballs tiny for toddlers.", "Add grated zucchini to meat mix."],
    mealType: "dinner",
    groceryList: { vegetables: [], dairy: ["Parmesan"], grains: ["Pasta", "Breadcrumbs"], proteins: ["Ground turkey", "Eggs"], others: ["Tomato sauce", "Italian herbs"] }
  },
  {
    id: "11", name: "Chicken Stir-Fry", description: "Quick stir-fry with colorful vegetables and rice.", cookingTime: "15 min",
    ingredients: ["1/2 cup diced chicken", "1/4 cup broccoli", "1/4 cup carrot", "1/4 cup snap peas", "1 tbsp soy sauce", "1/2 cup rice"],
    steps: ["Cook rice according to directions.", "Sauté chicken until cooked.", "Add vegetables and stir-fry 3 min.", "Add soy sauce and toss.", "Serve over rice."],
    tips: ["Cut veggies small for younger kids.", "Use tamari for gluten-free option."],
    mealType: "dinner",
    groceryList: { vegetables: ["Broccoli", "Carrot", "Snap peas"], dairy: [], grains: ["Rice"], proteins: ["Chicken breast"], others: ["Soy sauce"] }
  },
  {
    id: "12", name: "Baked Fish Sticks", description: "Homemade crispy fish sticks, healthier than store-bought.", cookingTime: "25 min",
    ingredients: ["1 white fish fillet", "1/4 cup breadcrumbs", "1 tbsp flour", "1 egg", "Pinch of paprika"],
    steps: ["Cut fish into strips.", "Set up breading station: flour, egg, breadcrumbs.", "Coat each strip.", "Place on lined baking sheet.", "Bake at 400°F for 15 min.", "Serve with lemon wedge."],
    tips: ["Serve with sweet potato fries.", "Great finger food for toddlers."],
    mealType: "dinner",
    groceryList: { vegetables: [], dairy: [], grains: ["Breadcrumbs", "Flour"], proteins: ["White fish fillet", "Eggs"], others: ["Paprika", "Lemon"] }
  },
  {
    id: "13", name: "Lentil & Veggie Soup", description: "Hearty, protein-packed soup for growing kids.", cookingTime: "30 min",
    ingredients: ["1/2 cup red lentils", "1/4 cup carrot", "1/4 cup potato", "1/4 onion", "1 cup broth", "1 tsp cumin"],
    steps: ["Sauté onion until soft.", "Add carrot, potato, lentils.", "Pour in broth and bring to boil.", "Simmer 20 min until tender.", "Blend if desired for younger kids.", "Season with cumin and serve."],
    tips: ["Freeze portions for easy weeknight dinners.", "Great source of iron and protein."],
    mealType: "dinner",
    groceryList: { vegetables: ["Carrot", "Potato", "Onion"], dairy: [], grains: ["Red lentils"], proteins: [], others: ["Broth", "Cumin"] }
  },
  {
    id: "14", name: "Apple & Peanut Butter Bites", description: "Crunchy apple slices with creamy peanut butter.", cookingTime: "5 min",
    ingredients: ["1 apple", "2 tbsp peanut butter", "1 tbsp granola", "Pinch of cinnamon"],
    steps: ["Slice apple into wedges.", "Spread peanut butter on each.", "Sprinkle with granola and cinnamon.", "Serve on a plate."],
    tips: ["Use sunflower butter for nut allergies.", "Great after-school snack."],
    mealType: "snack",
    groceryList: { vegetables: [], dairy: [], grains: ["Granola"], proteins: ["Peanut butter"], others: ["Apple", "Cinnamon"] }
  },
  {
    id: "15", name: "Frozen Yogurt Bark", description: "Fun frozen treat packed with fruit and calcium.", cookingTime: "5 min + freeze",
    ingredients: ["1 cup Greek yogurt", "1/2 cup berries", "1 tbsp honey", "2 tbsp chocolate chips"],
    steps: ["Line baking sheet with parchment.", "Spread yogurt into thin layer.", "Press berries and chips into yogurt.", "Drizzle with honey.", "Freeze 2+ hours.", "Break into pieces and serve."],
    tips: ["Store in freezer bag up to 2 weeks.", "Perfect for teething toddlers."],
    mealType: "snack",
    groceryList: { vegetables: [], dairy: ["Greek yogurt"], grains: [], proteins: [], others: ["Mixed berries", "Honey", "Chocolate chips"] }
  },
  {
    id: "16", name: "Hummus & Veggie Sticks", description: "Creamy hummus with colorful crunchy veggie sticks.", cookingTime: "5 min",
    ingredients: ["1/4 cup hummus", "1/2 carrot", "1/4 cucumber", "3 cherry tomatoes", "2 breadsticks"],
    steps: ["Scoop hummus into a small bowl.", "Cut carrot and cucumber into sticks.", "Halve cherry tomatoes.", "Arrange veggies around hummus.", "Add breadsticks for dipping."],
    tips: ["Make hummus at home for less sodium.", "Kids love arranging their own plate."],
    mealType: "snack",
    groceryList: { vegetables: ["Carrot", "Cucumber", "Cherry tomatoes"], dairy: [], grains: ["Breadsticks"], proteins: ["Hummus"], others: [] }
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

export function generateMeal(form: MealForm): Meal {
  const meals = getMealsByType(form.mealType);
  const fallback = getMealsByType("breakfast");
  const pool = meals.length > 0 ? meals : fallback;
  const index = Math.floor(Math.random() * pool.length);
  return { ...pool[index], id: Date.now().toString() };
}

export function generateWeeklyPlan(form: MealForm): DayPlan[] {
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

// Child profiles
export function getChildProfiles(): ChildProfile[] {
  try {
    const data = localStorage.getItem("smartkids-profiles");
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveChildProfile(profile: ChildProfile): void {
  const profiles = getChildProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile; else profiles.push(profile);
  localStorage.setItem("smartkids-profiles", JSON.stringify(profiles));
}

export function removeChildProfile(id: string): void {
  const profiles = getChildProfiles().filter(p => p.id !== id);
  localStorage.setItem("smartkids-profiles", JSON.stringify(profiles));
}

// Saved meals
export function getSavedMeals(): Meal[] {
  try {
    const saved = localStorage.getItem("smartkids-saved-meals");
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export function saveMeal(meal: Meal): void {
  const meals = getSavedMeals();
  const exists = meals.some(m => m.name === meal.name && m.savedAt === meal.savedAt);
  if (!exists) {
    meals.unshift({ ...meal, savedAt: new Date().toLocaleDateString() });
    localStorage.setItem("smartkids-saved-meals", JSON.stringify(meals));
  }
}

export function removeSavedMeal(id: string): void {
  const meals = getSavedMeals().filter(m => m.id !== id);
  localStorage.setItem("smartkids-saved-meals", JSON.stringify(meals));
}

// Notifications
export function getNotificationSetting(): boolean {
  return localStorage.getItem("smartkids-notifications") === "true";
}

export function setNotificationSetting(enabled: boolean): void {
  localStorage.setItem("smartkids-notifications", enabled ? "true" : "false");
}
