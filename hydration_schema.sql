--- SQL SNIPPET FOR WATER TRACKING ---
--- Execute this in your Supabase SQL Editor ---

-- 1. Create the water_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- amount in ml
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Note: This policy assumes the 'profiles' table has a 'user_id' column linked to auth.users
CREATE POLICY "Users can manage water logs for their own profiles"
ON public.water_logs
FOR ALL
USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- 4. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_water_logs_profile_id ON public.water_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_logged_at ON public.water_logs(logged_at);
