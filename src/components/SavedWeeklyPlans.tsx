import { Trash2, Calendar, ChevronRight, BookmarkX, Play } from "lucide-react";
import { getSavedWeeklyPlans, removeWeeklyPlan, type DayPlan } from "@/lib/meal-data";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Props {
  onLoad: (plan: DayPlan[]) => void;
}

export default function SavedWeeklyPlans({ onLoad }: Props) {
  const [plans, setPlans] = useState<{id: string, days: DayPlan[], created_at: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = async () => {
    setIsLoading(true);
    const data = await getSavedWeeklyPlans();
    setPlans(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeWeeklyPlan(id);
    fetchPlans();
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching your plans...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="animate-slide-up flex flex-col items-center gap-3 py-12 text-center">
        <BookmarkX className="text-muted-foreground" size={40} />
        <p className="font-bold text-muted-foreground text-lg italic">No saved plans yet</p>
        <p className="max-w-[200px] text-xs text-muted-foreground/70 font-semibold">
          Create a 7-day meal journey and save it to access it here anytime!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan, i) => (
        <div
          key={plan.id}
          className={`animate-slide-up-delay-${Math.min(i + 1, 4)} group relative overflow-hidden rounded-[2rem] border-2 border-muted/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-xl`}
        >
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Calendar size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-foreground">
                  7-Day Healthy Journey
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {format(new Date(plan.created_at), "PPP")}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[9px] font-bold text-muted-foreground border border-border">
                    {plan.days.length} Days
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700 border border-emerald-200">
                    COMPLETE
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => handleRemove(plan.id, e)}
              className="rounded-xl p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="mt-6 flex gap-3">
             <Button
                onClick={() => onLoad(plan.days)}
                className="flex-1 rounded-2xl h-11 text-xs font-black shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
              >
                <Play size={16} className="mr-2" /> LOAD PLAN
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl h-11 px-4 border-2"
                onClick={() => onLoad(plan.days)}
              >
                <ChevronRight size={18} />
              </Button>
          </div>

          {/* Decorative background number */}
          <div className="absolute -bottom-4 -right-2 text-8xl font-black text-muted/5 select-none font-sans">
            0{i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
