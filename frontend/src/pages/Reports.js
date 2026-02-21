import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Reports() {
  const [format, setFormat] = useState("excel");
  const [downloading, setDownloading] = useState(false);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${API}/reports/generate?format=${format}`, { method: "GET" });
      if (!response.ok) throw new Error("Failed to generate report");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IIMC_Report_${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (e) {
      toast.error("Failed to generate report");
    }
    setDownloading(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto" data-testid="reports-page">
      <div>
        <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500 mt-1">Generate and download project progress reports</p>
      </div>

      <Card className="border-slate-200 shadow-sm" data-testid="report-generator">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Report Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat("excel")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${format === "excel" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                data-testid="format-excel"
              >
                <FileSpreadsheet className={`w-8 h-8 ${format === "excel" ? "text-emerald-600" : "text-slate-400"}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold ${format === "excel" ? "text-emerald-700" : "text-slate-700"}`}>Excel (.xlsx)</p>
                  <p className="text-xs text-slate-500">Multi-sheet workbook with status colors</p>
                </div>
              </button>
              <button
                onClick={() => setFormat("pdf")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${format === "pdf" ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                data-testid="format-pdf"
              >
                <FileText className={`w-8 h-8 ${format === "pdf" ? "text-red-600" : "text-slate-400"}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold ${format === "pdf" ? "text-red-700" : "text-slate-700"}`}>PDF</p>
                  <p className="text-xs text-slate-500">Printable landscape report</p>
                </div>
              </button>
            </div>
          </div>

          {/* Report Contents */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Report includes:</p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Complete project task list with hierarchy (138 items)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Progress percentage and status for each task
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Start/End dates and duration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                At-risk items (separate sheet/section)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Delayed items (separate sheet/section)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Risk flags and notes
              </li>
            </ul>
          </div>

          {/* Download */}
          <Button
            onClick={downloadReport}
            disabled={downloading}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm tracking-wide"
            data-testid="download-report-btn"
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Download {format === "excel" ? "Excel" : "PDF"} Report</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
