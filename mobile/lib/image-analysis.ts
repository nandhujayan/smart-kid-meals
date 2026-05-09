import { supabase } from "./supabase";

export interface ImageAnalysisResult {
  mealName: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: 'high' | 'medium' | 'low';
}

const EDGE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-meal-image`;

export async function analyzeMealImage(imageBase64: string): Promise<ImageAnalysisResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ imageBase64 })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image analysis failed: ${text}`);
  }

  return await res.json();
}
