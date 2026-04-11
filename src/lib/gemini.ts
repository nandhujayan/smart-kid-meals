import { supabase } from "./supabase";

/**
 * NEW SCALABLE ARCHITECTURE
 * All AI generation has been moved to Supabase Edge Functions to:
 * 1. Protect API Keys (Hide from browser)
 * 2. Implement Caching (Reduce costs/speed up requests)
 * 3. Enforce Rate Limiting (3 per day for free users)
 */

const mealSchema = {
  type: SchemaType.OBJECT,
  properties: {
    mealName: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    cookingTime: { type: SchemaType.STRING },
    difficulty: { type: SchemaType.STRING },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          quantity: { type: SchemaType.STRING },
        },
        required: ["name", "quantity"],
      },
    },
    steps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    nutrition: {
      type: SchemaType.OBJECT,
      properties: {
        calories: { type: SchemaType.NUMBER },
        protein: { type: SchemaType.NUMBER },
        carbs: { type: SchemaType.NUMBER },
        fats: { type: SchemaType.NUMBER },
        vitamins: { type: SchemaType.STRING },
      },
      required: ["calories", "protein", "carbs", "fats", "vitamins"],
    },
    tips: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    alternatives: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          mealName: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ["mealName", "reason"],
      },
    },
  },
  required: [
    "mealName",
    "description",
    "cookingTime",
    "difficulty",
    "ingredients",
    "steps",
    "nutrition",
    "tips",
    "alternatives",
  ],
};

const weeklyPlanSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      day: { type: SchemaType.STRING },
      breakfast: mealSchema,
      lunch: mealSchema,
      dinner: mealSchema
    },
    required: ["day", "breakfast", "lunch", "dinner"]
  }
};

const drinkSchema = {
  type: SchemaType.OBJECT,
  properties: {
    drinkName: { type: SchemaType.STRING },
    prepTime: { type: SchemaType.STRING },
    ingredients: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    steps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    calories: { type: SchemaType.STRING },
    benefits: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ["drinkName", "prepTime", "ingredients", "steps", "calories", "benefits"]
};



const MEAL_SYSTEM_INSTRUCTION = `You are a global pediatric nutrition expert and experienced home cook.
Your job is to generate highly analyzed, simple, healthy, child-friendly meals.

CORE RULES:
1. AGE APPRORIATENESS: Analyze if textures/flavors match age group.
2. ALLERGY SAFETY: Strict exclusion of specified allergens.
3. GOAL ALIGNMENT: Optimize for the provided health goal.
4. DIETARY ADHERENCE: Strictly follow specified diet (Vegetarian, Vegan, etc.).
5. CONFLICT RESOLUTION: If provided ingredients conflict with diet/allergies, IGNORE them and substitute safely.
6. EXPLAIN: In the 'tips' section, explain any safety substitutions or how the meal meets the health goal.
7. STYLE: Adhere to the specified cuisine style. Use simple English and clear steps.`;

export async function generateAIMeal(form: MealForm): Promise<Meal> {
  const { data, error } = await supabase.functions.invoke('generate-meal-v2', {
    body: { form, type: 'single' }
  });

  if (error) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate meal. You might have reached your daily limit.");
  }

  return {
    ...data,
    id: Date.now().toString(),
    mealType: form.mealType,
    isAI: true,
    groceryList: {
      vegetables: [],
      dairy: [],
      grains: [],
      proteins: [],
      others: data.ingredients.map((i: any) => i.name)
    }
  };
}

export async function generateAIWeeklyPlan(form: MealForm): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke('generate-meal-v2', {
    body: { form, type: 'weekly' }
  });

  if (error) throw error;
  const plan = data;
  
  return plan.map((day: any) => ({
    ...day,
    breakfast: { 
      ...day.breakfast, 
      id: `${day.day}-b-${Date.now()}`,
      mealType: "breakfast",
      groceryList: { vegetables: [], dairy: [], grains: [], proteins: [], others: day.breakfast.ingredients.map((i: any) => i.name) }
    },
    lunch: { 
      ...day.lunch, 
      id: `${day.day}-l-${Date.now()}`,
      mealType: "lunch",
      groceryList: { vegetables: [], dairy: [], grains: [], proteins: [], others: day.lunch.ingredients.map((i: any) => i.name) }
    },
    dinner: { 
      ...day.dinner, 
      id: `${day.day}-d-${Date.now()}`,
      mealType: "dinner",
      groceryList: { vegetables: [], dairy: [], grains: [], proteins: [], others: day.dinner.ingredients.map((i: any) => i.name) }
    },
  }));
}

export async function generateAIDrink(type: string, age: string, goal: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke('generate-meal-v2', {
    body: { form: { childAge: age, goal, mealType: type }, type: 'drink' }
  });

  if (error) throw error;
  return data;
}
