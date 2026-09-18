"use client";

import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  Download,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReports: () => void;
  activeTab: "dashboard" | "attendance";
  onSelectTab: (tab: "dashboard" | "attendance") => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onOpenReports,
  activeTab,
  onSelectTab,
}: SidebarProps) {
  const { addToast, refreshMembers, refreshStats } = useApp();

  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());

      let successCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
        const fullName = cols[0];
        if (!fullName) continue;

        try {
          const res = await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName,
              phoneNumber: cols[1] || null,
              age: cols[2] ? parseInt(cols[2]) : null,
              notes: cols[3] || null,
            }),
          });
          if (res.ok) successCount++;
        } catch {
          // skip
        }
      }

      if (successCount > 0) {
        addToast(`Imported ${successCount} members successfully!`, "success");
        await refreshMembers();
        await refreshStats();
      } else {
        addToast("No members were imported. Check CSV format.", "error");
      }
    };
    input.click();
  };

  const handleExportAll = async () => {
    try {
      const res = await fetch("/api/reports?type=monthly");
      if (res.ok) {
        const data = await res.json();
        const headers = "Name,Phone,Age,Present Days,Absent Days,Total Days,Percentage\n";
        const rows = data.report
          .map(
            (r: { fullName: string; presentDays: number; absentDays: number; totalDays: number; percentage: number }) =>
              `"${r.fullName}",${r.presentDays},${r.absentDays},${r.totalDays},${r.percentage}%`
          )
          .join("\n");
        const csv = headers + rows;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance-export-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        addToast("Attendance data exported successfully!", "success");
      }
    } catch {
      addToast("Failed to export data", "error");
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/80 z-40 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Main Menu
          </div>

          {/* Dashboard Tab */}
          <button
            onClick={() => {
              onSelectTab("dashboard");
              window.scrollTo({ top: 0, behavior: "smooth" });
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          {/* Attendance Tab */}
          <button
            onClick={() => {
              onSelectTab("attendance");
              window.scrollTo({ top: 0, behavior: "smooth" });
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "attendance"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ClipboardCheck size={18} />
            <span>Attendance</span>
          </button>

          {/* Reports & Analytics Tab */}
          <button
            onClick={() => {
              onOpenReports();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            <FileText size={18} />
            <span>Reports & Analytics</span>
          </button>

          <div className="pt-4 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Data Tools
          </div>

          <button
            onClick={() => {
              handleImportCSV();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            <Upload size={18} />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => {
              handleExportAll();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/60">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck size={16} className="text-blue-200" />
              <p className="text-xs font-semibold tracking-wide uppercase text-blue-100">
                Attendance System
              </p>
            </div>
            <p className="text-sm font-bold text-white">MyYuvakMandal</p>
            <p className="text-[11px] text-blue-100/75 mt-0.5">
              MySQL Database Connected
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
