import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Search, ChevronRight, Clock, Save, History, Loader2, CheckCircle2, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  not_started: "#94a3b8", in_progress: "#3b82f6", completed: "#10b981", delayed: "#ef4444", at_risk: "#f59e0b",
};
const STATUS_LABELS = {
  not_started: "Not Started", in_progress: "In Progress", completed: "Completed", delayed: "Delayed", at_risk: "At Risk",
};

const PHASES = [
  { value: "all", label: "All Phases" },
  { value: "pre_construction", label: "Pre-Construction" },
  { value: "admin_academic", label: "Admin & Academic" },
  { value: "auditorium", label: "Auditorium" },
  { value: "residential", label: "Residential" },
  { value: "external", label: "External Dev" },
];

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function TaskCard({ task, onOpen }) {
  return (
    <button
      onClick={() => onOpen(task)}
      className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98]"
      data-testid={`quick-task-${task.task_id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400">#{task.task_id}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{ color: STATUS_COLORS[task.status], borderColor: STATUS_COLORS[task.status] + "40" }}>
              {STATUS_LABELS[task.status]}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{task.name}</p>
          <p className="text-[11px] text-slate-400 mt-1">{task.start_date} to {task.end_date}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-heading text-2xl font-bold" style={{ color: STATUS_COLORS[task.status] }}>{task.progress}%</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </div>
      <Progress value={task.progress} className="h-1.5 mt-2.5" />
    </button>
  );
}

function UpdateDialog({ task, open, onClose, onSaved }) {
  const [progress, setProgress] = useState([0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (task && open) {
      setProgress([task.progress]);
      setNotes("");
      setShowHistory(false);
    }
  }, [task, open]);

  const loadHistory = () => {
    if (!task) return;
    setLoadingHistory(true);
    axios.get(`${API}/tasks/${task.task_id}/history`).then(r => {
      setHistory(r.data);
      setShowHistory(true);
      setLoadingHistory(false);
    }).catch(() => setLoadingHistory(false));
  };

  const save = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await axios.put(`${API}/tasks/${task.task_id}/progress`, { progress: progress[0], update_notes: notes });
      toast.success(`#${task.task_id} updated to ${progress[0]}%`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update");
    }
    setSaving(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="quick-update-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg pr-6">
            <span className="text-slate-400 font-mono text-sm mr-2">#{task.task_id}</span>
            {task.name}
          </DialogTitle>
          <DialogDescription>Update progress and add notes for this task</DialogDescription>
        </DialogHeader>

        {!showHistory ? (
          <div className="space-y-5">
            {/* Progress Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">Progress</span>
                <span className="font-heading text-3xl font-black" style={{ color: STATUS_COLORS[progress[0] === 100 ? "completed" : progress[0] > 0 ? "in_progress" : "not_started"] }}>
                  {progress[0]}%
                </span>
              </div>
              <Slider value={progress} onValueChange={setProgress} min={0} max={100} step={5} className="mb-2" data-testid="progress-slider" />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
              {/* Quick buttons */}
              <div className="flex gap-2 mt-3">
                {[0, 25, 50, 75, 100].map(v => (
                  <button
                    key={v}
                    onClick={() => setProgress([v])}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${progress[0] === v ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}
                    data-testid={`quick-${v}`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* Update Notes */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Update Notes</label>
              <Textarea
                placeholder="What work was completed? Any observations..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="text-sm"
                data-testid="update-notes"
              />
            </div>

            {/* Current info */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
              <p>Previous: <span className="font-semibold text-slate-700">{task.progress}%</span> ({STATUS_LABELS[task.status]})</p>
              <p>Timeline: {task.start_date} to {task.end_date} ({task.duration} days)</p>
              {task.risk_flagged && <p className="text-amber-600 font-medium">Risk: {task.risk_notes || "Flagged"}</p>}
            </div>

            {/* History toggle */}
            <button onClick={loadHistory} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-full justify-center py-1" data-testid="show-history-btn">
              {loadingHistory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
              View Update History
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setShowHistory(false)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700" data-testid="back-to-update-btn">
              <X className="w-3.5 h-3.5" /> Back to update
            </button>
            <div className="max-h-72 overflow-auto space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No update history yet</p>
              ) : history.map((h, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[9px]">
                      {h.action === "progress_update" ? "Progress" : h.action === "date_change" ? "Dates" : h.action === "risk_change" ? "Risk" : h.action}
                    </Badge>
                    <span className="text-slate-400">{formatTimestamp(h.timestamp)}</span>
                  </div>
                  <p className="text-slate-700 font-medium">
                    {h.old_value} <span className="text-slate-400 mx-1">-&gt;</span> {h.new_value}
                    {h.field === "progress" && "%"}
                  </p>
                  {h.notes && <p className="text-slate-500 mt-1 italic">"{h.notes}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!showHistory && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-800" data-testid="save-progress-btn">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Update
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function QuickUpdate() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    axios.get(`${API}/tasks`).then(r => { setTasks(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fetchRecent = useCallback(() => {
    axios.get(`${API}/history/recent?limit=10`).then(r => setRecentHistory(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchTasks(); fetchRecent(); }, [fetchTasks, fetchRecent]);

  const leafTasks = tasks.filter(t => t.is_leaf && !t.exclude_from_rollup);
  let filtered = leafTasks;
  if (phase !== "all") filtered = filtered.filter(t => t.phase === phase);
  if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || String(t.task_id).includes(search));

  const handleSaved = () => { fetchTasks(); fetchRecent(); };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto" data-testid="quick-update-page">
      <div>
        <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Quick Update</h2>
        <p className="text-sm text-slate-500 mt-0.5">Tap a task to update progress from site</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by name or #ID..." className="pl-9 h-10 text-sm" value={search} onChange={e => setSearch(e.target.value)} data-testid="quick-search" />
        </div>
        <Select value={phase} onValueChange={setPhase}>
          <SelectTrigger className="h-10 w-40 text-sm" data-testid="quick-phase-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PHASES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Recent Updates */}
      {recentHistory.length > 0 && !search && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Recent Updates
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {recentHistory.filter(h => h.action === "progress_update").slice(0, 6).map((h, i) => (
              <div key={i} className="shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs min-w-[160px]">
                <p className="font-medium text-slate-700 truncate">#{h.task_id} {h.task_name}</p>
                <p className="text-slate-400 mt-0.5">{h.old_value}% -&gt; {h.new_value}% <span className="text-slate-300 ml-1">{formatTimestamp(h.timestamp)}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-medium">{filtered.length} leaf tasks</p>
          {filtered.map(task => (
            <TaskCard key={task.task_id} task={task} onOpen={setSelectedTask} />
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-10">No tasks match your filter</p>}
        </div>
      )}

      <UpdateDialog task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} onSaved={handleSaved} />
    </div>
  );
}
