import { useState, useEffect } from "react";
import { Droplet, Plus, RotateCcw, GlassWater, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWaterIntake, saveWaterIntake, resetWaterIntake, type ChildProfile } from "@/lib/meal-data";
import { toast } from "sonner";

interface Props {
  activeProfile: ChildProfile | null;
}

const goals: Record<string, number> = {
  "6-12 months": 800,
  "1-2 years": 1000,
  "3-5 years": 1300,
  "6-10 years": 1700,
  "11+ years": 2200,
};

export default function WaterTracker({ activeProfile }: Props) {
  const [intake, setIntake] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const goal = activeProfile ? goals[activeProfile.age] || 1500 : 1500;
  const percentage = Math.min(100, Math.round((intake / goal) * 100));

  useEffect(() => {
    if (activeProfile) {
      const fetchIntake = async () => {
        const val = await getWaterIntake(activeProfile.id);
        setIntake(val);
        setIsLoading(false);
      };
      fetchIntake();
    }
  }, [activeProfile]);

  const handleAdd = async (amount: number) => {
    if (!activeProfile) {
      toast.error("Please select a child profile first!");
      return;
    }
    const next = intake + amount;
    setIntake(next);
    await saveWaterIntake(activeProfile.id, amount);
    
    if (next >= goal && intake < goal) {
      toast.success(`Way to go! ${activeProfile.name} reached the water goal! 💧✨`);
    } else {
      toast.info(`Added ${amount}ml. Keep going!`);
    }
  };

  const handleReset = async () => {
    if (!activeProfile) return;
    if (confirm("Reset today's water intake?")) {
      setIntake(0);
      await resetWaterIntake(activeProfile.id);
      toast.info("Intake reset");
    }
  };

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
        <div className="rounded-full bg-sky/10 p-4">
          <Droplet className="text-sky" size={32} />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">Hydration Tracker</h3>
          <p className="text-sm text-muted-foreground">Select a child to track their water intake</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-8 py-4">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-black text-foreground">Stay Hydrated! 💧</h3>
        <p className="text-sm font-bold text-muted-foreground">
          {activeProfile.name}'s daily goal: <span className="text-sky">{goal}ml</span>
        </p>
      </div>

      {/* Visual Water Container */}
      <div className="relative mx-auto flex h-72 w-48 flex-col items-center justify-end rounded-[3rem] border-8 border-muted bg-muted/20 p-2 shadow-inner overflow-hidden">
        {/* Dynamic Water Layer */}
        <div 
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-sky-500 via-sky-400 to-sky-300 transition-all duration-1000 ease-in-out shadow-[0_0_30px_rgba(56,189,248,0.5)]"
          style={{ height: `${percentage}%` }}
        >
          {/* Waves effect */}
          <div className="absolute -top-4 left-0 w-[200%] h-8 opacity-40">
            <div className="absolute top-0 left-0 w-1/2 h-full animate-[wave_3s_linear_infinite] opacity-50 bg-white/30 rounded-[100%]" />
            <div className="absolute top-0 left-1/4 w-1/2 h-full animate-[wave_5s_linear_infinite_reverse] bg-white/20 rounded-[100%]" />
          </div>
        </div>

        {/* Content Over the Water */}
        <div className="z-10 mb-10 flex flex-col items-center text-center">
          <span className={`text-4xl font-black transition-colors duration-500 ${percentage > 50 ? "text-white" : "text-sky"}`}>
            {percentage}%
          </span>
          <span className={`text-xs font-bold uppercase tracking-widest ${percentage > 50 ? "text-white/80" : "text-muted-foreground"}`}>
            {intake} / {goal} ml
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:justify-center">
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Button
            onClick={() => handleAdd(100)}
            className="h-14 flex-1 rounded-2xl bg-sky text-white shadow-lg shadow-sky/20 hover:bg-sky-600 sm:w-32 btn-press"
          >
            <Plus size={18} className="mr-1.5" /> 100ml
          </Button>
          <Button
            onClick={() => handleAdd(250)}
            className="h-14 flex-1 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky/20 hover:bg-sky-700 sm:w-32 btn-press"
          >
            <Plus size={18} className="mr-1.5" /> 250ml
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={handleReset}
          className="h-14 rounded-2xl border-2 border-muted text-muted-foreground hover:bg-muted sm:px-6 btn-press"
        >
          <RotateCcw size={18} className="mr-1.5" /> Reset
        </Button>
      </div>

      <div className="rounded-2xl bg-sky/5 p-4 text-center">
        <p className="text-xs font-bold text-sky-800 leading-relaxed">
          💡 Hydration helps {activeProfile.name} stay focused and energetic throughout the day!
        </p>
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
