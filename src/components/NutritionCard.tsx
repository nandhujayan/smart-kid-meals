import { Apple, Flame, Wheat, Droplets, Pill } from "lucide-react";
import type { NutritionInfo } from "@/lib/meal-data";

interface Props {
  nutrition: NutritionInfo;
}

function NutrientBar({ label, value, max, unit, color, icon }: { label: string; value: number; max: number; unit: string; color: string; icon: React.ReactNode }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          {icon} {label}
        </span>
        <span className="text-xs font-extrabold text-foreground">{value}{unit}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function NutritionCard({ nutrition }: Props) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm border border-border space-y-4">
      <h3 className="font-extrabold text-foreground flex items-center gap-2">
        <Apple className="text-sage" size={20} /> Nutrition Details
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-peach-light p-3 text-center">
          <Flame className="mx-auto text-peach" size={20} />
          <p className="mt-1 text-lg font-extrabold text-foreground">{nutrition.calories}</p>
          <p className="text-xs font-bold text-muted-foreground">kcal</p>
        </div>
        <div className="rounded-xl bg-secondary p-3 text-center">
          <Pill className="mx-auto text-secondary-foreground" size={20} />
          <p className="mt-1 text-xs font-bold text-secondary-foreground leading-relaxed">{nutrition.vitamins}</p>
        </div>
      </div>

      <div className="space-y-3">
        <NutrientBar label="Protein" value={nutrition.protein} max={40} unit="g" color="bg-sky-foreground" icon={<Droplets size={12} className="text-sky-foreground" />} />
        <NutrientBar label="Carbs" value={nutrition.carbs} max={80} unit="g" color="bg-peach" icon={<Wheat size={12} className="text-peach" />} />
        <NutrientBar label="Fats" value={nutrition.fats} max={30} unit="g" color="bg-accent-foreground" icon={<Droplets size={12} className="text-accent-foreground" />} />
      </div>
    </div>
  );
}
