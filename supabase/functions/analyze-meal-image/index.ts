// Supabase Edge Function: analyze-meal-image
// Analyzes meal photos using Gemini Vision API to identify food and estimate nutrition

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Gemini API with vision capabilities
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                text: `Analyze this food image and provide detailed nutrition information. 
                Identify the meal/food item and estimate:
                - Meal name (be specific)
                - Calories (kcal)
                - Protein (grams)
                - Carbohydrates (grams) 
                - Fats (grams)
                - Brief description of what's visible
                
                Respond ONLY in this exact JSON format:
                {
                  "mealName": "Specific meal name",
                  "description": "Brief description of the food visible",
                  "nutrition": {
                    "calories": number,
                    "protein": number,
                    "carbs": number,
                    "fats": number
                  },
                  "confidence": "high|medium|low"
                }
                
                If you cannot identify the food clearly, set confidence to "low" and provide your best estimate.
                Make reasonable estimates based on typical portion sizes for children.`
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    let analysisResult;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', responseText);
      // Return a fallback response
      analysisResult = {
        mealName: 'Unknown Meal',
        description: 'Could not clearly identify the food in this image.',
        nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        confidence: 'low'
      };
    }

    // Validate and normalize the response
    const normalizedResult = {
      mealName: analysisResult.mealName || 'Unknown Meal',
      description: analysisResult.description || '',
      calories: Math.round(Number(analysisResult.nutrition?.calories) || 0),
      protein: Math.round(Number(analysisResult.nutrition?.protein) || 0),
      carbs: Math.round(Number(analysisResult.nutrition?.carbs) || 0),
      fats: Math.round(Number(analysisResult.nutrition?.fats) || 0),
      confidence: analysisResult.confidence || 'medium'
    };

    return new Response(JSON.stringify(normalizedResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
