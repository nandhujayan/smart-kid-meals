-- MASSIVE MOCK DATA SEED (200 RECORDS)
-- This script populates the global cache with 100 Meals and 100 Drinks.
-- These serve as "similarity matches" if AI generation ever fails.

DO $$
DECLARE
    i INTEGER;
    ages TEXT[] := ARRAY['1-2', '3-5', '6-12'];
    diets TEXT[] := ARRAY['Standard', 'Vegetarian', 'Vegan', 'Gluten-Free'];
    meal_types TEXT[] := ARRAY['breakfast', 'lunch', 'dinner'];
    drink_types TEXT[] := ARRAY['Smoothie', 'Shake', 'Juice'];
    selected_age TEXT;
    selected_diet TEXT;
    selected_type TEXT;
    m_name TEXT;
    d_name TEXT;
BEGIN
    -- 1. GENERATE 100 MEALS
    FOR i IN 1..100 LOOP
        selected_age := ages[1 + (i % 3)];
        selected_diet := diets[1 + (i % 4)];
        selected_type := meal_types[1 + (i % 3)];
        
        m_name := 'Healthy ' || selected_diet || ' ' || selected_type || ' #' || i;
        
        INSERT INTO public.ai_meal_cache (input_hash, age_group, diet_type, meal_type, is_drink, meal_data)
        VALUES (
            'mock-meal-' || i,
            selected_age,
            selected_diet,
            selected_type,
            false,
            jsonb_build_object(
                'mealName', m_name,
                'description', 'A nutritious ' || selected_type || ' balanced for ' || selected_age || ' kids.',
                'cookingTime', '15-20 min',
                'difficulty', 'Easy',
                'ingredients', jsonb_build_array(
                    jsonb_build_object('name', 'Main base', 'quantity', '1 cup'),
                    jsonb_build_object('name', 'Veggie boost', 'quantity', '1/2 cup'),
                    jsonb_build_object('name', 'Healthy protein', 'quantity', '100g')
                ),
                'steps', jsonb_build_array('Prep ingredients', 'Cook gently', 'Serve warm'),
                'nutrition', jsonb_build_object('calories', 250 + (i % 100), 'protein', 10 + (i % 10), 'carbs', 30 + (i % 20), 'fats', 8 + (i % 5), 'vitamins', 'A, B12, Iron'),
                'tips', jsonb_build_array('Great for busy mornings', 'Can be frozen'),
                'alternatives', jsonb_build_array(jsonb_build_object('mealName', 'Yogurt Bowl', 'reason', 'Quick alternative'))
            )
        ) ON CONFLICT (input_hash) DO NOTHING;
    END LOOP;

    -- 2. GENERATE 100 DRINKS
    FOR i IN 1..100 LOOP
        selected_age := ages[1 + (i % 3)];
        selected_type := drink_types[1 + (i % 3)];
        
        d_name := 'Nutri-' || selected_type || ' #' || i;
        
        INSERT INTO public.ai_meal_cache (input_hash, age_group, diet_type, meal_type, is_drink, meal_data)
        VALUES (
            'mock-drink-' || i,
            selected_age,
            'Standard',
            selected_type,
            true,
            jsonb_build_object(
                'drinkName', d_name,
                'prepTime', '5 min',
                'ingredients', jsonb_build_array('Fresh fruit', 'Power seeds', 'Milk or alternative'),
                'steps', jsonb_build_array('Blend all', 'Pour and enjoy'),
                'calories', (120 + (i % 50)) || ' kcal',
                'benefits', jsonb_build_array('High energy', 'Vitamin boost')
            )
        ) ON CONFLICT (input_hash) DO NOTHING;
    END LOOP;
END $$;
