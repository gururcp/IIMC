import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FileText, Download, Loader2, Calendar, Filter, Clock, CalendarDays, CalendarRange, History } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const REPORT_TYPES = [
  { value: "full", label: "Full Report", icon: FileSpreadsheet, description: "Complete project snapshot with all tasks" },
  { value: "daily", label: "Daily Report", icon: Clock, description: "Tasks active today with recent updates" },
  { value: "weekly", label: "Weekly Report", icon: CalendarDays, description: "This week's progress summary" },
  { value: "monthly", label: "Monthly Report", icon: CalendarRange, description: "Monthly progress overview" },
];

const PHASES = [
  { value: "all", label: "All Phases" },
  { value: "pre_construction", label: "Pre-Construction" },
  { value: "admin_academic", label: "Admin & Academic" },
  { value: "auditorium", label: "Auditorium" },
  { value: "residential", label: "Residential" },
  { value: "external", label: "External Dev" },
];

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "not_started", label: "Not Started", color: "bg-slate-100 text-slate-600" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  { value: "delayed", label: "Delayed", color: "bg-red-100 text-red-700" },
  { value: "at_risk", label: "At Risk", color: "bg-amber-100 text-amber-700" },
];

function getDateRange(reportType) {
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  
  switch (reportType) {
    case "daily":
      return { start: formatDate(today), end: formatDate(today) };
    case "weekly": {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { start: formatDate(weekStart), end: formatDate(weekEnd) };
    }
    case "monthly": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: formatDate(monthStart), end: formatDate(monthEnd) };
    }
    default:
      return { start: "", end: "" };
  }
}

export default function Reports() {
  const [format, setFormat] = useState("excel");
  const [reportType, setReportType] = useState("full");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phase, setPhase] = useState("all");
  const [status, setStatus] = useState("all");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch dashboard stats for preview
  useEffect(() => {
    axios.get(`${API}/dashboard/stats`).then(r => setStats(r.data)).catch(() => {});
  }, []);

  // Update date range when report type changes
  useEffect(() => {
    if (reportType !== "full") {
      const range = getDateRange(reportType);
      setStartDate(range.start);
      setEndDate(range.end);
    } else {
      setStartDate("");
      setEndDate("");
    }
  }, [reportType]);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        format,
        report_type: reportType,
      });
      
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (phase !== "all") params.append("phase", phase);
      if (status !== "all") params.append("status", status);
      if (includeHistory) params.append("include_history", "true");
      
      const response = await fetch(`${API}/reports/generate?${params.toString()}`, { method: "GET" });
      if (!response.ok) throw new Error("Failed to generate report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Generate filename
      const dateStr = startDate || new Date().toISOString().slice(0, 10);
      const reportLabel = reportType === "full" ? "" : `_${reportType}`;
      a.download = `IIMC${reportLabel}_Report_${dateStr.replace(/-/g, "")}.${format === "excel" ? "xlsx" : "pdf"}`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} ${format.toUpperCase()} report downloaded`);
    } catch (e) {
      toast.error("Failed to generate report");
    }
    setDownloading(false);
  };

  const getFilterSummary = () => {
    const filters = [];
    if (reportType !== "full") filters.push(REPORT_TYPES.find(r => r.value === reportType)?.label);
    if (startDate || endDate) filters.push(`${startDate || "Start"} to ${endDate || "Present"}`);
    if (phase !== "all") filters.push(PHASES.find(p => p.value === phase)?.label);
    if (status !== "all") filters.push(STATUSES.find(s => s.value === status)?.label);
    if (includeHistory) filters.push("With History");
    return filters.length > 0 ? filters : ["All tasks, no filters"];
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto" data-testid="reports-page">
      <div>
        <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500 mt-1">Generate filtered reports for stakeholder meetings</p>
      </div>

      {/* Report Type Selection */}
      <Card className="border-slate-200 shadow-sm" data-testid="report-type-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            Report Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {REPORT_TYPES.map(({ value, label, icon: Icon, description }) => (
              <button
                key={value}
                onClick={() => setReportType(value)}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                  reportType === value 
                    ? "border-slate-900 bg-slate-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                data-testid={`report-type-${value}`}
              >
                <Icon className={`w-6 h-6 mb-2 ${reportType === value ? "text-slate-900" : "text-slate-400"}`} />
                <p className={`text-sm font-semibold ${reportType === value ? "text-slate-900" : "text-slate-700"}`}>{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm" data-testid="filters-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">From</label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="h-10"
                  data-testid="start-date-input"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">To</label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="h-10"
                  data-testid="end-date-input"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Filter tasks active within this date range</p>
          </div>

          {/* Phase & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Phase</label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger className="h-10" data-testid="phase-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        {s.color && <span className={`w-2 h-2 rounded-full ${s.color.split(' ')[0]}`} />}
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Include History Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-violet-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">Include Update History</p>
                <p className="text-xs text-slate-500">Add a sheet/section with recent task updates</p>
              </div>
            </div>
            <Switch 
              checked={includeHistory} 
              onCheckedChange={setIncludeHistory}
              data-testid="include-history-toggle"
            />
          </div>
        </CardContent>
      </Card>

      {/* Format & Download */}
      <Card className="border-slate-200 shadow-sm" data-testid="download-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Download className="w-5 h-5 text-slate-500" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Output Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat("excel")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  format === "excel" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                data-testid="format-excel"
              >
                <FileSpreadsheet className={`w-8 h-8 ${format === "excel" ? "text-emerald-600" : "text-slate-400"}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold ${format === "excel" ? "text-emerald-700" : "text-slate-700"}`}>Excel (.xlsx)</p>
                  <p className="text-xs text-slate-500">Multi-sheet with colors</p>
                </div>
              </button>
              <button
                onClick={() => setFormat("pdf")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  format === "pdf" 
                    ? "border-red-500 bg-red-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                data-testid="format-pdf"
              >
                <FileText className={`w-8 h-8 ${format === "pdf" ? "text-red-600" : "text-slate-400"}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold ${format === "pdf" ? "text-red-700" : "text-slate-700"}`}>PDF</p>
                  <p className="text-xs text-slate-500">Printable landscape</p>
                </div>
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Report will include:</p>
            <div className="flex flex-wrap gap-2">
              {getFilterSummary().map((filter, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-white">{filter}</Badge>
              ))}
            </div>
            {stats && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900">{stats.total_tasks}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Total Tasks</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">{stats.status_counts?.completed || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Completed</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{(stats.status_counts?.at_risk || 0) + (stats.status_counts?.delayed || 0)}</p>
                  <p className="text-[10px] text-slate-500 uppercase">At Risk/Delayed</p>
                </div>
              </div>
            )}
          </div>

          {/* Report Contents */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Report contains:</p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Task list with hierarchy, progress, and dates
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                At-risk items (separate sheet/section)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Delayed items (separate sheet/section)
              </li>
              {includeHistory && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Update history with timestamps and notes
                </li>
              )}
            </ul>
          </div>

          {/* Download Button */}
          <Button
            onClick={downloadReport}
            disabled={downloading}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm tracking-wide"
            data-testid="download-report-btn"
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating Report...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Download {REPORT_TYPES.find(r => r.value === reportType)?.label} ({format.toUpperCase()})</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
