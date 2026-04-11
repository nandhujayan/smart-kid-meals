import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Meal, MealForm } from "./meal-data";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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

function cleanAndParseJSON(text: string) {
  try {
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw text:", text);
    // If it fails, try to find the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    throw e;
  }
}

export async function generateAIMeal(form: MealForm): Promise<Meal> {
  if (!genAI) throw new Error("API Key missing");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: mealSchema,
    },
  });

  const allergiesStr = form.allergies?.length > 0 ? form.allergies.join(", ") : "None";

  const prompt = `
You are a global pediatric nutrition expert and experienced home cook.
Your job is to generate a highly analyzed, simple, healthy, child-friendly meal based on specific data.

CORE ANALYSIS REQUIRED:
1. AGE APPRORIATENESS: Analyze if textures/flavors match age group (${form.childAge}).
2. ALLERGY SAFETY: Strict exclusion of ${allergiesStr}. If an ingredient in "Available Ingredients" is an allergen, IGNORE IT.
3. GOAL ALIGNMENT: Optimize for ${form.goal || "Balanced growth"}.
4. DIETARY ADHERENCE: Strictly ${form.diet || "Standard"}. Cross-check against "Available Ingredients". If an ingredient (e.g., meat) conflicts with the diet (e.g., Vegetarian), IGNORE it and substitute with a compliant alternative.

INPUTS:
* Child Age: ${form.childAge}
* Diet: ${form.diet || "Standard"}
* Allergies: ${allergiesStr}
* Goal: ${form.goal || "Balanced growth"}
* Meal Type: ${form.mealType}
* Preferred Cuisine: ${form.cuisine || "Global/Any"}
* Available Ingredients: ${form.availableIngredients?.join(", ") || "Any"}
* Strict Mode (use only available ingredients): ${form.onlyAvailable}

RULES:
* CUISINE STYLE: Strictly adhere to the ${form.cuisine || "Global"} cuisine style for flavors and recipes.
* CONFLICT RESOLUTION: If the user provides "Available Ingredients" that conflict with their "Diet" or "Allergies", you must be the "Smart Filter". Do NOT use the conflicting items. Instead, generate a meal that is 100% safe and compliant.
* EXPLAIN: In the 'tips' section, if you filtered out a conflicting ingredient, politely explain why (e.g., "I noticed chicken was listed, but since the diet is Vegetarian, I used chickpeas instead for protein safety.").
* Use very simple English (global audience)
* Each step must be short and clear (1 action only)
* Avoid complex cooking terms
* Keep ingredients common and affordable
* Realistic nutrition based on age requirements.
* In the 'tips' section, explicitly explain how this meal supports the '${form.goal}' goal for a '${form.childAge}' old.
* Generate a completely different meal every time.
* Do NOT repeat ingredients or similar dish.

GOAL:
Make cooking extremely easy for any mother in the world, while ensuring 100% safety and dietary compliance.

Focus on:
* Age-appropriate nutrition
* Growth support
* Easy digestion
* Taste preference for children

Return the JSON in the exact expected schema.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log("AI Response Text:", text);
  
  const aiData = cleanAndParseJSON(text);
  
  return {
    ...aiData,
    id: Date.now().toString(),
    mealType: form.mealType,
    isAI: true,
    groceryList: {
      vegetables: [],
      dairy: [],
      grains: [],
      proteins: [],
      others: aiData.ingredients.map((i: any) => i.name)
    }
  };
}

export async function generateAIWeeklyPlan(form: MealForm): Promise<any[]> {
  if (!genAI) throw new Error("API Key missing");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: weeklyPlanSchema,
    },
  });

  const prompt = `
You are a global pediatric nutrition expert. Generate a 7-day healthy meal plan.
Child Age: ${form.childAge}
Diet: ${form.diet || "Standard"}
Allergies: ${form.allergies || "None"}
Goal: ${form.goal || "Growth"}
Preferred Cuisine: ${form.cuisine || "Global/Any"}

Return a JSON array of 7 days (Monday-Sunday). Each day should have breakfast, lunch, and dinner.
Follow the same expert persona and rules as for individual meals, ensuring all meals align with the ${form.cuisine || "Global"} cuisine style.`;

  const result = await model.generateContent(prompt);
  const plan = cleanAndParseJSON(result.response.text());
  
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
  if (!genAI) throw new Error("API Key missing");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: drinkSchema,
    },
  });

  const prompt = `
You are a child nutrition expert. Your job is to generate a healthy drink for a child.
Inputs:
* Category: ${type} (Juice, Milkshake, Smoothie, or High-calorie drink)
* Child Age: ${age}
* Health Goal: ${goal} (e.g. weight gain, energy, hydration)

Rules:
* Use very simple ingredients.
* Keep preparation extremely easy.
* Focus on child-friendly taste.
* Ensure safety for the specified age group (e.g. no small seeds or choking hazards for toddlers).
* No honey for children under 1 year old.
* Return ingredients as a simple array of strings.
* Return benefits as short, punchy benefit strings.

Focus on making it visually and nutritionally appealing.`;

  const result = await model.generateContent(prompt);
  return cleanAndParseJSON(result.response.text());
}
