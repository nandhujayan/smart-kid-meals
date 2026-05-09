-- FIX: 401 UNAUTHORIZED ERRORS & MISSING POLICIES
-- Execute this once in your Supabase SQL Editor.

-- 1. Weekly Plans Security
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own weekly plans" ON public.weekly_plans;
CREATE POLICY "Users can manage their own weekly plans" ON public.weekly_plans
    FOR ALL USING (auth.uid() = user_id);

-- 2. Growth Logs Security
CREATE TABLE IF NOT EXISTS public.growth_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight numeric,
    height numeric,
    logged_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.growth_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage growth logs for their own profiles" ON public.growth_logs;
CREATE POLICY "Users can manage growth logs for their own profiles" ON public.growth_logs
    FOR ALL USING (
        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- 3. Water Logs Security (Robust Check)
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage water logs for their own profiles" ON public.water_logs;
CREATE POLICY "Users can manage water logs for their own profiles" ON public.water_logs
    FOR ALL USING (
        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );
