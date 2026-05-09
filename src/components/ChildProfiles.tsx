import { useState, useEffect } from "react";
import { UserPlus, Users, Trash2, Edit2, Check, X, Baby, Scale, Ruler, TrendingUp, AlertTriangle, Lock } from "lucide-react";
import GrowthAnalytics from "./GrowthAnalytics";
import { Button } from "@/components/ui/button";
import { getChildProfiles, saveChildProfile, removeChildProfile, generateSafeId, type ChildProfile } from "@/lib/meal-data";
import TagInput from "@/components/TagInput";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  activeProfileId: string | null;
  onSelect: (profile: ChildProfile) => void;
  onAuthRequired?: (action: string) => boolean;
  isPro?: boolean;
  onUpgradeRequired?: () => void;
  onProfilesChange?: () => void;
}

const FREE_PROFILE_LIMIT = 2;
const ageOptions = ["6-12 months", "1-2 years", "3-5 years", "6-10 years", "11+ years"];
const dietOptions = ["Regular", "Vegetarian", "Vegan", "Halal", "Gluten-Free"];
const goalOptions = ["Balanced nutrition", "Weight gain", "Picky eater friendly", "Brain boost", "Energy boost"];

const emptyProfile = (): ChildProfile => ({
  id: generateSafeId(), name: "", age: "3-5 years",
  weight: "", height: "", diet: "Regular", allergies: [], goal: "Balanced nutrition",
});

function ChipSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all btn-press ${value === opt ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function validateNumber(value: string): boolean {
  if (!value) return true; // optional fields are allowed empty
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num < 500;
}

export default function ChildProfiles({ activeProfileId, onSelect, onAuthRequired, isPro = false, onUpgradeRequired, onProfilesChange }: Props) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [editing, setEditing] = useState<ChildProfile | null>(null);
  const [viewingAnalytics, setViewingAnalytics] = useState<ChildProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ weight?: string; height?: string }>({});

  useEffect(() => {
    getChildProfiles().then(setProfiles);
  }, []);

  const handleAdd = () => {
    if (onAuthRequired && !onAuthRequired("profiles")) return;
    if (!isPro && profiles.length >= FREE_PROFILE_LIMIT) {
      toast.error(`Free plan allows up to ${FREE_PROFILE_LIMIT} profiles.`, {
        description: "Upgrade to Pro for unlimited children.",
        action: onUpgradeRequired ? { label: "Upgrade", onClick: onUpgradeRequired } : undefined,
      });
      return;
    }
    setEditing(emptyProfile());
    setErrors({});
  };

  const handleSave = async () => {
    if (onAuthRequired && !onAuthRequired("profiles")) return;
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("Please enter a name"); return; }

    const newErrors: { weight?: string; height?: string } = {};
    if (editing.weight && !validateNumber(editing.weight)) newErrors.weight = "Enter a valid weight (kg)";
    if (editing.height && !validateNumber(editing.height)) newErrors.height = "Enter a valid height (cm)";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    await saveChildProfile(editing);
    const updated = await getChildProfiles();
    setProfiles(updated);
    if (onProfilesChange) onProfilesChange();
    onSelect(editing);
    setEditing(null);
    toast.success("Profile saved! 👶");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await removeChildProfile(deleteTarget);
    const updated = await getChildProfiles();
    setProfiles(updated);
    if (onProfilesChange) onProfilesChange();
    setDeleteTarget(null);
    toast.info("Profile removed");
  };

  if (viewingAnalytics) {
    return <GrowthAnalytics profile={viewingAnalytics} onBack={() => setViewingAnalytics(null)} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-extrabold text-foreground">
          <Users className="text-lavender-foreground" size={20} /> Children
        </h3>
        <Button variant="ghost" size="sm" onClick={handleAdd} className="rounded-xl">
          <UserPlus size={16} /> Add
          {!isPro && profiles.length >= FREE_PROFILE_LIMIT && (
            <Lock size={12} className="ml-1 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="animate-slide-up rounded-2xl bg-card p-4 shadow-sm border border-primary/30 space-y-3">
          <input type="text" placeholder="Child's name" value={editing.name}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
            className="w-full rounded-xl border-2 border-input bg-background px-4 py-2.5 text-sm font-semibold placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" autoFocus />

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Baby size={14} /> Age</label>
            <ChipSelect options={ageOptions} value={editing.age} onChange={v => setEditing({ ...editing, age: v })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1"><Scale size={14} /> Weight (kg)</label>
              <input type="number" min="0.5" max="200" step="0.1" placeholder="Optional"
                value={editing.weight || ""} onChange={e => { setEditing({ ...editing, weight: e.target.value }); setErrors(prev => ({ ...prev, weight: undefined })); }}
                className={`w-full rounded-xl border-2 bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none ${errors.weight ? "border-destructive" : "border-input"}`} />
              {errors.weight && <p className="text-[10px] text-destructive mt-0.5">{errors.weight}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1"><Ruler size={14} /> Height (cm)</label>
              <input type="number" min="30" max="250" step="0.5" placeholder="Optional"
                value={editing.height || ""} onChange={e => { setEditing({ ...editing, height: e.target.value }); setErrors(prev => ({ ...prev, height: undefined })); }}
                className={`w-full rounded-xl border-2 bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none ${errors.height ? "border-destructive" : "border-input"}`} />
              {errors.height && <p className="text-[10px] text-destructive mt-0.5">{errors.height}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">Diet Preference</label>
            <ChipSelect options={dietOptions} value={editing.diet} onChange={v => setEditing({ ...editing, diet: v })} />
          </div>

          <TagInput items={editing.allergies || []} onChange={tags => setEditing({ ...editing, allergies: tags })}
            icon={<AlertTriangle size={14} className="text-destructive" />} label="Allergies"
            placeholder="e.g. nuts, dairy" colorScheme="destructive" delay="1" />

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">Health Goal</label>
            <ChipSelect options={goalOptions} value={editing.goal} onChange={v => setEditing({ ...editing, goal: v })} />
          </div>

          <div className="flex gap-2">
            <Button variant="generate" size="sm" className="flex-1 rounded-xl" onClick={handleSave}><Check size={16} /> Save</Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setEditing(null); setErrors({}); }}><X size={16} /></Button>
          </div>
        </div>
      )}

      {profiles.length === 0 && !editing && (
        <div className="animate-slide-up text-center py-6">
          <Baby className="mx-auto text-muted-foreground" size={32} />
          <p className="mt-2 text-sm font-bold text-muted-foreground">No profiles yet</p>
          <p className="text-xs text-muted-foreground/70">Add your child's profile for personalized meals</p>
        </div>
      )}

      {profiles.map(profile => (
        <div key={profile.id} onClick={() => onSelect(profile)}
          className={`animate-slide-up flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all btn-press border ${activeProfileId === profile.id ? "bg-peach-light border-primary/30 shadow-md" : "bg-card border-border hover:shadow-sm"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender">
            <span className="text-sm font-extrabold text-lavender-foreground">{profile.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{profile.name}</p>
            <p className="text-xs text-muted-foreground">
              {profile.age} · {profile.diet}
              {profile.weight ? ` · ${profile.weight}kg` : ""}
              {profile.allergies?.length > 0 && ` · ⚠️ ${profile.allergies.length} allergies`}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={(e) => { e.stopPropagation(); setViewingAnalytics(profile); }}
              className="rounded-lg p-1.5 text-primary hover:bg-primary/10" title="Growth Analytics">
              <TrendingUp size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setEditing(profile); setErrors({}); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
              <Edit2 size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(profile.id); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 size={18} /> Remove Profile?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this child's profile, growth logs, and water history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
