import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ChevronDown, AlertTriangle, Shield, Calendar, Search, Loader2, History, Save } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_MAP = {
  not_started: { label: "Not Started", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  delayed: { label: "Delayed", cls: "bg-red-50 text-red-700 border-red-200" },
  at_risk: { label: "At Risk", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

const PHASES = [
  { value: "all", label: "All Phases" },
  { value: "pre_construction", label: "Pre-Construction" },
  { value: "admin_academic", label: "Admin & Academic" },
  { value: "auditorium", label: "Auditorium" },
  { value: "residential", label: "Residential" },
  { value: "external", label: "External Dev" },
];

function flattenTree(tasks, expanded, search) {
  const map = {};
  tasks.forEach(t => { map[t.task_id] = { ...t, children: [] }; });
  const roots = [];
  tasks.forEach(t => {
    if (t.parent_task_id === null || t.parent_task_id === undefined) {
      roots.push(map[t.task_id]);
    } else if (map[t.parent_task_id]) {
      map[t.parent_task_id].children.push(map[t.task_id]);
    }
  });

  const result = [];
  function walk(nodes) {
    nodes.forEach(n => {
      if (search && !n.name.toLowerCase().includes(search.toLowerCase())) {
        if (n.children.length > 0) walk(n.children);
        return;
      }
      result.push(n);
      if (expanded[n.task_id] && n.children.length > 0) {
        walk(n.children);
      }
    });
  }
  walk(roots);
  return result;
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.not_started;
  return <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${s.cls}`}>{s.label}</Badge>;
}

function ProgressCell({ task, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(task.progress);

  const save = () => {
    const num = parseFloat(val) || 0;
    onUpdate(task.task_id, num);
    setEditing(false);
  };

  if (!task.is_leaf) {
    return (
      <div className="flex items-center gap-2">
        <Progress value={task.progress} className="h-1.5 flex-1" />
        <span className="w-14 text-xs text-center font-medium text-slate-500">{task.progress}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Progress value={task.progress} className="h-1.5 flex-1" />
      {editing ? (
        <input
          type="number" min="0" max="100" step="5"
          className="w-14 h-7 text-xs text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          data-testid={`progress-input-${task.task_id}`}
        />
      ) : (
        <button
          onClick={() => { setVal(task.progress); setEditing(true); }}
          className="w-14 h-7 text-xs text-center border border-transparent rounded-md hover:border-slate-300 hover:bg-slate-50 transition-colors font-medium text-slate-700"
          data-testid={`progress-btn-${task.task_id}`}
        >
          {task.progress}%
        </button>
      )}
    </div>
  );
}

export default function TaskTree() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [riskDialog, setRiskDialog] = useState(null);
  const [dateDialog, setDateDialog] = useState(null);
  const [riskFlag, setRiskFlag] = useState(false);
  const [riskNotes, setRiskNotes] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [historyDialog, setHistoryDialog] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    axios.get(`${API}/tasks`).then(r => {
      setTasks(r.data);
      setExpanded(prev => {
        if (Object.keys(prev).length === 0) {
          const exp = {};
          r.data.forEach(t => { if (t.level <= 1 && !t.is_leaf) exp[t.task_id] = true; });
          return exp;
        }
        return prev;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const expandAll = () => {
    const exp = {};
    tasks.forEach(t => { if (!t.is_leaf) exp[t.task_id] = true; });
    setExpanded(exp);
  };

  const collapseAll = () => {
    const exp = {};
    tasks.forEach(t => { if (t.level === 0) exp[t.task_id] = true; });
    setExpanded(exp);
  };

  const updateProgress = async (taskId, progress) => {
    try {
      await axios.put(`${API}/tasks/${taskId}/progress`, { progress });
      toast.success(`Task #${taskId} updated to ${progress}%`);
      fetchTasks();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update");
    }
  };

  const openRiskDialog = (t) => {
    setRiskDialog(t);
    setRiskFlag(t.risk_flagged);
    setRiskNotes(t.risk_notes || "");
  };

  const openDateDialog = (t) => {
    setDateDialog(t);
    setEditStart(t.start_date);
    setEditEnd(t.end_date);
  };

  const saveRisk = async () => {
    if (!riskDialog) return;
    try {
      await axios.put(`${API}/tasks/${riskDialog.task_id}/risk`, { risk_flagged: riskFlag, risk_notes: riskNotes });
      toast.success(`Risk updated for #${riskDialog.task_id}`);
      setRiskDialog(null);
      fetchTasks();
    } catch { toast.error("Failed to update risk"); }
  };

  const saveDates = async () => {
    if (!dateDialog) return;
    try {
      await axios.put(`${API}/tasks/${dateDialog.task_id}/dates`, { start_date: editStart, end_date: editEnd });
      toast.success(`Dates updated for #${dateDialog.task_id}`);
      setDateDialog(null);
      fetchTasks();
    } catch { toast.error("Failed to update dates"); }
  };

  const filtered = phase === "all" ? tasks : tasks.filter(t => t.phase === phase || t.task_id === 1);
  const visible = flattenTree(filtered, expanded, search);

  return (
    <div className="p-4 lg:p-6 space-y-4" data-testid="task-tree-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Task Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">{tasks.filter(t => t.is_leaf).length} leaf tasks | Click % to edit progress</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search..." className="pl-8 h-9 w-40 text-sm" value={search} onChange={e => setSearch(e.target.value)} data-testid="task-search" />
          </div>
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger className="h-9 w-40 text-sm" data-testid="phase-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHASES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={expandAll} data-testid="expand-all-btn">Expand</Button>
          <Button variant="outline" size="sm" onClick={collapseAll} data-testid="collapse-all-btn">Collapse</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="text-slate-500 text-[11px] uppercase font-semibold tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3 text-left">Task Name</th>
                <th className="py-2.5 px-3 text-left w-28">Status</th>
                <th className="py-2.5 px-3 text-left w-44">Progress</th>
                <th className="py-2.5 px-3 text-left w-24">Start</th>
                <th className="py-2.5 px-3 text-left w-24">End</th>
                <th className="py-2.5 px-3 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(task => {
                const hasChildren = task.children && task.children.length > 0;
                const isExpanded = expanded[task.task_id];
                const indent = task.level * 20 + 8;
                return (
                  <tr key={task.task_id} className="tree-row border-b border-slate-100 group" data-testid={`task-row-${task.task_id}`}>
                    <td className="py-2 pr-2 text-center text-xs text-slate-400 font-mono">{task.task_id}</td>
                    <td className="py-2 pr-3" style={{ paddingLeft: `${indent}px` }}>
                      <div className="flex items-center gap-1.5">
                        {hasChildren ? (
                          <button onClick={() => toggleExpand(task.task_id)} className="p-0.5 rounded hover:bg-slate-200" data-testid={`toggle-${task.task_id}`}>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                          </button>
                        ) : <span className="w-4" />}
                        <span className={`text-sm leading-tight ${!task.is_leaf ? "font-semibold text-slate-800" : "text-slate-700"}`}>{task.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2"><StatusBadge status={task.status} /></td>
                    <td className="py-2 px-2"><ProgressCell task={task} onUpdate={updateProgress} /></td>
                    <td className="py-2 px-2 text-xs text-slate-500 whitespace-nowrap">{task.start_date}</td>
                    <td className="py-2 px-2 text-xs text-slate-500 whitespace-nowrap">{task.end_date}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openRiskDialog(task)} className={`p-1 rounded ${task.risk_flagged ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-amber-500"}`} data-testid={`risk-btn-${task.task_id}`}>
                          {task.risk_flagged ? <AlertTriangle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => openDateDialog(task)} className="p-1 rounded text-slate-400 hover:text-blue-500" data-testid={`date-btn-${task.task_id}`}>
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!riskDialog} onOpenChange={() => setRiskDialog(null)}>
        <DialogContent data-testid="risk-dialog">
          <DialogHeader><DialogTitle className="font-heading">Risk Assessment - #{riskDialog?.task_id}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 mb-3">{riskDialog?.name}</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={riskFlag} onChange={e => setRiskFlag(e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
              <span className="text-sm font-medium">Flag as At Risk</span>
            </label>
            <Textarea placeholder="Risk notes..." value={riskNotes} onChange={e => setRiskNotes(e.target.value)} rows={3} data-testid="risk-notes-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRiskDialog(null)}>Cancel</Button>
            <Button onClick={saveRisk} className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="save-risk-btn">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dateDialog} onOpenChange={() => setDateDialog(null)}>
        <DialogContent data-testid="date-dialog">
          <DialogHeader><DialogTitle className="font-heading">Edit Dates - #{dateDialog?.task_id}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 mb-3">{dateDialog?.name}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
              <Input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} data-testid="edit-start-date" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
              <Input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} data-testid="edit-end-date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDateDialog(null)}>Cancel</Button>
            <Button onClick={saveDates} data-testid="save-dates-btn">Save Dates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
