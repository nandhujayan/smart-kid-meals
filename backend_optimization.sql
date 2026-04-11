-- SCALABLE BACKEND OPTIMIZATION MIGRATION
-- This script adds caching and strict daily rate limiting to the Smart Kid Meals platform.

-- 1. UPDATE USAGE STATS FOR DAILY TRACKING
ALTER TABLE public.usage_stats 
ADD COLUMN IF NOT EXISTS daily_generation_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date date DEFAULT CURRENT_DATE;

-- 2. CREATE AI MEAL CACHE TABLE
CREATE TABLE IF NOT EXISTS public.ai_meal_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    input_hash text UNIQUE NOT NULL, -- Compact identifier for request parameters
    meal_data jsonb NOT NULL,        -- The full AI response object
    age_group text,
    diet_type text,
    meal_type text,
    popularity_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    goal text,
    is_drink boolean DEFAULT false
);

-- 3. ENABLE RLS ON CACHE
ALTER TABLE public.ai_meal_cache ENABLE ROW LEVEL SECURITY;

-- Cache is read-only for users (via the Edge Function), but we'll allow SELECT for authenticated users
CREATE POLICY "Users can view the global meal cache" ON public.ai_meal_cache
    FOR SELECT USING (true);

-- 4. IMPROVED INCREMENT FUNCTION WITH DAILY RESET
CREATE OR REPLACE FUNCTION public.increment_usage_v2(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    current_stats RECORD;
    today date := CURRENT_DATE;
    tier_name text;
    limit_reached boolean := false;
BEGIN
    -- 1. Get user tier
    SELECT tier INTO tier_name FROM public.user_subscriptions WHERE user_id = target_user_id;
    IF tier_name IS NULL THEN tier_name := 'free'; END IF;

    -- 2. Get current usage
    SELECT * INTO current_stats FROM public.usage_stats WHERE user_id = target_user_id;

    -- 3. Handle Daily Reset
    IF current_stats.last_reset_date < today THEN
        UPDATE public.usage_stats
        SET daily_generation_count = 0,
            last_reset_date = today,
            updated_at = now()
        WHERE user_id = target_user_id;
        current_stats.daily_generation_count := 0;
    END IF;

    -- 4. Check Limits (Free = 3, Pro = Unlimited/High)
    IF tier_name = 'free' AND current_stats.daily_generation_count >= 3 THEN
        limit_reached := true;
    END IF;

    -- 5. Increment if not reached
    IF NOT limit_reached THEN
        UPDATE public.usage_stats
        SET daily_generation_count = daily_generation_count + 1,
            generation_count = generation_count + 1,
            last_generation_at = now(),
            updated_at = now()
        WHERE user_id = target_user_id;
    END IF;

    RETURN jsonb_build_object(
        'limit_reached', limit_reached,
        'daily_count', CASE WHEN limit_reached THEN current_stats.daily_generation_count ELSE current_stats.daily_generation_count + 1 END,
        'tier', tier_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. COST CONTROL: API USAGE LOGGING
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    feature text,                    -- 'single-meal', 'weekly-plan', etc.
    model_name text DEFAULT 'gemini-2.0-flash',
    prompt_tokens integer,
    completion_tokens integer,
    is_cache_hit boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view full logs" ON public.api_usage_logs FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_subscriptions WHERE tier = 'admin' LIMIT 1)); -- Simplified admin check
CREATE POLICY "Users can see their own log counts" ON public.api_usage_logs FOR SELECT USING (auth.uid() = user_id);

-- 6. PERFORMANCE INDEXING
CREATE INDEX IF NOT EXISTS idx_cache_hash ON public.ai_meal_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_usage_reset ON public.usage_stats(last_reset_date);
