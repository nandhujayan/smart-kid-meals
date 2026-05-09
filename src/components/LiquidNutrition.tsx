import { useState, useEffect } from "react";
import { Apple, Milk, Banana, Zap, Clock, Sparkles, ChefHat, Info, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDrink, getPredefinedDrinks, type Drink, type ChildProfile } from "@/lib/meal-data";
import { toast } from "sonner";

interface Props {
  activeProfile: ChildProfile | null;
}

const categories = [
  { id: "Juice", label: "Juices", icon: <Apple className="text-orange-500" />, color: "bg-orange-50" },
  { id: "Milkshake", label: "Milkshakes", icon: <Milk className="text-blue-500" />, color: "bg-blue-50" },
  { id: "Smoothie", label: "Smoothies", icon: <Banana className="text-yellow-500" />, color: "bg-yellow-50" },
  { id: "High-calorie", label: "High-Calorie", icon: <Zap className="text-purple-500" />, color: "bg-purple-50" },
];

export default function LiquidNutrition({ activeProfile }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("Smoothie");
  const [drink, setDrink] = useState<Drink | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const predefinedDrinks = getPredefinedDrinks(selectedCategory);

  const handleGenerate = async () => {
    if (!activeProfile) {
      toast.error("Please select a child profile first!");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateDrink(selectedCategory, activeProfile.age, activeProfile.goal);
      setDrink(result);
      toast.success(`Generated a healthy ${selectedCategory} for ${activeProfile.name}!`);
    } catch (error) {
      toast.error("Failed to generate drink. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-6 py-4">
      <div className="space-y-1 text-center">
        <h3 className="text-2xl font-black text-foreground">Liquid Nutrition 🥤</h3>
        <p className="text-sm font-bold text-muted-foreground">Expert-crafted drinks for growing kids</p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-center">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all btn-press ${
              selectedCategory === cat.id
                ? `${cat.color} shadow-md scale-105`
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <div className={`p-2 rounded-xl bg-white shadow-sm`}>
              {cat.icon}
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider">{cat.label}</span>
          </button>
        ))}
      </div>

      {!drink && !isLoading ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 bg-muted/20 rounded-[2rem]">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {categories.find(c => c.id === selectedCategory)?.icon}
            </div>
            <div className="max-w-xs">
              <h4 className="text-lg font-black">{selectedCategory} Classics</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Choose a proven favorite or create a custom one with our AI Nutritionist!
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {predefinedDrinks.map((preDrink) => (
              <button
                key={preDrink.id}
                onClick={() => setDrink(preDrink)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {categories.find(c => c.id === selectedCategory)?.icon}
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{preDrink.drinkName}</h5>
                  <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                    {preDrink.calories} • {preDrink.prepTime}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-dashed border-muted-foreground/30"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Or</span>
            <div className="flex-grow border-t border-dashed border-muted-foreground/30"></div>
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full rounded-2xl h-14 bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <Sparkles size={18} className="mr-2" /> CREATE CUSTOM WITH AI
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-black animate-pulse">Consulting Child Nutritionist...</p>
        </div>
      ) : drink && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Drink Card */}
          <div className="overflow-hidden rounded-[2.5rem] bg-card shadow-xl">
            <div className={`p-6 ${categories.find(c => c.id === selectedCategory)?.color}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-foreground">{drink.drinkName}</h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Clock size={14} /> {drink.prepTime} • <Zap size={14} className="text-primary" /> {drink.calories}
                  </div>
                  {drink.costRank && (
                    <div className="mt-2 flex">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black shadow-sm ${
                        drink.costRank === 'Budget' ? 'bg-emerald-100 text-emerald-700' :
                        drink.costRank === 'Premium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {drink.costRank === 'Budget' ? '$' : drink.costRank === 'Premium' ? '$$$' : '$$'} {drink.costRank}
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center">
                   {categories.find(c => c.id === selectedCategory)?.icon}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Benefits */}
              <div className="flex flex-wrap gap-2">
                {drink.benefits.map((benefit, i) => (
                  <span key={i} className="rounded-lg bg-primary/5 px-2.5 py-1 text-[10px] font-black text-primary uppercase border border-primary/10">
                    ✨ {benefit}
                  </span>
                ))}
              </div>

              {drink.insight && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="text-primary" size={16} />
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-primary">Nutrition Insight</h4>
                  </div>
                  <p className="text-xs font-bold text-foreground/80 leading-relaxed italic">
                    "{drink.insight}"
                  </p>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                 {/* Ingredients */}
                <div className="space-y-3">
                  <h5 className="flex items-center gap-2 text-sm font-black text-foreground">
                    <Info size={16} className="text-sky" /> Ingredients
                  </h5>
                  <ul className="space-y-2">
                    {drink.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-sky/40" /> {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <h5 className="flex items-center gap-2 text-sm font-black text-foreground">
                    <ChefHat size={16} className="text-peach" /> Preparation
                  </h5>
                  <ol className="space-y-3">
                    {drink.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium text-muted-foreground leading-relaxed">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-peach/10 text-[10px] font-black text-peach">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {drink.kidActivity && (
                <div className="overflow-hidden rounded-2xl border-2 border-dashed border-peach/30 bg-peach-light/30 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-peach rounded-lg p-1.5 text-white">
                      <ChefHat size={16} />
                    </div>
                    <p className="text-xs font-extrabold text-foreground">Mini Chef Opportunity</p>
                  </div>
                  <p className="text-xs font-semibold text-foreground/70 leading-relaxed">
                    <strong className="text-peach">Activity:</strong> {drink.kidActivity}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-dashed flex gap-3">
                  <Button
                    onClick={() => {
                      setDrink(null);
                      handleGenerate();
                    }}
                    variant="outline"
                    className="flex-1 rounded-xl h-12 font-bold text-xs"
                  >
                    <Sparkles size={14} className="mr-2" /> Generate AI
                  </Button>
                  <Button
                    onClick={() => setDrink(null)}
                    variant="ghost"
                    className="rounded-xl h-12 font-bold text-xs text-muted-foreground"
                  >
                    <RotateCcw size={14} className="mr-2" /> Categories
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
