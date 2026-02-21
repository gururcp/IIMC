import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LayoutDashboard, ListTree, BarChart3, FileText, HardHat, Menu, X } from "lucide-react";
import { useState } from "react";
import Dashboard from "@/pages/Dashboard";
import TaskTree from "@/pages/TaskTree";
import GanttView from "@/pages/GanttView";
import Reports from "@/pages/Reports";

const navLinks = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks", icon: ListTree, label: "Tasks" },
  { to: "/gantt", icon: BarChart3, label: "Gantt Chart" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

function Sidebar({ open, setOpen }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed lg:static z-40 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-slate-900" data-testid="app-title">ConstructOS</h1>
            <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">IIMC Amravati</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5" data-testid="sidebar-nav">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`
              }
              data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center tracking-wide">Western Regional Center</p>
        </div>
      </aside>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50/80">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center px-4 lg:px-6 sticky top-0 z-20">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 mr-3"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="mobile-menu-btn"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex-1" />
          </header>
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskTree />} />
              <Route path="/gantt" element={<GanttView />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
