import { useState } from "react";
import { CookingPot, Bookmark, Calendar, Users, Bell, BellOff } from "lucide-react";
import MealForm from "@/components/MealForm";
import MealResult from "@/components/MealResult";
import SavedMeals from "@/components/SavedMeals";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import ChildProfiles from "@/components/ChildProfiles";
import {
  generateMeal, generateWeeklyPlan,
  getNotificationSetting, setNotificationSetting,
  type Meal, type MealForm as MealFormType, type DayPlan, type ChildProfile,
} from "@/lib/meal-data";
import { toast } from "sonner";

type Tab = "generate" | "weekly" | "saved" | "profiles";
type View = "tabs" | "result" | "weekly-view";

export default function Index() {
  const [tab, setTab] = useState<Tab>("generate");
  const [view, setView] = useState<View>("tabs");
  const [meal, setMeal] = useState<Meal | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [notifications, setNotifications] = useState(getNotificationSetting());
  const [lastForm, setLastForm] = useState<MealFormType | null>(null);

  const handleGenerate = (form: MealFormType) => {
    setIsLoading(true);
    setLastForm(form);
    setTimeout(() => {
      const result = generateMeal(form);
      setMeal(result);
      setView("result");
      setIsLoading(false);
    }, 1200);
  };

  const handleGenerateWeekly = (form: MealFormType) => {
    setIsLoading(true);
    setLastForm(form);
    setTimeout(() => {
      const plan = generateWeeklyPlan(form);
      setWeeklyPlan(plan);
      setView("weekly-view");
      setIsLoading(false);
    }, 1500);
  };

  const handleBack = () => setView("tabs");
  const handleSelectSaved = (m: Meal) => { setMeal(m); setView("result"); };
  const handleWeeklyMealView = (m: Meal) => { setMeal(m); setView("result"); };
  const handleViewMeal = (m: Meal) => { setMeal(m); };

  const handleToggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    setNotificationSetting(next);
    toast.success(next ? "Daily reminders enabled 🔔" : "Reminders turned off");
  };

  const handleSelectProfile = (profile: ChildProfile) => {
    setActiveProfile(profile);
    toast.success(`Switched to ${profile.name}`);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* Header */}
      <header className="animate-slide-up sticky top-0 z-10 bg-background/80 backdrop-blur-md px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach-light">
              <CookingPot className="text-peach" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight text-foreground">Smart Kids Meal AI</h1>
              <p className="text-xs text-muted-foreground">
                {activeProfile ? `👶 ${activeProfile.name}` : "Healthy meals made easy ✨"}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition-colors btn-press"
            title={notifications ? "Disable reminders" : "Enable reminders"}
          >
            {notifications ? <Bell className="text-peach" size={20} /> : <BellOff size={20} />}
          </button>
        </div>

        {/* Tabs */}
        {view === "tabs" && (
          <div className="mt-3 flex gap-1 rounded-2xl bg-muted p-1">
            <TabBtn active={tab === "generate"} onClick={() => setTab("generate")} icon={<CookingPot size={14} />} label="Meal" />
            <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")} icon={<Calendar size={14} />} label="Weekly" />
            <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark size={14} />} label="Saved" />
            <TabBtn active={tab === "profiles"} onClick={() => setTab("profiles")} icon={<Users size={14} />} label="Kids" />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pb-8 pt-2">
        {view === "result" && meal ? (
          <MealResult
            meal={meal}
            onBack={handleBack}
            lastForm={lastForm}
            activeProfileName={activeProfile?.name}
            onViewMeal={handleViewMeal}
          />
        ) : view === "weekly-view" && weeklyPlan ? (
          <WeeklyPlanner plan={weeklyPlan} onViewMeal={handleWeeklyMealView} onBack={handleBack} />
        ) : tab === "generate" ? (
          <MealForm onGenerate={handleGenerate} onGenerateWeekly={handleGenerateWeekly} isLoading={isLoading} activeProfile={activeProfile} />
        ) : tab === "weekly" ? (
          <MealForm onGenerate={handleGenerate} onGenerateWeekly={handleGenerateWeekly} isLoading={isLoading} activeProfile={activeProfile} weeklyMode />
        ) : tab === "saved" ? (
          <SavedMeals onSelect={handleSelectSaved} />
        ) : (
          <ChildProfiles activeProfileId={activeProfile?.id ?? null} onSelect={handleSelectProfile} />
        )}
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all btn-press ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}
