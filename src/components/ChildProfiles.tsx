import { useState } from "react";
import { UserPlus, Users, Trash2, Edit2, Check, X, Baby, Scale, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChildProfiles, saveChildProfile, removeChildProfile, type ChildProfile } from "@/lib/meal-data";
import { toast } from "sonner";

interface Props {
  activeProfileId: string | null;
  onSelect: (profile: ChildProfile) => void;
}

const ageOptions = ["6-12 months", "1-2 years", "3-5 years", "6-10 years", "11+ years"];
const dietOptions = ["Regular", "Vegetarian", "Vegan", "Halal", "Gluten-Free"];
const goalOptions = ["Balanced nutrition", "Weight gain", "Picky eater friendly", "Brain boost", "Energy boost"];

const emptyProfile = (): ChildProfile => ({
  id: Date.now().toString(),
  name: "",
  age: "3-5 years",
  weight: "",
  height: "",
  diet: "Regular",
  allergies: "",
  goal: "Balanced nutrition",
});

function ChipSelect({ options, value, onChange, small }: { options: string[]; value: string; onChange: (v: string) => void; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-lg px-3 py-1.5 font-semibold transition-all btn-press ${small ? "text-xs" : "text-xs"} ${
            value === opt
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function ChildProfiles({ activeProfileId, onSelect }: Props) {
  const [profiles, setProfiles] = useState<ChildProfile[]>(getChildProfiles());
  const [editing, setEditing] = useState<ChildProfile | null>(null);

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("Please enter a name"); return; }
    saveChildProfile(editing);
    setProfiles(getChildProfiles());
    onSelect(editing);
    setEditing(null);
    toast.success("Profile saved! 👶");
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeChildProfile(id);
    setProfiles(getChildProfiles());
    toast.info("Profile removed");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-extrabold text-foreground">
          <Users className="text-lavender-foreground" size={20} /> Children
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(emptyProfile())}
          className="rounded-xl"
        >
          <UserPlus size={16} /> Add
        </Button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="animate-slide-up rounded-2xl bg-card p-4 shadow-sm border border-primary/30 space-y-3">
          <input
            type="text"
            placeholder="Child's name"
            value={editing.name}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
            className="w-full rounded-xl border-2 border-input bg-background px-4 py-2.5 text-sm font-semibold placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            autoFocus
          />

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Baby size={14} /> Age
            </label>
            <ChipSelect options={ageOptions} value={editing.age} onChange={v => setEditing({ ...editing, age: v })} small />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                <Scale size={14} /> Weight (kg)
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={editing.weight || ""}
                onChange={e => setEditing({ ...editing, weight: e.target.value })}
                className="w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                <Ruler size={14} /> Height (cm)
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={editing.height || ""}
                onChange={e => setEditing({ ...editing, height: e.target.value })}
                className="w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">Diet Preference</label>
            <ChipSelect options={dietOptions} value={editing.diet} onChange={v => setEditing({ ...editing, diet: v })} small />
          </div>

          <input
            type="text"
            placeholder="Allergies (e.g. nuts, dairy)"
            value={editing.allergies}
            onChange={e => setEditing({ ...editing, allergies: e.target.value })}
            className="w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">Health Goal</label>
            <ChipSelect options={goalOptions} value={editing.goal} onChange={v => setEditing({ ...editing, goal: v })} small />
          </div>

          <div className="flex gap-2">
            <Button variant="generate" size="sm" className="flex-1 rounded-xl" onClick={handleSave}>
              <Check size={16} /> Save
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditing(null)}>
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Profile list */}
      {profiles.length === 0 && !editing && (
        <div className="animate-slide-up text-center py-6">
          <Baby className="mx-auto text-muted-foreground" size={32} />
          <p className="mt-2 text-sm font-bold text-muted-foreground">No profiles yet</p>
          <p className="text-xs text-muted-foreground/70">Add your child's profile for personalized meals</p>
        </div>
      )}

      {profiles.map(profile => (
        <div
          key={profile.id}
          onClick={() => onSelect(profile)}
          className={`animate-slide-up flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all btn-press border ${
            activeProfileId === profile.id ? "bg-peach-light border-primary/30 shadow-md" : "bg-card border-border hover:shadow-sm"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender">
            <span className="text-sm font-extrabold text-lavender-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{profile.name}</p>
            <p className="text-xs text-muted-foreground">
              {profile.age} · {profile.diet}
              {profile.weight ? ` · ${profile.weight}kg` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(profile); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => handleRemove(profile.id, e)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
