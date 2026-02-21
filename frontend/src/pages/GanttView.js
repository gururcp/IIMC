import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Loader2, Info } from "lucide-react";
import { differenceInDays, format, eachMonthOfInterval, getDaysInMonth, startOfMonth } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  not_started: "#94a3b8",
  in_progress: "#3b82f6",
  completed: "#10b981",
  delayed: "#ef4444",
  at_risk: "#f59e0b",
};

const PHASES = [
  { value: "all", label: "All Phases" },
  { value: "pre_construction", label: "Pre-Construction" },
  { value: "admin_academic", label: "Admin & Academic" },
  { value: "auditorium", label: "Auditorium" },
  { value: "residential", label: "Residential" },
  { value: "external", label: "External Dev" },
];

const TIMELINE_START = new Date(2025, 2, 1);
const TIMELINE_END = new Date(2027, 8, 1);
const ROW_HEIGHT = 36;

export default function GanttView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("all");
  const [zoom, setZoom] = useState([2.5]);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showLeafOnly, setShowLeafOnly] = useState(false);
  const rightRef = useRef(null);
  const leftRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/tasks`).then(r => { setTasks(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const syncScroll = useCallback((source) => {
    if (source === "right" && leftRef.current && rightRef.current) {
      leftRef.current.scrollTop = rightRef.current.scrollTop;
    } else if (source === "left" && rightRef.current && leftRef.current) {
      rightRef.current.scrollTop = leftRef.current.scrollTop;
    }
  }, []);

  const pixelsPerDay = zoom[0];
  const months = eachMonthOfInterval({ start: TIMELINE_START, end: TIMELINE_END });
  const totalDays = differenceInDays(TIMELINE_END, TIMELINE_START);
  const totalWidth = totalDays * pixelsPerDay;

  const todayOffset = differenceInDays(new Date(), TIMELINE_START) * pixelsPerDay;

  let filtered = tasks;
  if (phase !== "all") filtered = filtered.filter(t => t.phase === phase);
  if (showLeafOnly) filtered = filtered.filter(t => t.is_leaf);

  const handleBarHover = (task, e) => {
    setHoveredTask(task);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-4" data-testid="gantt-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Gantt Chart</h2>
          <p className="text-sm text-slate-500 mt-0.5">Visual timeline of all project tasks</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger className="h-9 w-44 text-sm" data-testid="gantt-phase-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHASES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showLeafOnly} onChange={e => setShowLeafOnly(e.target.checked)} className="rounded border-slate-300" />
            Leaf only
          </label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
            <Slider value={zoom} onValueChange={setZoom} min={0.8} max={5} step={0.2} className="w-24" data-testid="zoom-slider" />
            <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUS_COLORS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
            {k.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-orange-500 font-semibold">
          <span className="w-3 h-0.5 bg-orange-500" /> Today
        </span>
      </div>

      {/* Gantt */}
      <div className="gantt-container" data-testid="gantt-container">
        {/* Left Panel */}
        <div className="gantt-left scrollbar-thin" ref={leftRef} onScroll={() => syncScroll("left")}>
          <div className="gantt-month-header" style={{ height: 32, position: "sticky", top: 0, background: "#f8fafc", zIndex: 5, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", paddingLeft: 12, fontSize: "11px", fontWeight: 700, color: "#475569" }}>
            TASK NAME
          </div>
          {filtered.map(task => (
            <div key={task.task_id} className="gantt-row" style={{ paddingLeft: `${task.level * 14 + 8}px` }}>
              <span className={`text-xs truncate ${!task.is_leaf ? "font-semibold text-slate-800" : "text-slate-600"}`} title={task.name}>
                <span className="text-slate-400 font-mono mr-1.5">{task.task_id}</span>
                {task.name}
              </span>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="gantt-right scrollbar-thin" ref={rightRef} onScroll={() => syncScroll("right")}>
          {/* Month headers */}
          <div style={{ display: "flex", width: totalWidth, position: "sticky", top: 0, zIndex: 5 }}>
            {months.map(month => {
              const days = getDaysInMonth(month);
              const w = days * pixelsPerDay;
              return (
                <div key={month.toISOString()} className="gantt-month-header" style={{ width: w, minWidth: w }}>
                  {w > 30 ? format(month, "MMM yyyy") : format(month, "M")}
                </div>
              );
            })}
          </div>

          {/* Task bars */}
          <div style={{ width: totalWidth, position: "relative" }}>
            {filtered.map((task, i) => {
              const startDate = new Date(task.start_date);
              const endDate = new Date(task.end_date);
              const left = differenceInDays(startDate, TIMELINE_START) * pixelsPerDay;
              const barWidth = Math.max(differenceInDays(endDate, startDate) * pixelsPerDay, 4);
              const color = STATUS_COLORS[task.status] || "#94a3b8";

              return (
                <div key={task.task_id} className="gantt-row" style={{ position: "relative" }}>
                  {/* Grid lines for months */}
                  {months.map(month => {
                    const mLeft = differenceInDays(startOfMonth(month), TIMELINE_START) * pixelsPerDay;
                    return <div key={month.toISOString()} style={{ position: "absolute", left: mLeft, top: 0, bottom: 0, width: 1, background: "#f1f5f9" }} />;
                  })}
                  <div
                    className="gantt-bar"
                    style={{ left, width: barWidth, top: 7, backgroundColor: color, opacity: task.is_leaf ? 1 : 0.65 }}
                    onMouseEnter={(e) => handleBarHover(task, e)}
                    onMouseLeave={() => setHoveredTask(null)}
                    data-testid={`gantt-bar-${task.task_id}`}
                  >
                    {task.progress > 0 && (
                      <div className="gantt-bar-progress" style={{ width: `${task.progress}%` }} />
                    )}
                    {barWidth > 40 && (
                      <span className="text-[9px] text-white font-semibold px-1.5 truncate drop-shadow-sm">{task.progress}%</span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Today marker */}
            {todayOffset > 0 && todayOffset < totalWidth && (
              <div className="gantt-today-line" style={{ left: todayOffset, height: filtered.length * ROW_HEIGHT }} />
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredTask && (
        <div
          className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg p-3 pointer-events-none max-w-xs"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
          data-testid="gantt-tooltip"
        >
          <p className="text-sm font-semibold text-slate-800">#{hoveredTask.task_id} {hoveredTask.name}</p>
          <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
            <p>Status: <span className="font-medium" style={{ color: STATUS_COLORS[hoveredTask.status] }}>{hoveredTask.status.replace("_", " ")}</span></p>
            <p>Progress: <span className="font-medium text-slate-700">{hoveredTask.progress}%</span></p>
            <p>{hoveredTask.start_date} to {hoveredTask.end_date}</p>
            <p>Duration: {hoveredTask.duration} days</p>
            {hoveredTask.risk_flagged && <p className="text-amber-600 font-medium">At Risk: {hoveredTask.risk_notes || "Flagged"}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
