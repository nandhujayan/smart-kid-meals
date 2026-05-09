import { supabase } from "./supabase";

export interface DiagnosticResult {
  hasKey: boolean;
  status: "success" | "error" | "pending";
  message: string;
  details?: string;
}

export const checkGeminiKey = (): boolean => {
  return true; // We now use Edge Functions, API key is server-side
};

export const runFullDiagnostic = async (): Promise<DiagnosticResult> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    
    if (!token) {
      return {
        hasKey: false,
        status: "error",
        message: "Missing Supabase configuration",
        details: "VITE_SUPABASE_PUBLISHABLE_KEY is not set in environment variables."
      };
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-v2`;
    
    // We send an OPTIONS request as a simple ping to the Edge Function to verify it's reachable
    const res = await fetch(url, {
      method: "OPTIONS",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      return {
        hasKey: true,
        status: "success",
        message: "AI Edge Function Connection Successful!",
        details: `Connected to Supabase Edge Function with status: ${res.status}`
      };
    }

    return {
      hasKey: true,
      status: "error",
      message: "Connected but received an unexpected response.",
      details: `Status code: ${res.status}`
    };
  } catch (error: any) {
    console.error("Diagnostic Error:", error);
    
    return {
      hasKey: true,
      status: "error",
      message: "API Connection Failed",
      details: error.message || "Unknown error occurred"
    };
  }
};
