import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { form, type = 'single' } = await req.json()
    
    // 2. Generate Input Hash for Caching
    const inputString = `${form.childAge}-${form.diet}-${form.allergies?.sort().join(',')}-${form.goal}-${form.mealType}`
    const encoder = new TextEncoder()
    const data = encoder.encode(inputString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 3. Check Cache
    const { data: cachedMeal } = await supabaseClient
      .from('ai_meal_cache')
      .select('meal_data')
      .eq('input_hash', inputHash)
      .maybeSingle()

    if (cachedMeal) {
      console.log('Cache hit for hash:', inputHash)
      // Increment popularity in background
      supabaseClient.rpc('increment_cache_popularity', { target_hash: inputHash }).then()
      
      return new Response(JSON.stringify(cachedMeal.meal_data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Rate Limit & Tier Check
    const { data: usage, error: usageError } = await supabaseClient.rpc('increment_usage_v2', {
      target_user_id: user.id
    })

    if (usageError || (usage && usage.limit_reached)) {
      return new Response(JSON.stringify({ 
        error: 'Too many requests, please try again tomorrow or upgrade to Pro.',
        limit_reached: true,
        daily_count: usage?.daily_count
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
      // 5. Generate AI Response (Cache Miss)
      const apiKey = Deno.env.get('GEMINI_API_KEY')
      if (!apiKey) throw new Error('GEMINI_API_KEY missing')

      let sysInstruction = ''
      let prompt = ''

      if (type === 'drink') {
        sysInstruction = `You are a pediatric nutritionist specializing in healthy beverages for kids.
Generate a nutritious ${form.mealType} (Smoothie, Shake, or Juice) specifically for a ${form.childAge} old child.
Goal: ${form.goal}. Focus on using whole fruits, vegetables, and seeds. Avoid refined sugars.
Return ONLY valid JSON matching this structure:
{
  "drinkName": "string",
  "prepTime": "string",
  "ingredients": ["string"],
  "steps": ["string"],
  "calories": "string",
  "benefits": ["string"]
}`
        prompt = `Create a ${form.mealType} for ${form.childAge} with goal: ${form.goal}`
      } else if (type === 'weekly') {
        sysInstruction = `You are a pediatric nutrition expert. Generate a 7-day healthy meal plan (JSON array) for a ${form.childAge} old child.
Diet: ${form.diet}. Goal: ${form.goal}.
Return a JSON array of 7 objects, each with: { day, breakfast: {mealName, ingredients: [{name, quantity}], steps, nutrition: {calories, protein, carbs, fats, vitamins}, tips, alternatives}, lunch: ..., dinner: ... }`
        prompt = `Generate a 7-day plan.`
      } else {
        sysInstruction = `You are a global pediatric nutrition expert. Generate a healthy, simple ${form.mealType} for a ${form.childAge} old.
Diet: ${form.diet}. Allergies: ${form.allergies?.join(', ') || 'None'}. Goal: ${form.goal}.
RULES:
1. Max 6 steps. 2. Use common ingredients. 3. Include nutrition macros.`
        prompt = `Generate meal recipe.`
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: sysInstruction
      })

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })

      const aiResponse = JSON.parse(result.response.text())

      // 6. Cache Result
      await supabaseClient.from('ai_meal_cache').insert({
        input_hash: inputHash,
        meal_data: aiResponse,
        age_group: form.childAge,
        diet_type: form.diet,
        meal_type: form.mealType,
        is_drink: type === 'drink'
      })

      return new Response(JSON.stringify(aiResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (aiError) {
      console.warn("AI Generation failed, attempting cache fallback:", aiError)
      
      // FALLBACK: Query similar meal from global cache
      const { data: fallback, error: fallbackError } = await supabaseClient
        .from('ai_meal_cache')
        .select('meal_data')
        .eq('is_drink', type === 'drink')
        .eq('age_group', form.childAge)
        .eq('meal_type', form.mealType)
        .order('id', { ascending: true }) // random seed simulation
        .limit(1)
        .maybeSingle()

      if (fallback) {
        return new Response(JSON.stringify(fallback.meal_data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      throw aiError // If no fallback, throw original error
    }

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
