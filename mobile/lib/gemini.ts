import { supabase } from "./supabase";
import { MealForm, Meal } from "./meal-data";

/** All AI generation routes through Supabase Edge Functions to:
 * 1. Protect API Keys (hidden from browser)
 * 2. Enable Caching (reduce costs)
 * 3. Enforce Rate Limiting (server-side)
 */

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
}

const EDGE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-meal-v2`;

export async function generateAIMeal(form: MealForm): Promise<Meal> {
  const token = await getAuthToken();
  const isJWT = token && token.startsWith('ey');
  
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(isJWT ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ form, type: 'single' })
  });

  const text = await res.text();
  if (!res.ok) {
    let errMsg = text;
    try { errMsg = JSON.parse(text)?.error || text; } catch {}
    if (res.status === 429) throw new Error("Daily generation limit reached. Upgrade to Pro for unlimited access.");
    throw new Error(`Edge Function Error (${res.status}): ${errMsg}`);
  }
  let data: any;
  try {
    const cleaned = text.replace(/```json\n?|```/gi, '').trim();
    data = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI meal response.");
  }
  
  // Safe helper to extract names even if AI returns plain strings
  const getIngredientNames = (ingredients: any) => {
    if (!ingredients || !Array.isArray(ingredients)) return [];
    return ingredients.map((i: any) => typeof i === 'string' ? i : i?.name).filter(Boolean);
  };

  return {
    ...data,
    id: Date.now().toString(),
    mealType: form.mealType,
    isAI: true,
    groceryList: data.groceryList || {
      vegetables: [],
      dairy: [],
      grains: [],
      proteins: [],
      others: getIngredientNames(data.ingredients)
    }
  };
}

export async function generateAIWeeklyPlan(form: MealForm): Promise<any[]> {
  const token = await getAuthToken();
  const isJWT = token && token.startsWith('ey');
  
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(isJWT ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ form, type: 'weekly' })
  });

  const text = await res.text();
  if (!res.ok) {
    let errMsg = text;
    try { errMsg = JSON.parse(text)?.error || text; } catch {}
    if (res.status === 429) throw new Error("Daily generation limit reached. Upgrade to Pro for unlimited access.");
    throw new Error(`Edge Function Error (${res.status}): ${errMsg}`);
  }

  let data: any[];
  try {
    const cleaned = text.replace(/```json\n?|```/gi, '').trim();
    data = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse weekly plan response from AI.");
  }
  
  if (!Array.isArray(data)) throw new Error("AI returned unexpected format for weekly plan.");

  const emptyGrocery = { vegetables: [], dairy: [], grains: [], proteins: [], others: [] };
  const getIngredientNames = (ingredients: any): string[] => {
    if (!ingredients || !Array.isArray(ingredients)) return [];
    return ingredients.map((i: any) => typeof i === 'string' ? i : i?.name).filter(Boolean);
  };
  const normMeal = (meal: any, type: string, dayKey: string) => ({
    ...meal,
    id: `${dayKey}-${type}-${Date.now()}`,
    mealType: type,
    isAI: true,
    alternatives: meal?.alternatives || [],
    groceryList: meal?.groceryList || { ...emptyGrocery, others: getIngredientNames(meal?.ingredients) },
  });

  return data.map((day: any) => ({
    day: day.day,
    breakfast: normMeal(day.breakfast, 'breakfast', day.day),
    lunch:     normMeal(day.lunch,     'lunch',     day.day),
    snack:     day.snack ? normMeal(day.snack, 'snack', day.day) : undefined,
    dinner:    normMeal(day.dinner,    'dinner',    day.day),
  }));
}

export async function generateAIDrink(type: string, age: string, goal: string): Promise<any> {
  const token = await getAuthToken();
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ form: { childAge: age, goal, mealType: type }, type: 'drink' })
  });

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 429) throw new Error("Daily limit reached.");
    throw new Error(`Edge Function Error (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}
