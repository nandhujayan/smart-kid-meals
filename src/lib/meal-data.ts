export interface MealForm {
  childAge: string;
  diet: string;
  allergies: string;
  goal: string;
  mealType: string;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
  mealType: string;
  savedAt?: string;
}

const mealDatabase: Record<string, Meal[]> = {
  breakfast: [
    {
      id: "1", name: "Banana Oat Pancakes", description: "Fluffy, naturally sweet pancakes packed with fiber and potassium.",
      ingredients: ["1 ripe banana", "1/2 cup rolled oats", "1 egg", "1/4 cup milk", "1/2 tsp cinnamon", "1 tsp honey"],
      steps: ["Mash the banana in a bowl until smooth.", "Blend oats into a flour or mix in directly for texture.", "Whisk in egg, milk, and cinnamon until combined.", "Heat a non-stick pan on medium-low with a tiny bit of butter.", "Pour small circles of batter, cook 2 min each side until golden.", "Drizzle with honey and serve warm."],
      tips: ["Add blueberries for extra antioxidants.", "Make extra and freeze for busy mornings.", "Use breast milk or formula for babies under 1."], mealType: "breakfast"
    },
    {
      id: "2", name: "Veggie Egg Muffins", description: "Protein-rich mini muffins loaded with colorful vegetables.",
      ingredients: ["4 eggs", "1/4 cup diced bell pepper", "1/4 cup spinach (chopped)", "2 tbsp shredded cheese", "Salt & pepper to taste"],
      steps: ["Preheat oven to 350°F (175°C).", "Whisk eggs in a bowl and season lightly.", "Stir in chopped veggies and cheese.", "Pour mixture into greased muffin tins.", "Bake for 15-18 minutes until set.", "Let cool slightly before serving."],
      tips: ["Great for meal prep — makes 6 mini muffins.", "Try adding sweet potato for extra nutrients.", "Store in fridge for up to 3 days."], mealType: "breakfast"
    },
    {
      id: "3", name: "Berry Yogurt Bowl", description: "Creamy yogurt with fresh berries and crunchy granola.",
      ingredients: ["1 cup plain Greek yogurt", "1/2 cup mixed berries", "2 tbsp granola", "1 tsp honey", "1 tbsp chia seeds"],
      steps: ["Spoon yogurt into a bowl.", "Wash and arrange berries on top.", "Sprinkle granola and chia seeds.", "Drizzle with honey.", "Serve immediately for best crunch."],
      tips: ["Use frozen berries if fresh aren't available.", "Skip honey for babies under 1 year.", "Add mashed banana for younger toddlers."], mealType: "breakfast"
    },
  ],
  lunch: [
    {
      id: "4", name: "Mini Chicken & Veggie Wraps", description: "Soft tortilla wraps with tender chicken and fresh veggies.",
      ingredients: ["2 small flour tortillas", "1/2 cup shredded chicken", "1/4 cup cucumber (diced)", "1/4 cup carrot (shredded)", "2 tbsp cream cheese", "1/4 avocado"],
      steps: ["Spread cream cheese on each tortilla.", "Layer shredded chicken evenly.", "Add cucumber, carrot, and sliced avocado.", "Roll tightly and cut into pinwheels.", "Arrange on a plate and serve."],
      tips: ["Use rotisserie chicken for quick prep.", "Swap tortillas for lettuce wraps if gluten-free.", "Pack in lunchbox with an ice pack."], mealType: "lunch"
    },
    {
      id: "5", name: "Sweet Potato Mac & Cheese", description: "Creamy, veggie-boosted mac and cheese kids adore.",
      ingredients: ["1 cup elbow pasta", "1/2 cup sweet potato (cooked & mashed)", "1/4 cup milk", "1/2 cup cheddar cheese", "1 tbsp butter", "Pinch of nutmeg"],
      steps: ["Cook pasta according to package directions.", "In a saucepan, melt butter over low heat.", "Stir in mashed sweet potato and milk.", "Add cheese and stir until melted and smooth.", "Toss with drained pasta.", "Serve warm in a fun bowl."],
      tips: ["Sneak in pureed cauliflower for extra veggies.", "Use whole wheat pasta for more fiber.", "Freezes well in portions."], mealType: "lunch"
    },
  ],
  dinner: [
    {
      id: "6", name: "Salmon & Broccoli Rice Bowl", description: "Omega-3 rich salmon with steamed broccoli over fluffy rice.",
      ingredients: ["1 small salmon fillet", "1 cup broccoli florets", "1/2 cup cooked rice", "1 tbsp soy sauce (low sodium)", "1 tsp sesame oil", "1 tsp sesame seeds"],
      steps: ["Steam broccoli florets until tender (5 min).", "Season salmon lightly and bake at 400°F for 12 min.", "Flake salmon into bite-sized pieces.", "Arrange rice in a bowl, top with broccoli and salmon.", "Drizzle with soy sauce and sesame oil.", "Sprinkle sesame seeds and serve."],
      tips: ["Remove all bones carefully for young children.", "Use brown rice for older kids.", "Swap salmon for cod if preferred."], mealType: "dinner"
    },
    {
      id: "7", name: "Turkey Meatball Pasta", description: "Tender turkey meatballs in a simple tomato sauce.",
      ingredients: ["200g ground turkey", "1/4 cup breadcrumbs", "1 egg", "1 cup pasta", "1/2 cup tomato sauce", "1 tsp Italian herbs", "1 tbsp parmesan"],
      steps: ["Mix turkey, breadcrumbs, egg, and herbs in a bowl.", "Roll into small bite-sized meatballs.", "Bake at 375°F for 15 minutes.", "Cook pasta according to directions.", "Warm tomato sauce in a pan.", "Combine pasta, sauce, and meatballs. Top with parmesan."],
      tips: ["Make meatballs tiny for toddlers — easier to chew.", "Batch cook and freeze meatballs.", "Add grated zucchini to the meat mix for hidden veggies."], mealType: "dinner"
    },
  ],
  snack: [
    {
      id: "8", name: "Apple & Peanut Butter Bites", description: "Crunchy apple slices with creamy peanut butter.",
      ingredients: ["1 apple", "2 tbsp peanut butter", "1 tbsp granola", "1 tsp honey", "Pinch of cinnamon"],
      steps: ["Wash and slice apple into wedges.", "Spread peanut butter on each slice.", "Sprinkle with granola and cinnamon.", "Drizzle lightly with honey.", "Serve on a plate for easy snacking."],
      tips: ["Use sunflower butter if nut allergy exists.", "Skip honey for under 1 year old.", "Great after-school snack."], mealType: "snack"
    },
    {
      id: "9", name: "Frozen Yogurt Bark", description: "A fun, frozen treat packed with fruit and calcium.",
      ingredients: ["1 cup Greek yogurt", "1/2 cup mixed berries", "1 tbsp honey", "2 tbsp mini chocolate chips"],
      steps: ["Line a baking sheet with parchment paper.", "Spread yogurt evenly into a thin layer.", "Press berries and chocolate chips into the yogurt.", "Drizzle with honey.", "Freeze for 2+ hours until solid.", "Break into pieces and serve."],
      tips: ["Store pieces in a freezer bag for up to 2 weeks.", "Use any fruit your child loves.", "Perfect for teething toddlers."], mealType: "snack"
    },
  ],
};

export function generateMeal(form: MealForm): Meal {
  const type = form.mealType.toLowerCase();
  const meals = mealDatabase[type] || mealDatabase.breakfast;
  const index = Math.floor(Math.random() * meals.length);
  return { ...meals[index], id: Date.now().toString() };
}

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
