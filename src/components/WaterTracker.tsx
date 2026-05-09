import { useState, useEffect } from "react";
import { Droplet, Plus, Minus, RotateCcw, Milk } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWaterIntake, saveWaterIntake, resetWaterIntake, type ChildProfile } from "@/lib/meal-data";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props { activeProfile: ChildProfile | null; }

const goals: Record<string, number> = {
  "6-12 months": 900,   // Primarily milk
  "1-2 years": 1100,    // Water + Milk
  "3-5 years": 1400,    // Active toddler
  "6-10 years": 1800,   // Growing child
  "11+ years": 2400,    // Pre-teen/Teen
};

export default function WaterTracker({ activeProfile }: Props) {
  const [intake, setIntake] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const today = format(new Date(), "EEEE, MMMM d");

  const goal = activeProfile ? goals[activeProfile.age] || 1500 : 1500;
  const isBaby = activeProfile?.age === "6-12 months";
  const percentage = Math.min(100, Math.round((intake / goal) * 100));

  const liquidName = isBaby ? "Milk" : "Water";
  const liquidEmoji = isBaby ? "🍼" : "💧";
  const liquidColor = isBaby ? "from-orange-100 via-orange-50 to-white" : "from-sky-500 via-sky-400 to-sky-300";
  const liquidShadow = isBaby ? "shadow-[0_0_30px_rgba(255,247,237,0.8)]" : "shadow-[0_0_30px_rgba(56,189,248,0.5)]";
  const liquidIcon = isBaby ? <Milk className="text-orange-400" size={32} /> : <Droplet className="text-sky" size={32} />;
  const liquidBtnColor = isBaby ? "bg-orange-400 hover:bg-orange-500 shadow-orange-200" : "bg-sky hover:bg-sky-600 shadow-sky-200";
  const liquidLabelColor = isBaby ? "text-orange-600" : "text-sky";

  useEffect(() => {
    if (activeProfile) {
      setIsLoading(true);
      getWaterIntake(activeProfile.id).then(val => {
        setIntake(val);
        setIsLoading(false);
      });
    }
  }, [activeProfile]);

  const handleAdd = async (amount: number) => {
    if (!activeProfile) { toast.error("Please select a child profile first!"); return; }
    const next = intake + amount;
    setIntake(next);
    await saveWaterIntake(activeProfile.id, amount);
    if (next >= goal && intake < goal) {
      toast.success(`Way to go! ${activeProfile.name} reached the ${liquidName.toLowerCase()} goal! ${liquidEmoji}✨`);
    } else {
      toast.info(`Added ${amount}ml of ${liquidName.toLowerCase()}. Keep going!`);
    }
  };

  const handleSubtract = async (amount: number) => {
    if (!activeProfile) { toast.error("Please select a child profile first!"); return; }
    if (intake <= 0) return;
    
    const next = Math.max(0, intake - amount);
    setIntake(next);
    await saveWaterIntake(activeProfile.id, -amount);
    toast.info(`Reduced ${amount}ml. Oops!`);
  };

  const handleConfirmReset = async () => {
    if (!activeProfile) return;
    setIntake(0);
    await resetWaterIntake(activeProfile.id);
    setShowResetDialog(false);
    toast.info("Intake reset for today");
  };

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
        <div className="rounded-full bg-sky/10 p-4"><Droplet className="text-sky" size={32} /></div>
        <div>
          <h3 className="text-lg font-black text-foreground">Liquid Intake Tracker</h3>
          <p className="text-sm text-muted-foreground">Select a child to track their intake</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-8 py-4">
      <div className="space-y-1 text-center">
        <h3 className="text-2xl font-black text-foreground">
          {isBaby ? "Milk Time! 🍼" : "Stay Hydrated! 💧"}
        </h3>
        <p className="text-sm font-bold text-muted-foreground">
          {activeProfile.name}'s daily goal: <span className={liquidLabelColor}>{goal}ml</span>
        </p>
        <p className="text-xs text-muted-foreground/60 font-semibold">Tracking for {today}</p>
      </div>

      {/* Visual Water/Milk Container */}
      <div className="relative mx-auto flex h-72 w-48 flex-col items-center justify-end rounded-[3rem] bg-muted/20 p-2 shadow-inner overflow-hidden ring-4 ring-muted/30">
        <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${liquidColor} transition-all duration-1000 ease-in-out ${liquidShadow}`}
          style={{ height: `${percentage}%` }}>
          <div className="absolute -top-4 left-0 w-[200%] h-8 opacity-40">
            <div className="absolute top-0 left-0 w-1/2 h-full animate-[wave_3s_linear_infinite] opacity-50 bg-white/30 rounded-[100%]" />
            <div className="absolute top-0 left-1/4 w-1/2 h-full animate-[wave_5s_linear_infinite_reverse] bg-white/20 rounded-[100%]" />
          </div>
        </div>
        <div className="z-10 mb-10 flex flex-col items-center text-center">
          <span className={`text-4xl font-black transition-colors duration-500 ${percentage > 50 && !isBaby ? "text-white" : "text-foreground"}`}>{percentage}%</span>
          <span className={`text-xs font-bold uppercase tracking-widest ${percentage > 50 && !isBaby ? "text-white/80" : "text-muted-foreground"}`}>{intake} / {goal} ml</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:justify-center">
        <div className="grid grid-cols-3 gap-3 sm:flex">
          <div className="flex flex-col gap-2 flex-1">
            <Button onClick={() => handleAdd(100)} className={`h-14 w-full rounded-2xl text-white shadow-lg btn-press ${liquidBtnColor}`}>
              <Plus size={18} className="mr-1" /> 100ml
            </Button>
            <Button variant="ghost" onClick={() => handleSubtract(100)} className="h-8 w-full rounded-xl text-[10px] font-black text-muted-foreground/50 hover:text-destructive transition-all">
              <Minus size={12} className="mr-1" /> 100ml
            </Button>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <Button onClick={() => handleAdd(200)} className={`h-14 w-full rounded-2xl text-white shadow-lg btn-press ${liquidBtnColor} brightness-95`}>
              <Plus size={18} className="mr-1" /> 200ml
            </Button>
            <Button variant="ghost" onClick={() => handleSubtract(200)} className="h-8 w-full rounded-xl text-[10px] font-black text-muted-foreground/50 hover:text-destructive transition-all">
              <Minus size={12} className="mr-1" /> 200ml
            </Button>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <Button onClick={() => handleAdd(300)} className={`h-14 w-full rounded-2xl text-white shadow-lg btn-press ${liquidBtnColor} brightness-90`}>
              <Plus size={18} className="mr-1" /> 300ml
            </Button>
            <Button variant="ghost" onClick={() => handleSubtract(300)} className="h-8 w-full rounded-xl text-[10px] font-black text-muted-foreground/50 hover:text-destructive transition-all">
              <Minus size={12} className="mr-1" /> 300ml
            </Button>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setShowResetDialog(true)} className="h-14 rounded-2xl text-muted-foreground hover:bg-muted sm:px-6 btn-press self-start">
          <RotateCcw size={18} className="mr-1.5" /> Reset
        </Button>
      </div>

      <div className={`rounded-2xl p-4 text-center ${isBaby ? "bg-orange-50/50" : "bg-sky/5"}`}>
        <p className={`text-xs font-bold leading-relaxed ${isBaby ? "text-orange-800" : "text-sky-800"}`}>
          💡 {isBaby ? `Milk provides essential nutrients for ${activeProfile.name}'s growth and brain development!` : `Hydration helps ${activeProfile.name} stay focused and energetic throughout the day!`}
        </p>
      </div>

      {/* Reset confirmation dialog — replaces native confirm() */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Today's Water Intake?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all water intake logged for {activeProfile.name} today ({today}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className={`rounded-xl text-white ${isBaby ? "bg-orange-500 hover:bg-orange-600" : "bg-sky hover:bg-sky-600"}`}>
              Yes, Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
