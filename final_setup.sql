-- FINAL DATABASE SETUP FOR SMART KID MEALS
-- CONSOLIDATED SCHEMA (TABLES, TRIGGERS, RLS)

-- 1. CLEANUP (Optional: Uncomment if you want to start fresh)
-- DROP TABLE IF EXISTS public.usage_stats;
-- DROP TABLE IF EXISTS public.user_subscriptions;
-- DROP TABLE IF EXISTS public.weekly_plans;
-- DROP TABLE IF EXISTS public.saved_meals;
-- DROP TABLE IF EXISTS public.profiles;

-- 2. CREATE TABLES

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
    last_generation_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES

-- Profiles
CREATE POLICY "Users can manage their own profiles" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

-- Saved Meals
CREATE POLICY "Users can manage their own saved meals" ON public.saved_meals
    FOR ALL USING (auth.uid() = user_id);

-- Weekly Plans
CREATE POLICY "Users can manage their own weekly plans" ON public.weekly_plans
    FOR ALL USING (auth.uid() = user_id);

-- Subscriptions & Usage (Read only for users, updated by system/triggers)
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" ON public.usage_stats
    FOR SELECT USING (auth.uid() = user_id);

-- 5. AUTOMATION: TRIGGERS FOR NEW USERS

-- Function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create free subscription
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (new.id, 'free');

  -- Create usage stats
  INSERT INTO public.usage_stats (user_id, generation_count)
  VALUES (new.id, 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. DATABASE FUNCTIONS FOR APP LOGIC

-- Securely increment generation count
CREATE OR REPLACE FUNCTION public.increment_generation_count(target_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.usage_stats
  SET generation_count = generation_count + 1,
      last_generation_at = now(),
      updated_at = now()
  WHERE user_id = target_user_id;

  -- Ensure record exists (fallback if trigger failed)
  IF NOT FOUND THEN
    INSERT INTO public.usage_stats (user_id, generation_count, last_generation_at)
    VALUES (target_user_id, 1, now());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. INDEXING FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_meals_user_id ON public.saved_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON public.weekly_plans(user_id);
