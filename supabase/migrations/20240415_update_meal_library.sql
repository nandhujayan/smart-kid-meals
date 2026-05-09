-- Migration: Add ingredient_tags to meal_library for smart filtering
-- Date: 2024-04-15

-- 1. Add the column
ALTER TABLE public.meal_library 
ADD COLUMN IF NOT EXISTS ingredient_tags text[];

-- 2. Create GIN index for fast array matching
CREATE INDEX IF NOT EXISTS idx_meal_library_ingredient_tags ON public.meal_library USING GIN (ingredient_tags);

-- 3. Comment for documentation
COMMENT ON COLUMN public.meal_library.ingredient_tags IS 'Array of clean ingredient names for fast searching and allergy filtering.';

-- 4. Fast library search (Edge Function calls via PostgREST /rpc)
--    - Filters out meals that overlap with allergies
--    - Optionally requires overlap with available ingredients (if provided)
--    - Orders by overlap score (desc), then random tie-break
CREATE OR REPLACE FUNCTION public.find_meal_in_library(
  p_age_group text,
  p_diet_type text,
  p_meal_type text,
  p_goal text,
  p_allergies text[] DEFAULT '{}'::text[],
  p_available_ingredients text[] DEFAULT '{}'::text[],
  p_require_available_match boolean DEFAULT false,
  p_limit int DEFAULT 1
)
RETURNS TABLE (
  meal_data jsonb,
  meal_name text,
  ingredient_tags text[]
)
LANGUAGE sql
STABLE
AS $$
  WITH params AS (
    SELECT
      NULLIF(array_remove(p_allergies, ''), '{}'::text[]) AS allergies,
      NULLIF(array_remove(p_available_ingredients, ''), '{}'::text[]) AS avail
  )
  SELECT
    ml.meal_data,
    ml.meal_name,
    ml.ingredient_tags
  FROM public.meal_library ml
  CROSS JOIN params p
  WHERE ml.age_group = p_age_group
    AND ml.diet_type = p_diet_type
    AND ml.meal_type = p_meal_type
    AND ml.goal = p_goal
    AND (
      p.allergies IS NULL
      OR NOT (COALESCE(ml.ingredient_tags, '{}'::text[]) && p.allergies)
    )
    AND (
      p.avail IS NULL
      OR NOT p_require_available_match
      OR (COALESCE(ml.ingredient_tags, '{}'::text[]) && p.avail)
    )
  ORDER BY
    CASE
      WHEN p.avail IS NULL THEN 0
      ELSE cardinality(
        ARRAY(
          SELECT unnest(COALESCE(ml.ingredient_tags, '{}'::text[]))
          INTERSECT
          SELECT unnest(p.avail)
        )
      )
    END DESC,
    random()
  LIMIT GREATEST(p_limit, 1);
$$;
