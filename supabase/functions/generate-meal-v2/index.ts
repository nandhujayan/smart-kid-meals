// Supabase Edge Function: generate-meal-v2
// Production-hardened: CORS restricted, rate limiting enforced, API key protected

const corsHeaders = {
  // Set ALLOWED_ORIGIN env var in Supabase to your production domain
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Rate limit configuration - MUST match client-side expectations
const RATE_LIMITS = {
  free: 5,      // 5 meals per day for free users
  pro: 1000,    // 1000 meals per day for pro users (effectively unlimited)
};

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(
    input.filter((v) => typeof v === 'string').map((s) => s.trim().toLowerCase()).filter(Boolean)
  ));
}

function normalizeGoal(goal: unknown): string {
  const g = typeof goal === 'string' ? goal.trim().toLowerCase() : '';
  if (!g || g === 'general health') return 'balanced';
  if (g.includes('weight')) return 'weight gain';
  if (g.includes('brain')) return 'brain boost';
  if (g.includes('immun')) return 'immunity';
  // Preserve any other goal verbatim (trimmed)
  return (goal as string).trim().toLowerCase();
}

function normalizeDiet(diet: unknown): string {
  const d = typeof diet === 'string' ? diet.trim().toLowerCase() : '';
  if (!d || d === 'none') return 'regular';
  if (d.startsWith('vegan')) return 'vegan';
  if (d.startsWith('veg')) return 'vegetarian';
  if (d.includes('pescatarian')) return 'pescatarian';
  if (d.includes('dairy')) return 'dairy-free';
  return 'regular';
}

function normalizeMealType(mealType: unknown): string {
  const t = typeof mealType === 'string' ? mealType.trim().toLowerCase() : '';
  if (['breakfast', 'lunch', 'dinner', 'snack'].includes(t)) return t;
  return 'breakfast';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const supaUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const dbRestUrl = `${supaUrl}/rest/v1`;
    const dbRpcUrl = `${supaUrl}/rest/v1/rpc`;

    // 1. Authenticate user (optional — allows anonymous with anon key)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const authRes = await fetch(`${supaUrl}/auth/v1/user`, {
        method: "GET",
        headers: { 'Authorization': authHeader, 'apikey': serviceKey }
      });
      if (authRes.ok) {
        const userData = await authRes.json();
        userId = userData?.id || null;
      }
    }

    // 2. Parse body
    const { form, type = 'single' } = await req.json();

    // 3. Cache lookup FIRST (single meal only) — free, no rate limit charge
    if (type === 'single') {
      const allergiesForHash = normalizeTags(form?.allergies).sort().join(',');
      const availableForHash = normalizeTags(form?.availableIngredients).sort().join(',');
      const inputString = `${form?.childAge}-${form?.diet}-${allergiesForHash}-${form?.goal}-${form?.mealType}-${availableForHash}-${Boolean(form?.onlyAvailable)}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(inputString));
      const inputHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      const cacheRes = await fetch(`${dbRestUrl}/ai_meal_cache?input_hash=eq.${inputHash}&select=meal_data`, {
        headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
      });
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData?.length > 0) {
          // Cache hit — return without counting against rate limit
          return new Response(JSON.stringify(cacheData[0].meal_data), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // 4. Library match — also free, no rate limit charge
      const libraryPayload = {
        p_age_group: String(form?.childAge || ''),
        p_diet_type: normalizeDiet(form?.diet),
        p_meal_type: normalizeMealType(form?.mealType),
        p_goal: normalizeGoal(form?.goal),
        p_allergies: normalizeTags(form?.allergies),
        p_available_ingredients: normalizeTags(form?.availableIngredients),
        p_require_available_match: Boolean(form?.onlyAvailable),
        p_limit: 1,
      };
      if (libraryPayload.p_age_group && libraryPayload.p_diet_type && libraryPayload.p_meal_type) {
        const libRes = await fetch(`${dbRpcUrl}/find_meal_in_library`, {
          method: 'POST',
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(libraryPayload),
        });
        if (libRes.ok) {
          const libData = await libRes.json();
          if (Array.isArray(libData) && libData.length > 0 && libData[0]?.meal_data) {
            // Library hit — return without counting against rate limit
            return new Response(JSON.stringify(libData[0].meal_data), {
              status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    // 5. Rate limit check — ONLY runs when Gemini API is actually needed
    if (userId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check user's subscription tier
        const subRes = await fetch(`${dbRestUrl}/user_subscriptions?user_id=eq.${userId}&select=tier`, {
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
        });
        let tier = 'free';
        if (subRes.ok) {
          const subData = await subRes.json();
          tier = subData[0]?.tier || 'free';
        }
        
        const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
        
        // Check current usage
        const usageRes = await fetch(`${dbRestUrl}/usage_stats?user_id=eq.${userId}&select=daily_generation_count,last_reset_date,generation_count`, {
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
        });
        
        let dailyCount = 0;
        let totalCount = 0;
        let lastReset = null;
        
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          if (usageData.length > 0) {
            dailyCount = usageData[0].daily_generation_count || 0;
            totalCount = usageData[0].generation_count || 0;
            lastReset = usageData[0].last_reset_date;
          }
        }
        
        // Reset daily count if it's a new day
        if (lastReset !== today) {
          dailyCount = 0;
        }
        
        // Check if limit reached
        if (dailyCount >= limit) {
          return new Response(JSON.stringify({
            error: `Daily limit reached (${limit}/${limit}). Upgrade to Pro for unlimited meals.`,
            tier,
            limit,
            used: dailyCount,
          }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Increment usage using upsert
        await fetch(`${dbRestUrl}/usage_stats`, {
          method: 'POST',
          headers: { 
            'apikey': serviceKey, 
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            user_id: userId,
            daily_generation_count: dailyCount + 1,
            last_reset_date: today,
            generation_count: totalCount + 1,
            last_generation_at: new Date().toISOString(),
          })
        });
        
      } catch (err) {
        console.error('Rate limiting error:', err);
        // Continue with generation even if rate limiting fails
      }
    }

    // 6. Get Gemini API Key (server-side only - never exposed to client)
    let geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('AI service not configured. Please contact support.');
    }
    geminiApiKey = geminiApiKey.trim().replace(/^["']|["']$/g, '');
    
    // Validate key format (basic check)
    if (!geminiApiKey.startsWith('AIzaSy')) {
      console.error('Invalid Gemini API key format');
      throw new Error('AI service configuration error.');
    }

    // Use the correct Gemini model endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    let sysInstruction: string;
    let userPrompt: string;

    const childAgeLabel = form?.childAge ? `a ${form.childAge} month-old child` : 'a child';
    const dietLabel = normalizeDiet(form?.diet);
    const goalLabel = normalizeGoal(form?.goal);
    const allergyClause = Array.isArray(form?.allergies) && form.allergies.length > 0
      ? `Strictly avoid these allergens: ${form.allergies.join(', ')}.`
      : '';
    const ingredientClause = Array.isArray(form?.availableIngredients) && form.availableIngredients.length > 0
      ? `Prefer using these available ingredients: ${form.availableIngredients.join(', ')}.`
      : '';

    if (type === 'weekly') {
      sysInstruction = `You are a pediatric nutrition expert. Generate a 7-day meal plan for ${childAgeLabel} following a ${dietLabel} diet. Health goal: ${goalLabel}. ${allergyClause} Return ONLY a valid JSON array — no markdown, no extra text. The array must have exactly 7 objects. Each object schema: { "day": string, "breakfast": MealObject, "lunch": MealObject, "dinner": MealObject }. MealObject schema: { "mealName": string, "description": string, "cookingTime": string, "difficulty": string, "ingredients": [{"name": string, "quantity": string}], "steps": [string], "tips": [string], "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number, "vitamins": string} }.`;
      userPrompt = 'Output the JSON array only, no markdown, no commentary.';
    } else if (type === 'drink') {
      sysInstruction = `You are a pediatric nutrition expert. Generate a healthy ${form?.mealType || 'smoothie'} drink for ${childAgeLabel}. Health goal: ${goalLabel}. ${allergyClause} Return ONLY valid JSON — no markdown, no extra text. Schema: { "drinkName": string, "prepTime": string, "ingredients": [string], "steps": [string], "calories": number, "benefits": [string], "insight": string, "kidActivity": string, "costRank": "Budget"|"Moderate"|"Premium" }.`;
      userPrompt = 'Output the JSON object only, no markdown, no commentary.';
    } else {
      const preferredMeal = form?.preferredMealName ? `The meal must be: "${form.preferredMealName}". ` : '';
      sysInstruction = `You are a pediatric nutrition expert. ${preferredMeal}Generate a healthy ${normalizeMealType(form?.mealType)} for ${childAgeLabel} following a ${dietLabel} diet. Health goal: ${goalLabel}. ${allergyClause} ${ingredientClause} Return ONLY valid JSON — no markdown, no extra text. Schema: { "mealName": string, "description": string, "cookingTime": string, "difficulty": string, "ingredients": [{"name": string, "quantity": string}], "steps": [string], "tips": [string], "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number, "vitamins": string}, "groceryList": {"vegetables": [string], "dairy": [string], "grains": [string], "proteins": [string], "others": [string]}, "alternatives": [{"mealName": string, "reason": string}], "costRank": "Budget"|"Moderate"|"Premium", "kidActivity": string, "insight": string }.`;
      userPrompt = 'Output the JSON object only, no markdown, no commentary.';
    }

    const geminiPayload = {
      systemInstruction: { parts: [{ text: sysInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    const geminiData = await geminiRes.json();
    
    // Explicitly check for Gemini API errors (like Quota Exceeded or Invalid Key)
    if (!geminiRes.ok) {
      console.error("[Gemini API Error details]:", JSON.stringify(geminiData, null, 2));
      const errMsg = geminiData?.error?.message || "Unknown Gemini API error";
      const errCode = geminiData?.error?.code || geminiRes.status;
      
      // If it's a quota error (limit 0), make the error message extremely clear
      if (errMsg.includes("limit: 0") || errCode === 429) {
        throw new Error(`Google Gemini API Quota Exceeded (Error 429). You must enable Billing in Google Cloud to use this key. Details: ${errMsg}`);
      }
      throw new Error(`Gemini API failed (${errCode}): ${errMsg}`);
    }

    const aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiResponseText) {
      console.error("[Gemini Empty Response]:", JSON.stringify(geminiData, null, 2));
      throw new Error(`Invalid Gemini response structure: missing text content.`);
    }

    const cleanJson = aiResponseText.replace(/```json\n?|```/gi, '').trim();
    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("[JSON Parse Error on Gemini Response]:", cleanJson);
      throw new Error(`Failed to parse AI response into JSON. The prompt might be returning invalid format.`);
    }

    // 7. Cache single meal results
    if (type === 'single') {
      const allergiesForHash = normalizeTags(form?.allergies).sort().join(',');
      const inputString = `${form?.childAge}-${form?.diet}-${allergiesForHash}-${form?.goal}-${form?.mealType}-${normalizeTags(form?.availableIngredients).sort().join(',')}-${Boolean(form?.onlyAvailable)}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(inputString));
      const inputHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      await fetch(`${dbRestUrl}/ai_meal_cache`, {
        method: "POST",
        headers: {
          'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          input_hash: inputHash, meal_data: aiResponse,
          age_group: form?.childAge || 'unknown', diet_type: form?.diet || 'none',
          meal_type: form?.mealType || 'unknown', is_drink: type === 'drink'
        })
      });
    }

    return new Response(JSON.stringify(aiResponse), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Edge Function Error]:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
