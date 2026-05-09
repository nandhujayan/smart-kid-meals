import { supabase } from "./supabase";

/** All AI generation routes through Supabase Edge Functions to:
 * 1. Protect API Keys (hidden from browser)
 * 2. Enable Caching (reduce costs)
 * 3. Enforce Rate Limiting (server-side)
 */

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-v2`;

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
    if (res.status === 429) throw new Error("Daily generation limit reached. Upgrade to Pro for unlimited access.");
    throw new Error(`Edge Function Error (${res.status}): ${text}`);
  }
  const data = JSON.parse(text);
  
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
    if (res.status === 429) throw new Error("Daily generation limit reached. Upgrade to Pro for unlimited access.");
    throw new Error(`Edge Function Error (${res.status}): ${text}`);
  }

  const data = JSON.parse(text);
  
  const getIngredientNames = (ingredients: any) => {
    if (!ingredients || !Array.isArray(ingredients)) return [];
    return ingredients.map((i: any) => typeof i === 'string' ? i : i?.name).filter(Boolean);
  };

  return data.map((day: any) => ({
    ...day,
    breakfast: { ...day.breakfast, id: `${day.day}-b-${Date.now()}`, mealType: "breakfast", groceryList: day.breakfast?.groceryList || { vegetables: [], dairy: [], grains: [], proteins: [], others: getIngredientNames(day.breakfast?.ingredients) } },
    lunch: { ...day.lunch, id: `${day.day}-l-${Date.now()}`, mealType: "lunch", groceryList: day.lunch?.groceryList || { vegetables: [], dairy: [], grains: [], proteins: [], others: getIngredientNames(day.lunch?.ingredients) } },
    dinner: { ...day.dinner, id: `${day.day}-d-${Date.now()}`, mealType: "dinner", groceryList: day.dinner?.groceryList || { vegetables: [], dairy: [], grains: [], proteins: [], others: getIngredientNames(day.dinner?.ingredients) } },
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
