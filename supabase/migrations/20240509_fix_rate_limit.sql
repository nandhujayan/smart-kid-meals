-- Fix 1: Reset usage counter for all users (run during development)
UPDATE public.usage_stats
SET generation_count = 0,
    last_generation_at = NULL;

-- Fix 2: Replace increment_usage_v2 with a higher free-tier daily limit (50 instead of default low limit)
CREATE OR REPLACE FUNCTION public.increment_usage_v2(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count      int;
  v_tier       text;
  v_free_limit int := 50;   -- raise from default to 50/day for free users
  v_today      date := current_date;
BEGIN
  -- Upsert usage row, resetting counter daily
  INSERT INTO public.usage_stats (user_id, generation_count, last_generation_at)
  VALUES (target_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET generation_count = CASE
          WHEN date(public.usage_stats.last_generation_at) < v_today THEN 1
          ELSE public.usage_stats.generation_count + 1
        END,
        last_generation_at = now();

  -- Read back updated count
  SELECT generation_count INTO v_count
  FROM public.usage_stats
  WHERE user_id = target_user_id;

  -- Check subscription tier
  SELECT COALESCE(tier, 'free') INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = target_user_id;

  v_tier := COALESCE(v_tier, 'free');

  -- Pro users: unlimited
  IF v_tier = 'pro' THEN
    RETURN jsonb_build_object('limit_reached', false, 'count', v_count, 'tier', v_tier);
  END IF;

  -- Free users: enforce daily limit
  IF v_count > v_free_limit THEN
    RETURN jsonb_build_object('limit_reached', true, 'count', v_count, 'tier', v_tier);
  END IF;

  RETURN jsonb_build_object('limit_reached', false, 'count', v_count, 'tier', v_tier);
END;
$$;

-- Fix 3: Ensure usage_stats table has the right structure
CREATE TABLE IF NOT EXISTS public.usage_stats (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_count    int NOT NULL DEFAULT 0,
  last_generation_at  timestamptz
);

-- Fix 4: Ensure user_subscriptions table exists (fixes the 404 in useAuth.tsx)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier       text NOT NULL DEFAULT 'free',
  status     text NOT NULL DEFAULT 'active',
  expires_at timestamptz
);

-- Allow authenticated users to read their own rows
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own usage"
  ON public.usage_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can read own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
