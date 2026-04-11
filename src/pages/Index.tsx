import { useState, useEffect } from "react";
import { CookingPot, Bookmark, Calendar, Users, Bell, BellOff, Droplet, ChevronDown, Plus, Milk } from "lucide-react";
import MealForm from "@/components/MealForm";
import MealResult from "@/components/MealResult";
import SavedMeals from "@/components/SavedMeals";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import AuthModal from "@/components/AuthModal";
import Pricing from "@/components/Pricing";
import ChildProfiles from "@/components/ChildProfiles";
import WaterTracker from "@/components/WaterTracker";
import LiquidNutrition from "@/components/LiquidNutrition";
import ThemePicker from "@/components/ThemePicker";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Sparkles, Star } from "lucide-react";
import {
  generateMeal, generateWeeklyPlan,
  getNotificationSetting, setNotificationSetting,
  getSavedWeeklyPlan, saveWeeklyPlan,
  getChildProfiles, migrateLocalData,
  type Meal, type MealForm as MealFormType, type DayPlan, type ChildProfile,
} from "@/lib/meal-data";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "generate" | "weekly" | "water" | "liquid" | "saved" | "profiles";
type View = "tabs" | "result" | "weekly-view";

export default function Index() {
  const [tab, setTab] = useState<Tab>("generate");
  const [view, setView] = useState<View>("tabs");
  const [meal, setMeal] = useState<Meal | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);

  useEffect(() => {
    const loadSaved = async () => {
      const plan = await getSavedWeeklyPlan();
      if (plan) setWeeklyPlan(plan);
      
      const projs = await getChildProfiles();
      setProfiles(projs);
      if (projs.length > 0 && !activeProfile) {
        setActiveProfile(projs[0]);
      }
    };
    loadSaved();
  }, []);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const runMigration = async () => {
        // If guest limit was reached, show pricing after login
        if (getGuestGenerations() >= 3) {
          setIsPricingModalOpen(true);
        }

        toast.promise(migrateLocalData(), {
          loading: 'Syncing your local data to cloud...',
          success: 'Data synced successfully! ☁️',
          error: 'Failed to sync some data.',
        });

        // Refresh profiles after migration
        const plan = await getSavedWeeklyPlan();
        if (plan) setWeeklyPlan(plan);
        const projs = await getChildProfiles();
        setProfiles(projs);
      };
      runMigration();
    }
  }, [user]);

  const [notifications, setNotifications] = useState(getNotificationSetting());
  const [lastForm, setLastForm] = useState<MealFormType | null>(null);
  const [isFromWeekly, setIsFromWeekly] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ dayIndex: number; mealType: string } | null>(null);

  // Auth & Pricing Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({ title: "", description: "" });

  const { signOut } = useAuth();

  const getGuestGenerations = () => {
    return parseInt(localStorage.getItem("smartkids-guest-gens") || "0");
  };

  const incrementGuestGenerations = () => {
    localStorage.setItem("smartkids-guest-gens", (getGuestGenerations() + 1).toString());
  };

  const checkAuthAndUsage = (action: string) => {
    if (!user) {
      if (action === "generate" && getGuestGenerations() >= 3) {
        setAuthModalConfig({
          title: "Meal Limit Reached",
          description: "You've used your 3 free generations. Sign in to get unlimited AI meal plans!"
        });
        setIsAuthModalOpen(true);
        return false;
      }
      if (action === "save" || action === "profiles") {
        setAuthModalConfig({
          title: "Sign In Required",
          description: `Please sign in to ${action === "save" ? "save meals" : "manage child profiles"}.`
        });
        setIsAuthModalOpen(true);
        return false;
      }
    }
    return true;
  };

  const handleGenerate = async (form: MealFormType) => {
    if (!checkAuthAndUsage("generate")) return;

    setIsLoading(true);
    setLastForm(form);
    try {
      const result = await generateMeal(form);
      setMeal(result);
      setView("result");
      if (!user) incrementGuestGenerations();
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate meal. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWeekly = async (form: MealFormType) => {
    if (!checkAuthAndUsage("generate")) return;

    setIsLoading(true);
    setLastForm(form);
    try {
      const plan = await generateWeeklyPlan(form);
      setWeeklyPlan(plan);
      await saveWeeklyPlan(plan);
      setView("weekly-view");
      if (!user) incrementGuestGenerations();
      toast.success("Weekly plan generated and saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate weekly plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (view === "result" && isFromWeekly && weeklyPlan) {
      setView("weekly-view");
      setIsFromWeekly(false);
      setActiveSlot(null);
    } else {
      setView("tabs");
      setMeal(null);
      setActiveSlot(null);
    }
  };

  const handleSelectSaved = (m: Meal) => {
    setMeal(m);
    setView("result");
    setIsFromWeekly(false);
    setActiveSlot(null);
  };

  const handleWeeklyMealView = (m: Meal, dayIndex?: number, mealType?: string) => {
    setMeal(m);
    setView("result");
    setIsFromWeekly(true);
    if (dayIndex !== undefined && mealType !== undefined) {
      setActiveSlot({ dayIndex, mealType });
    }
  };

  const handleUpdateMeal = (newMeal: Meal) => {
    setMeal(newMeal);
    if (!user) incrementGuestGenerations();

    if (isFromWeekly && weeklyPlan && activeSlot) {
      const nextPlan = [...weeklyPlan];
      const day = nextPlan[activeSlot.dayIndex];
      if (activeSlot.mealType === "breakfast") day.breakfast = newMeal;
      else if (activeSlot.mealType === "lunch") day.lunch = newMeal;
      else if (activeSlot.mealType === "dinner") day.dinner = newMeal;
      setWeeklyPlan(nextPlan);
      saveWeeklyPlan(nextPlan);
    }
  };

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
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-background shadow-xl border-x overflow-x-hidden">
      <LoadingOverlay isVisible={isLoading} formData={lastForm} />

      {/* Header */}
      <header className="animate-slide-up sticky top-0 z-10 bg-background/80 backdrop-blur-md px-5 pt-5 pb-2">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach-light">
                <CookingPot className="text-peach" size={22} />
              </div>

              {/* Quick Child Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col text-left group transition-all btn-press focus:outline-none">
                    <h1 className="text-sm font-black leading-none text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                      Moms Kitchen <ChevronDown size={14} className="text-muted-foreground group-hover:text-primary" />
                    </h1>
                    <p className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                      {activeProfile ? `👶 ${activeProfile.name}` : "Switch Child"}
                    </p>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur-lg">
                  <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-3 py-2">Select Kid</DropdownMenuLabel>
                  {profiles.map(p => (
                    <DropdownMenuItem 
                      key={p.id} 
                      onClick={() => handleSelectProfile(p)}
                      className={`rounded-xl px-3 py-2.5 mb-1 cursor-pointer transition-all ${activeProfile?.id === p.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted font-medium"}`}
                    >
                      <span className="mr-2">👶</span> {p.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => { setTab("profiles"); }}
                    className="rounded-xl px-3 py-2.5 font-bold text-sky hover:bg-sky/10 cursor-pointer"
                  >
                    <Plus size={14} className="mr-2" /> Manage Kids
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              {!user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 rounded-xl font-bold bg-sky/10 text-sky-foreground hover:bg-sky/20"
                    onClick={() => setIsPricingModalOpen(true)}
                  >
                    <Sparkles size={14} className="mr-1" /> Pro
                  </Button>
                  <button
                    onClick={signOut}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
              <ThemePicker />
              <button
                onClick={handleToggleNotifications}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition-colors btn-press"
                title={notifications ? "Disable reminders" : "Enable reminders"}
              >
                {notifications ? <Bell className="text-peach" size={20} /> : <BellOff size={20} />}
              </button>
            </div>
          </div>

          {/* Tabs */}
          {view === "tabs" && (
            <div className="mt-4 flex gap-1 rounded-2xl bg-muted p-1">
              <TabBtn active={tab === "generate"} onClick={() => setTab("generate")} icon={<CookingPot size={14} />} label="Meal" />
              <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")} icon={<Calendar size={14} />} label="Weekly" />
              <TabBtn active={tab === "water"} onClick={() => setTab("water")} icon={<Droplet size={14} />} label="Water" />
              <TabBtn active={tab === "liquid"} onClick={() => setTab("liquid")} icon={<Milk size={14} />} label="Drinks" />
              <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark size={14} />} label="Saved" />
              <TabBtn active={tab === "profiles"} onClick={() => setTab("profiles")} icon={<Users size={14} />} label="Kids" />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 px-5 pb-8 pt-2 ${view === "result" ? "" : "mx-auto w-full max-w-2xl"}`}>
        {view === "result" && meal ? (
          <MealResult
            meal={meal}
            onBack={handleBack}
            lastForm={lastForm}
            activeProfileName={activeProfile?.name}
            onViewMeal={handleUpdateMeal}
            setIsLoading={setIsLoading}
            onAuthRequired={checkAuthAndUsage}
          />
        ) : view === "weekly-view" && weeklyPlan ? (
          <WeeklyPlanner plan={weeklyPlan} onViewMeal={handleWeeklyMealView} onBack={handleBack} />
        ) : tab === "generate" ? (
          <MealForm onGenerate={handleGenerate} onGenerateWeekly={handleGenerateWeekly} isLoading={isLoading} activeProfile={activeProfile} />
        ) : tab === "weekly" ? (
          <MealForm onGenerate={handleGenerate} onGenerateWeekly={handleGenerateWeekly} isLoading={isLoading} activeProfile={activeProfile} weeklyMode />
        ) : tab === "water" ? (
          <WaterTracker activeProfile={activeProfile} />
        ) : tab === "liquid" ? (
          <LiquidNutrition activeProfile={activeProfile} />
        ) : tab === "saved" ? (
          <SavedMeals onSelect={handleSelectSaved} />
        ) : (
          <ChildProfiles
            activeProfileId={activeProfile?.id ?? null}
            onSelect={handleSelectProfile}
            onAuthRequired={checkAuthAndUsage}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authModalConfig.title}
        description={authModalConfig.description}
      />
      <Pricing
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all btn-press ${active ? "bg-background text-foreground shadow-md ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
    >
      {icon} <span className="hidden sm:inline">{label}</span>
      {active && <span className="sm:hidden">{label}</span>}
    </button>
  );
}
