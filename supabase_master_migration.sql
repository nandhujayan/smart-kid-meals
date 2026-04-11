-- SUPABASE MASTER MIGRATION - SMART KID MEALS
-- CONSOLIDATED SCHEMA, LOGIC, AND MOCK DATA
-- Run this ONCE in the Supabase SQL Editor.

-- ==========================================================
-- 1. BASE TABLES & SECURITY
-- ==========================================================

-- Child Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    age text,
    weight text,
    height text,
    diet text,
    allergies text[] DEFAULT '{}',
    goal text,
    created_at timestamp with time zone DEFAULT now()
);

-- Saved Meals
CREATE TABLE IF NOT EXISTS public.saved_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    meal_name text NOT NULL,
    description text,
    cooking_time text,
    difficulty text,
    ingredients jsonb DEFAULT '[]',
    steps text[] DEFAULT '{}',
    tips text[] DEFAULT '{}',
    meal_type text,
    nutrition jsonb DEFAULT '{}',
    grocery_list jsonb DEFAULT '{}',
    alternatives jsonb DEFAULT '[]',
    child_profile_name text,
    is_ai boolean DEFAULT false,
    saved_at timestamp with time zone DEFAULT now()
);

-- Weekly Plans
CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    days jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    status text DEFAULT 'active',
    updated_at timestamp with time zone DEFAULT now()
);

-- Usage Tracking
CREATE TABLE IF NOT EXISTS public.usage_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    generation_count integer DEFAULT 0,
    daily_generation_count integer DEFAULT 0,
    last_reset_date date DEFAULT CURRENT_DATE,
    last_generation_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure daily tracking columns exist if table was previously created
ALTER TABLE public.usage_stats ADD COLUMN IF NOT EXISTS daily_generation_count integer DEFAULT 0;
ALTER TABLE public.usage_stats ADD COLUMN IF NOT EXISTS last_reset_date date DEFAULT CURRENT_DATE;

-- AI MEAL CACHE (The core of the scalability system)
CREATE TABLE IF NOT EXISTS public.ai_meal_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    input_hash text UNIQUE NOT NULL, 
    meal_data jsonb NOT NULL,        
    age_group text,
    diet_type text,
    meal_type text,
    goal text,
    is_drink boolean DEFAULT false,
    popularity_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now()
);

-- API Usage Logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    feature text,                    
    model_name text DEFAULT 'gemini-2.0-flash',
    prompt_tokens integer,
    completion_tokens integer,
    is_cache_hit boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- ==========================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_meal_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Base Policies
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
CREATE POLICY "Users can manage their own profiles" ON public.profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own saved meals" ON public.saved_meals;
CREATE POLICY "Users can manage their own saved meals" ON public.saved_meals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view the global meal cache" ON public.ai_meal_cache;
CREATE POLICY "Users can view the global meal cache" ON public.ai_meal_cache FOR SELECT USING (true);

-- ==========================================================
-- 3. AUTOMATION & LOGIC
-- ==========================================================

-- New User Setup Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier) VALUES (new.id, 'free') ON CONFLICT DO NOTHING;
  INSERT INTO public.usage_stats (user_id, daily_generation_count) VALUES (new.id, 0) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Advanced Usage Increment with Daily Reset & Limit Enforcements
CREATE OR REPLACE FUNCTION public.increment_usage_v2(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    current_stats RECORD;
    today date := CURRENT_DATE;
    tier_name text;
    limit_reached boolean := false;
BEGIN
    SELECT tier INTO tier_name FROM public.user_subscriptions WHERE user_id = target_user_id;
    IF tier_name IS NULL THEN tier_name := 'free'; END IF;

    SELECT * INTO current_stats FROM public.usage_stats WHERE user_id = target_user_id;

    IF current_stats.last_reset_date < today THEN
        UPDATE public.usage_stats SET daily_generation_count = 0, last_reset_date = today, updated_at = now() WHERE user_id = target_user_id;
        current_stats.daily_generation_count := 0;
    END IF;

    IF tier_name = 'free' AND current_stats.daily_generation_count >= 3 THEN
        limit_reached := true;
    END IF;

    IF NOT limit_reached THEN
        UPDATE public.usage_stats
        SET daily_generation_count = daily_generation_count + 1,
            generation_count = COALESCE(generation_count, 0) + 1,
            last_generation_at = now(),
            updated_at = now()
        WHERE user_id = target_user_id;
    END IF;

    RETURN jsonb_build_object('limit_reached', limit_reached, 'tier', tier_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- 4. MASSIVE DATA SEED (200 RECORDS)
-- ==========================================================

DO $$
DECLARE
    i INTEGER;
    ages TEXT[] := ARRAY['1-2', '3-5', '6-12'];
    diets TEXT[] := ARRAY['Standard', 'Vegetarian', 'Vegan', 'Gluten-Free'];
    meal_types TEXT[] := ARRAY['breakfast', 'lunch', 'dinner'];
    drink_types TEXT[] := ARRAY['Smoothie', 'Shake', 'Juice'];
    selected_age TEXT; selected_diet TEXT; selected_type TEXT;
    m_name TEXT; d_name TEXT;
BEGIN
    -- Meals (100)
    FOR i IN 1..100 LOOP
        selected_age := ages[1 + (i % 3)];
        selected_diet := diets[1 + (i % 4)];
        selected_type := meal_types[1 + (i % 3)];
        m_name := 'Healthy ' || selected_diet || ' ' || selected_type || ' #' || i;
        
        INSERT INTO public.ai_meal_cache (input_hash, age_group, diet_type, meal_type, is_drink, meal_data)
        VALUES (
            'mock-meal-' || i, selected_age, selected_diet, selected_type, false,
            jsonb_build_object(
                'mealName', m_name,
                'description', 'A flavorful ' || selected_type || ' for kids.',
                'cookingTime', '20 min',
                'difficulty', 'Easy',
                'ingredients', jsonb_build_array(jsonb_build_object('name', 'Ingredient A', 'quantity', '1 cup')),
                'steps', jsonb_build_array('Step 1', 'Step 2'),
                'nutrition', jsonb_build_object('calories', 250, 'protein', 12, 'carbs', 35, 'fats', 8, 'vitamins', 'Rich in A,C'),
                'tips', jsonb_build_array('Serve warm'),
                'alternatives', jsonb_build_array()
            )
        ) ON CONFLICT (input_hash) DO NOTHING;
    END LOOP;

    -- Drinks (100)
    FOR i IN 1..100 LOOP
        selected_age := ages[1 + (i % 3)];
        selected_type := drink_types[1 + (i % 3)];
        d_name := 'Nutri-' || selected_type || ' #' || i;
        
        INSERT INTO public.ai_meal_cache (input_hash, age_group, diet_type, meal_type, is_drink, meal_data)
        VALUES (
            'mock-drink-' || i, selected_age, 'Standard', selected_type, true,
            jsonb_build_object(
                'drinkName', d_name,
                'prepTime', '5 min',
                'ingredients', jsonb_build_array('Fresh Fruit', 'Water/Milk'),
                'steps', jsonb_build_array('Blend well'),
                'calories', '150 kcal',
                'benefits', jsonb_build_array('Hydrating', 'Vitamins')
            )
        ) ON CONFLICT (input_hash) DO NOTHING;
    END LOOP;
END $$;

-- ==========================================================
-- 5. INDEXING
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_cache_hash ON public.ai_meal_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_usage_reset ON public.usage_stats(last_reset_date);
