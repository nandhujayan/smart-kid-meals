-- SUPREME SECURITY & AUTHENTICATION FIX
-- This script fixes 401 Unauthorized and RLS Violation errors for all core tables.

-- 1. Profiles Table Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
CREATE POLICY "Users can manage their own profiles" ON public.profiles
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Weekly Plans Table Security (Full Access)
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own weekly plans" ON public.weekly_plans;
CREATE POLICY "Users can manage their own weekly plans" ON public.weekly_plans
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Growth Logs Table Security
ALTER TABLE public.growth_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own growth logs" ON public.growth_logs;
CREATE POLICY "Users can manage their own growth logs" ON public.growth_logs
    FOR ALL USING (
        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- 4. Water Logs Table Security
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own water logs" ON public.water_logs;
CREATE POLICY "Users can manage their own water logs" ON public.water_logs
    FOR ALL USING (
        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- 5. Saved Meals Table Security
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own saved meals" ON public.saved_meals;
CREATE POLICY "Users can manage their own saved meals" ON public.saved_meals
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
