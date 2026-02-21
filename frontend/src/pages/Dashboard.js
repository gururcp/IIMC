import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle, Clock, CheckCircle2, CircleDot, Loader2 } from "lucide-react";

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

const PHASE_ICONS = {
  pre_construction: "1",
  admin_academic: "2",
  auditorium: "3",
  residential: "4",
  external: "5",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/stats`).then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="dashboard-loading">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );
  if (!stats) return <div className="p-8 text-slate-500">Failed to load dashboard data.</div>;

  const pieData = Object.entries(stats.status_counts).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, color: STATUS_COLORS[k] || "#94a3b8" }));

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto" data-testid="dashboard-page">
      <div>
        <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Project Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">IIMC Western Regional Center, Badnera, Amravati</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <Card className="col-span-2 lg:col-span-1 border-slate-200 shadow-sm" data-testid="overall-progress-card">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall</p>
            <p className="font-heading text-4xl font-black text-slate-900">{stats.overall_progress}%</p>
            <Progress value={stats.overall_progress} className="mt-3 h-2" />
          </CardContent>
        </Card>
        {[
          { label: "Total Tasks", value: stats.leaf_tasks, icon: CircleDot, color: "text-slate-600" },
          { label: "Completed", value: stats.status_counts.completed || 0, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "In Progress", value: stats.status_counts.in_progress || 0, icon: TrendingUp, color: "text-blue-600" },
          { label: "Delayed", value: stats.status_counts.delayed || 0, icon: Clock, color: "text-red-600" },
        ].map(m => (
          <Card key={m.label} className="border-slate-200 shadow-sm" data-testid={`metric-${m.label.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.label}</p>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="font-heading text-3xl font-bold text-slate-900">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phase Tiles */}
      <div>
        <h3 className="font-heading text-lg font-bold text-slate-800 mb-3">Phase Progress</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.phase_stats.map(p => (
            <Card key={p.key} className="phase-card border-slate-200 shadow-sm" data-testid={`phase-${p.key}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold">{PHASE_ICONS[p.key]}</span>
                  <span className="text-xs font-semibold text-slate-700 leading-tight">{p.name}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="font-heading text-2xl font-bold text-slate-900">{p.progress}%</span>
                  <span className="text-[10px] text-slate-400 font-medium">{p.leaf_tasks} tasks</span>
                </div>
                <Progress value={p.progress} className="h-1.5 mb-2" />
                <div className="flex flex-wrap gap-1">
                  {Object.entries(p.status_counts).map(([s, c]) => (
                    <span key={s} className="inline-flex items-center text-[10px] font-medium" style={{ color: STATUS_COLORS[s] }}>
                      <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[s] }} />{c}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts + Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm" data-testid="status-chart">
          <CardHeader className="pb-2"><CardTitle className="font-heading text-base font-bold">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-400 text-center py-10">No data yet</p>}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map(d => (
                <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm" data-testid="at-risk-list">
          <CardHeader className="pb-2"><CardTitle className="font-heading text-base font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />At Risk</CardTitle></CardHeader>
          <CardContent className="max-h-[280px] overflow-auto">
            {stats.at_risk_items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No items at risk</p>
            ) : stats.at_risk_items.map(t => (
              <div key={t.task_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">#{t.task_id} {t.name}</p>
                  {t.risk_notes && <p className="text-xs text-slate-400 truncate">{t.risk_notes}</p>}
                </div>
                <Badge variant="outline" className="ml-2 text-amber-600 border-amber-200 bg-amber-50 text-xs shrink-0">{t.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm" data-testid="delayed-list">
          <CardHeader className="pb-2"><CardTitle className="font-heading text-base font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-red-500" />Delayed</CardTitle></CardHeader>
          <CardContent className="max-h-[280px] overflow-auto">
            {stats.delayed_items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No delayed items</p>
            ) : stats.delayed_items.map(t => (
              <div key={t.task_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">#{t.task_id} {t.name}</p>
                  <p className="text-xs text-slate-400">Due: {t.end_date}</p>
                </div>
                <Badge variant="outline" className="ml-2 text-red-600 border-red-200 bg-red-50 text-xs shrink-0">{t.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
