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
import SystemStatus from "@/components/SystemStatus";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Sparkles, Star, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const { signOut, isPro, subscriptionTier } = useAuth();

  const getGuestGenerations = () => {
    return parseInt(localStorage.getItem("smartkids-guest-gens") || "0");
  };

  const incrementGuestGenerations = () => {
    localStorage.setItem("smartkids-guest-gens", (getGuestGenerations() + 1).toString());
  };

  const checkAuthAndUsage = (action: string) => {
    if (!user) {
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
      
      // Increment usage in DB if user is logged in
      if (user) {
        import("@/lib/meal-data").then(m => m.incrementUsage(user.id));
      }
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
      toast.success("Weekly plan generated and saved!");

      // Increment usage in DB if user is logged in
      if (user) {
        import("@/lib/meal-data").then(m => m.incrementUsage(user.id));
      }
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
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-background shadow-xl border-x overflow-x-hidden pt-4 sm:pt-0">
      <LoadingOverlay isVisible={isLoading} formData={lastForm} />

      {/* Header */}
      <header className="animate-slide-up sticky top-0 z-20 bg-background/80 backdrop-blur-md px-5 py-4 border-b sm:border-none">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors btn-press">
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 border-r-2 border-primary/10">
                <div className="flex flex-col h-full bg-background">
                  <SheetHeader className="p-6 border-b bg-muted/30">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach-light">
                        <CookingPot className="text-peach" size={22} />
                      </div>
                      <span className="font-black text-xl tracking-tight">Mom's Kitchen</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                    {/* Saved Kids Section */}
                    <section>
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Saved Kids</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] font-bold uppercase tracking-wider text-sky hover:bg-sky/10"
                          onClick={() => { setTab("profiles"); setIsDrawerOpen(false); }}
                        >
                          Manage
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {profiles.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { handleSelectProfile(p); setIsDrawerOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border-2 ${
                              activeProfile?.id === p.id 
                              ? "bg-primary/5 border-primary/20 text-primary font-bold shadow-sm" 
                              : "border-transparent hover:bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            <span className="text-lg">👶</span>
                            <span className="flex-1 text-left text-sm">{p.name}</span>
                            {activeProfile?.id === p.id && <Star size={12} className="fill-primary text-primary" />}
                          </button>
                        ))}
                        {profiles.length === 0 && (
                          <p className="text-center py-4 text-xs text-muted-foreground font-medium">No profiles yet.</p>
                        )}
                      </div>
                    </section>

                    {/* Quick Access Section */}
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-4 px-2">Saved Items</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => { setTab("saved"); setIsDrawerOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                            tab === "saved" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Bookmark size={18} />
                          <span className="text-sm">Saved Meals</span>
                        </button>
                        <button
                          onClick={() => { setTab("weekly"); setIsDrawerOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                            view === "weekly-view" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Calendar size={18} />
                          <span className="text-sm">Weekly Plans</span>
                        </button>
                      </div>
                    </section>
                  </div>

                  <div className="p-4 border-t bg-muted/20">
                    <SystemStatus />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-foreground sm:text-lg">Mom's Kitchen</span>
              {isPro ? (
                <div className="flex items-center gap-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full border border-primary/20">
                  <Sparkles size={8} className="fill-primary" />
                  Pro
                </div>
              ) : (
                <span className="text-xs">🌱</span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mt-0.5">Kids</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-all border border-transparent hover:border-primary/10 btn-press focus:outline-none">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeProfile?.name || 'child'}`} 
                      alt="avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground hidden xs:inline-block">
                    {activeProfile ? activeProfile.name : "Profile"}
                  </span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-2 border-primary/20">
                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-3 py-2">Switch Kid</DropdownMenuLabel>
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
                  <Plus size={14} className="mr-2" /> New Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem onClick={signOut} className="rounded-xl px-3 py-2.5 font-bold text-destructive hover:bg-destructive/10 cursor-pointer">
                    <LogOut size={14} className="mr-2" /> Sign Out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setIsAuthModalOpen(true)} className="rounded-xl px-3 py-2.5 font-bold text-primary hover:bg-primary/10 cursor-pointer">
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button
              onClick={handleToggleNotifications}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition-colors btn-press relative"
            >
              {notifications ? <Bell className="text-peach" size={18} /> : <BellOff size={18} />}
              {notifications && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />}
            </button>
          </div>
        </div>

        {/* Tabs - Only show core navigation */}
        {view === "tabs" && (
          <div className="mx-auto max-w-2xl mt-4 px-0">
            <div className="flex gap-1 rounded-2xl bg-muted p-1">
              <TabBtn active={tab === "generate"} onClick={() => setTab("generate")} icon={<CookingPot size={14} />} label="Meal" />
              <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")} icon={<Calendar size={14} />} label="Weekly" />
              <TabBtn active={tab === "water"} onClick={() => setTab("water")} icon={<Droplet size={14} />} label="Water" />
              <TabBtn active={tab === "liquid"} onClick={() => setTab("liquid")} icon={<Milk size={14} />} label="Drinks" />
            </div>
          </div>
        )}
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
          <div className="space-y-8">
            <ChildProfiles
              activeProfileId={activeProfile?.id ?? null}
              onSelect={handleSelectProfile}
              onAuthRequired={checkAuthAndUsage}
            />
            <SystemStatus />
          </div>
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
