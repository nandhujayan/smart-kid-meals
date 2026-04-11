-- SQL Schema for Smart Kid Meals (Supabase / PostgreSQL)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age TEXT NOT NULL,
    diet TEXT NOT NULL,
    allergies TEXT[] DEFAULT '{}',
    goal TEXT NOT NULL,
    weight TEXT,
    height TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Saved Meals Table
CREATE TABLE IF NOT EXISTS public.saved_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_name TEXT NOT NULL,
    description TEXT,
    cooking_time TEXT,
    difficulty TEXT,
    ingredients JSONB DEFAULT '[]',
    steps TEXT[] DEFAULT '{}',
    tips TEXT[] DEFAULT '{}',
    meal_type TEXT,
    nutrition JSONB,
    grocery_list JSONB,
    alternatives JSONB,
    child_profile_name TEXT,
    is_ai BOOLEAN DEFAULT false,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Weekly Plans Table
CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    days JSONB NOT NULL, -- Array of DayPlan objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
