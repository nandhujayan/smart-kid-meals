-- 1. Add user_id to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. Add user_id to saved_meals table
ALTER TABLE saved_meals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3. Add user_id to weekly_plans table
ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 4. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Profiles
CREATE POLICY "Users can create their own profiles." ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own profiles." ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles." ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profiles." ON profiles FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS Policies for Saved Meals
CREATE POLICY "Users can create their own saved meals." ON saved_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own saved meals." ON saved_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved meals." ON saved_meals FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS Policies for Weekly Plans
CREATE POLICY "Users can create their own weekly plans." ON weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own weekly plans." ON weekly_plans FOR SELECT USING (auth.uid() = user_id);

-- 8. Subscription Management (Mock table for now)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription." ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
