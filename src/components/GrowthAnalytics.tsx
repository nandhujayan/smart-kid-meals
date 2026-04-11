import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Scale, Ruler, Plus, Calendar, TrendingUp, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGrowthLogs, saveGrowthLog, generateSafeId, type GrowthLog, type ChildProfile } from "@/lib/meal-data";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  profile: ChildProfile;
  onBack: () => void;
}

export default function GrowthAnalytics({ profile, onBack }: Props) {
  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLog, setNewLog] = useState({
    weight: profile.weight || "",
    height: profile.height || "",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchLogs();
  }, [profile.id]);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getGrowthLogs(profile.id);
    setLogs(data);
    setLoading(false);
  };

  const handleAddLog = async () => {
    if (!newLog.weight && !newLog.height) {
      toast.error("Please enter weight or height");
      return;
    }

    const log: GrowthLog = {
      id: generateSafeId(),
      profile_id: profile.id,
      weight: parseFloat(newLog.weight || "0"),
      height: parseFloat(newLog.height || "0"),
      logged_at: new Date(newLog.date).toISOString()
    };

    await saveGrowthLog(log);
    toast.success("Growth log added! 📈");
    setShowForm(false);
    fetchLogs();
  };

  const chartData = logs
    .map(l => {
      const date = new Date(l.logged_at);
      const isValidDate = !isNaN(date.getTime());
      
      return {
        date: isValidDate ? format(date, "MMM d, yy") : "---",
        weight: l.weight > 0 ? l.weight : null,
        height: l.height > 0 ? l.height : null,
        rawDate: isValidDate ? date.getTime() : 0,
        isValid: isValidDate
      };
    })
    .filter(d => d.isValid)
    .sort((a, b) => a.rawDate - b.rawDate);

  const getGrowthStats = () => {
    if (logs.length < 2) return null;
    const sorted = [...logs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    return {
      weightDiff: (last.weight - first.weight).toFixed(1),
      heightDiff: (last.height - first.height).toFixed(1),
      days: Math.floor((new Date(last.logged_at).getTime() - new Date(first.logged_at).getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const stats = getGrowthStats();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors btn-press">
          <ArrowLeft size={18} /> Back to Profiles
        </button>
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <TrendingUp className="text-primary" size={20} /> {profile.name}'s Growth
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-peach-light p-4 shadow-sm border border-peach/20">
          <div className="flex items-center gap-2 mb-1">
            <Scale size={16} className="text-peach" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Weight</span>
          </div>
          <p className="text-2xl font-black text-foreground">{logs.length > 0 ? logs[logs.length-1].weight : profile.weight || "--"} <span className="text-sm font-bold text-muted-foreground">kg</span></p>
          {stats && parseFloat(stats.weightDiff) !== 0 && (
            <p className={`text-[10px] font-bold mt-1 ${parseFloat(stats.weightDiff) > 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {parseFloat(stats.weightDiff) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(stats.weightDiff))}kg in {stats.days} days
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-sky/10 p-4 shadow-sm border border-sky/20">
          <div className="flex items-center gap-2 mb-1">
            <Ruler size={16} className="text-sky-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Height</span>
          </div>
          <p className="text-2xl font-black text-foreground">{logs.length > 0 ? logs[logs.length-1].height : profile.height || "--"} <span className="text-sm font-bold text-muted-foreground">cm</span></p>
          {stats && parseFloat(stats.heightDiff) !== 0 && (
            <p className={`text-[10px] font-bold mt-1 ${parseFloat(stats.heightDiff) > 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {parseFloat(stats.heightDiff) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(stats.heightDiff))}cm in {stats.days} days
            </p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-4">
        {logs.length > 1 ? (
          <>
            <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Weight Trend (kg)</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#FF8A65" strokeWidth={3} dot={{ r: 4, fill: "#FF8A65" }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Height Trend (cm)</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="height" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: "#38BDF8" }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-muted/30 border-2 border-dashed border-border py-12 text-center">
            <TrendingUp size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">Not enough data for charts</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Log at least two entries to see growth trends.</p>
          </div>
        )}
      </div>

      {/* Add Log Form */}
      {!showForm ? (
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl py-6 font-black text-base shadow-lg shadow-primary/20 transition-all btn-press"
        >
          <Plus size={20} /> Log New Growth Data
        </Button>
      ) : (
        <div className="animate-slide-up rounded-2xl bg-card p-5 border-2 border-primary/20 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-foreground">Log Current Stats</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Weight (kg)</label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="number" 
                  step="0.1"
                  value={newLog.weight}
                  onChange={e => setNewLog({...newLog, weight: e.target.value})}
                  className="w-full rounded-xl border-2 border-input bg-background pl-10 pr-4 py-2 text-sm font-bold focus:border-primary focus:outline-none"
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Height (cm)</label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="number" 
                  step="0.5"
                  value={newLog.height}
                  onChange={e => setNewLog({...newLog, height: e.target.value})}
                  className="w-full rounded-xl border-2 border-input bg-background pl-10 pr-4 py-2 text-sm font-bold focus:border-primary focus:outline-none"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date of Measurement</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="date" 
                value={newLog.date}
                onChange={e => setNewLog({...newLog, date: e.target.value})}
                className="w-full rounded-xl border-2 border-input bg-background pl-10 pr-4 py-2 text-sm font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAddLog} className="flex-1 rounded-xl py-5 font-bold">
              <Save size={18} /> Save Log
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl px-4 py-5">
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      <div className="h-4" /> {/* Spacer */}
    </div>
  );
}
