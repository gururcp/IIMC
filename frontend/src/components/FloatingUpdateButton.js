import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Zap, Search, Loader2, Save, Check, ChevronsUpDown, History, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  not_started: "#94a3b8",
  in_progress: "#3b82f6",
  completed: "#10b981",
  delayed: "#ef4444",
  at_risk: "#f59e0b",
};

const STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  delayed: "Delayed",
  at_risk: "At Risk",
};

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Date.now() - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function FloatingUpdateButton() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Update form state
  const [progress, setProgress] = useState([0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  
  // History state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/tasks`);
      // Only get leaf tasks that can be updated
      const leafTasks = res.data.filter(t => t.is_leaf && !t.exclude_from_rollup);
      setTasks(leafTasks);
    } catch (err) {
      toast.error("Failed to load tasks");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && tasks.length === 0) {
      fetchTasks();
    }
  }, [open, fetchTasks, tasks.length]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return tasks.filter(t => 
      t.name.toLowerCase().includes(query) || 
      String(t.task_id).includes(query)
    ).slice(0, 50);
  }, [tasks, searchQuery]);

  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setProgress([task.progress]);
    setNotes("");
    setSearchOpen(false);
    setShowHistory(false);
  };

  const loadHistory = async () => {
    if (!selectedTask) return;
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API}/tasks/${selectedTask.task_id}/history`);
      setHistory(res.data);
      setShowHistory(true);
    } catch {
      toast.error("Failed to load history");
    }
    setLoadingHistory(false);
  };

  const handleSave = async () => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      await axios.put(`${API}/tasks/${selectedTask.task_id}/progress`, {
        progress: progress[0],
        update_notes: notes,
      });
      toast.success(`Task #${selectedTask.task_id} updated to ${progress[0]}%`);
      // Refresh tasks to get updated data
      await fetchTasks();
      // Reset form
      setSelectedTask(null);
      setProgress([0]);
      setNotes("");
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update task");
    }
    setSaving(false);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask(null);
    setProgress([0]);
    setNotes("");
    setShowHistory(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
        data-testid="floating-update-btn"
        aria-label="Quick Update Task"
      >
        <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
      </button>

      {/* Quick Update Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md sm:max-w-lg" data-testid="floating-update-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Quick Update
            </DialogTitle>
            <DialogDescription>
              Search and update any task instantly
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : !selectedTask ? (
            // Task Search View
            <div className="space-y-4">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-between h-12 text-left font-normal"
                    data-testid="task-search-trigger"
                  >
                    <div className="flex items-center gap-2 text-slate-500">
                      <Search className="w-4 h-4" />
                      Search tasks by name or ID...
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Type task name or #ID..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      data-testid="task-search-input"
                    />
                    <CommandList>
                      <CommandEmpty>No tasks found.</CommandEmpty>
                      <CommandGroup heading="Leaf Tasks">
                        {filteredTasks.map((task) => (
                          <CommandItem
                            key={task.task_id}
                            value={`${task.task_id}-${task.name}`}
                            onSelect={() => handleSelectTask(task)}
                            className="cursor-pointer"
                            data-testid={`search-result-${task.task_id}`}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-slate-400">#{task.task_id}</span>
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] px-1.5 py-0"
                                    style={{ 
                                      color: STATUS_COLORS[task.status], 
                                      borderColor: STATUS_COLORS[task.status] + "40" 
                                    }}
                                  >
                                    {STATUS_LABELS[task.status]}
                                  </Badge>
                                </div>
                                <p className="text-sm truncate mt-0.5">{task.name}</p>
                              </div>
                              <span 
                                className="font-bold text-sm shrink-0"
                                style={{ color: STATUS_COLORS[task.status] }}
                              >
                                {task.progress}%
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <p className="text-xs text-slate-400 text-center">
                {tasks.length} leaf tasks available for update
              </p>
            </div>
          ) : !showHistory ? (
            // Update Form View
            <div className="space-y-5">
              {/* Selected Task Info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">#{selectedTask.task_id}</span>
                      <Badge 
                        variant="outline" 
                        className="text-[9px] px-1.5 py-0"
                        style={{ 
                          color: STATUS_COLORS[selectedTask.status], 
                          borderColor: STATUS_COLORS[selectedTask.status] + "40" 
                        }}
                      >
                        {STATUS_LABELS[selectedTask.status]}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{selectedTask.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{selectedTask.start_date} to {selectedTask.end_date}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    data-testid="change-task-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">New Progress</span>
                  <span 
                    className="font-heading text-3xl font-black"
                    style={{ color: STATUS_COLORS[progress[0] === 100 ? "completed" : progress[0] > 0 ? "in_progress" : "not_started"] }}
                  >
                    {progress[0]}%
                  </span>
                </div>
                <Slider 
                  value={progress} 
                  onValueChange={setProgress} 
                  min={0} 
                  max={100} 
                  step={5} 
                  className="mb-2" 
                  data-testid="fab-progress-slider"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                {/* Quick percentage buttons */}
                <div className="flex gap-2 mt-3">
                  {[0, 25, 50, 75, 100].map(v => (
                    <button
                      key={v}
                      onClick={() => setProgress([v])}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        progress[0] === v 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "border-slate-200 text-slate-500 hover:border-slate-400"
                      }`}
                      data-testid={`fab-quick-${v}`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Update Notes */}
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Update Notes (optional)</label>
                <Textarea
                  placeholder="What work was completed?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                  data-testid="fab-update-notes"
                />
              </div>

              {/* Previous progress indicator */}
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <span>Previous: <span className="font-semibold text-slate-700">{selectedTask.progress}%</span></span>
                <button 
                  onClick={loadHistory} 
                  className="flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium"
                  data-testid="fab-show-history-btn"
                >
                  {loadingHistory ? <Loader2 className="w-3 h-3 animate-spin" /> : <History className="w-3 h-3" />}
                  View History
                </button>
              </div>
            </div>
          ) : (
            // History View
            <div className="space-y-3">
              <button 
                onClick={() => setShowHistory(false)} 
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                data-testid="fab-back-to-update"
              >
                <X className="w-3.5 h-3.5" /> Back to update
              </button>
              <div className="max-h-72 overflow-auto space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No update history yet</p>
                ) : history.map((h, i) => (
                  <div key={i} className="border border-slate-100 rounded-lg p-3 text-xs animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[9px]">
                        {h.action === "progress_update" ? "Progress" : h.action === "date_change" ? "Dates" : h.action === "risk_change" ? "Risk" : h.action}
                      </Badge>
                      <span className="text-slate-400">{formatTimestamp(h.timestamp)}</span>
                    </div>
                    <p className="text-slate-700 font-medium">
                      {h.old_value} <span className="text-slate-400 mx-1">&rarr;</span> {h.new_value}
                      {h.field === "progress" && "%"}
                    </p>
                    {h.notes && <p className="text-slate-500 mt-1 italic">"{h.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer with Save button - only show when task is selected and not viewing history */}
          {selectedTask && !showHistory && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} data-testid="fab-cancel-btn">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md"
                data-testid="fab-save-btn"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Update
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
