-- AI CACHE OPTIMIZATION for Category-Based Reuse
-- This script adds indexes to make fuzzy matching (Age/Diet/Goal) lightning fast.

-- 1. Add indexes for category matching
CREATE INDEX IF NOT EXISTS idx_cache_categories 
ON public.ai_meal_cache (age_group, diet_type, meal_type, is_drink);

CREATE INDEX IF NOT EXISTS idx_cache_goal 
ON public.ai_meal_cache (goal);

-- 2. Add popularity sorting index
CREATE INDEX IF NOT EXISTS idx_cache_popularity 
ON public.ai_meal_cache (popularity_count DESC);

-- 3. Utility function to increment popularity
CREATE OR REPLACE FUNCTION public.increment_cache_popularity(target_hash text)
RETURNS void AS $$
BEGIN
    UPDATE public.ai_meal_cache 
    SET popularity_count = popularity_count + 1,
        last_accessed_at = now()
    WHERE input_hash = target_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
