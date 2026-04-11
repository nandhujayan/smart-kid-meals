import { GoogleGenerativeAI } from "@google/generative-ai";

export interface DiagnosticResult {
  hasKey: boolean;
  status: "success" | "error" | "pending";
  message: string;
  details?: string;
}

export const checkGeminiKey = (): boolean => {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};

export const runFullDiagnostic = async (): Promise<DiagnosticResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      hasKey: false,
      status: "error",
      message: "VITE_GEMINI_API_KEY is missing from environment variables.",
      details: "Ensure it is added to your Vercel project settings and starts with 'VITE_' prefix."
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" }
    );
    
    const result = await model.generateContent("Hello. Reply with 'OK' if you are working.");
    const response = await result.response;
    const text = response.text();

    if (text.includes("OK") || text.length > 0) {
      return {
        hasKey: true,
        status: "success",
        message: "Gemini API Connection Successful!",
        details: `Received response: "${text.substring(0, 50)}..."`
      };
    }

    return {
      hasKey: true,
      status: "error",
      message: "Connected but received an unexpected response.",
      details: text
    };
  } catch (error: any) {
    console.error("Diagnostic Error:", error);
    
    let message = "API Connection Failed";
    let details = error.message || "Unknown error occurred";

    if (error.message?.includes("API_KEY_INVALID")) {
      message = "Invalid API Key";
      details = "The key provided was rejected by Google. Check for typos or if the key is active.";
    } else if (error.message?.includes("User location is not supported")) {
      message = "Region Blocked";
      details = "Gemini API is currently not available in your deployment region or user's location.";
    }

    return {
      hasKey: true,
      status: "error",
      message,
      details
    };
  }
};
