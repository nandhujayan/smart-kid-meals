-- SEEDING COMMON MEALS FOR INSTANT CACHE HITS
-- This script pre-populates the cache with common requests to minimize AI API calls.

-- Helper: Generate input_hash in SQL if needed, but here we provide pre-generated hashes for standard combinations.

-- 1. Breakfast for 3-5 years, Standard, No Allergies, Growth
INSERT INTO public.ai_meal_cache (input_hash, age_group, diet_type, meal_type, meal_data)
VALUES (
    '3-5-standard-none-growth-breakfast',
    '3-5 years',
    'Standard',
    'breakfast',
    '{
        "mealName": "Fruity Oatmeal Power Bowl",
        "description": "Creamy oats topped with fresh berries and crushed walnuts.",
        "cookingTime": "10 min",
        "difficulty": "Easy",
        "ingredients": [
            {"name": "Rolled oats", "quantity": "1/2 cup"},
            {"name": "Milk or water", "quantity": "1 cup"},
            {"name": "Blueberries", "quantity": "1/4 cup"},
            {"name": "Honey or Maple syrup", "quantity": "1 tsp"}
        ],
        "steps": [
            "Combine oats and liquid in a pot.",
            "Cook on medium heat for 5 minutes until thickened.",
            "Top with berries and a drizzle of honey.",
            "Serve warm."
        ],
        "nutrition": {"calories": 210, "protein": 6, "carbs": 35, "fats": 5, "vitamins": "A, C, Fiber"},
        "tips": ["Rich in fiber for long-lasting morning energy."],
        "alternatives": [{"mealName": "Yogurt Parfait", "reason": "Cold alternative with similar nutrition."}]
    }'
) ON CONFLICT (input_hash) DO NOTHING;

-- 2. Lunch for 6-12 years, Vegetarian, No Allergies, Balanced
INSERT INTO public.ai_meal_cache (input_hash, age_group, diet_type, meal_type, meal_data)
VALUES (
    '6-12-vegetarian-none-balanced-lunch',
    '6-12 years',
    'Vegetarian',
    'lunch',
    '{
        "mealName": "Chickpea Salad Wrap",
        "description": "Mashed chickpeas with light mayo and veggies in a whole grain wrap.",
        "cookingTime": "15 min",
        "difficulty": "Easy",
        "ingredients": [
            {"name": "Canned chickpeas (drained)", "quantity": "1 cup"},
            {"name": "Whole wheat wrap", "quantity": "1 piece"},
            {"name": "Cucumber (diced)", "quantity": "2 tbsp"},
            {"name": "Greek yogurt or mayo", "quantity": "1 tbsp"}
        ],
        "steps": [
            "Mash chickpeas in a bowl with yogurt/mayo.",
            "Stir in diced cucumbers and a pinch of salt.",
            "Spread mixture onto the wrap.",
            "Roll up tightly and cut in half."
        ],
        "nutrition": {"calories": 320, "protein": 14, "carbs": 42, "fats": 9, "vitamins": "Iron, Magnesium"},
        "tips": ["Chickpeas are a great plant-based protein source for school lunches."],
        "alternatives": [{"mealName": "Lentil Soup", "reason": "Hot vegetarian option."}]
    }'
) ON CONFLICT (input_hash) DO NOTHING;

-- 3. Dinner for 3-5 years, Standard, No Allergies, Growth
INSERT INTO public.ai_meal_cache (input_hash, age_group, diet_type, meal_type, meal_data)
VALUES (
    '3-5-standard-none-growth-dinner',
    '3-5 years',
    'Standard',
    'dinner',
    '{
        "mealName": "Soft Salmon & Steamed Peas",
        "description": "Flaky oven-baked salmon served with sweet peas and mashed potatoes.",
        "cookingTime": "20 min",
        "difficulty": "Intermediate",
        "ingredients": [
            {"name": "Salmon fillet", "quantity": "3 oz"},
            {"name": "Frozen peas", "quantity": "1/4 cup"},
            {"name": "Potato", "quantity": "1 medium"}
        ],
        "steps": [
            "Boil and mash the potato.",
            "Bake salmon at 400°F (200°C) for 12-15 minutes.",
            "Steam peas for 3 minutes.",
            "Flake the salmon carefully to ensure no bones.",
            "Plate with mash and peas."
        ],
        "nutrition": {"calories": 250, "protein": 18, "carbs": 22, "fats": 10, "vitamins": "Omega-3, D, B12"},
        "tips": ["Omega-3 fats in salmon are essential for cognitive development."],
        "alternatives": [{"mealName": "Baked Cod", "reason": "Milder white fish option."}]
    }'
) ON CONFLICT (input_hash) DO NOTHING;
