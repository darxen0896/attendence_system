"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { ReportData } from "@/types";

export function ReportsPanel({ onClose }: { onClose: () => void }) {
  const { addToast } = useApp();
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        addToast("Failed to generate report", "error");
      }
    } catch {
      addToast("Failed to generate report", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    const headers = "Name,Present Days,Absent Days,Total Days,Percentage\n";
    const rows = reportData.report
      .map(
        (r) =>
          `"${r.fullName}",${r.presentDays},${r.absentDays},${r.totalDays},${r.percentage}%`
      )
      .join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Report exported as CSV", "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-blue-500" />
            Attendance Reports
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              {(["daily", "weekly", "monthly"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    reportType === type
                      ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={generateReport}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {/* Report Data */}
          {reportData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <Users size={16} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {reportData.summary.totalMembers}
                  </p>
                  <p className="text-[10px] text-blue-600/70">Total Members</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {reportData.summary.totalPresent}
                  </p>
                  <p className="text-[10px] text-emerald-600/70">Present Records</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {reportData.summary.totalAbsent}
                  </p>
                  <p className="text-[10px] text-red-600/70">Absent Records</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                  <TrendingUp size={16} className="text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {reportData.summary.overallPercentage}%
                  </p>
                  <p className="text-[10px] text-amber-600/70">Overall Rate</p>
                </div>
              </div>

              {/* Period */}
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar size={12} />
                Period: {reportData.summary.period.startDate} to{" "}
                {reportData.summary.period.endDate}
              </p>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                        Name
                      </th>
                      <th className="text-center px-3 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                        Present
                      </th>
                      <th className="text-center px-3 py-3 font-medium text-red-600 dark:text-red-400">
                        Absent
                      </th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600 dark:text-slate-300">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {reportData.report.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                          {row.fullName}
                        </td>
                        <td className="text-center px-3 py-3 text-emerald-600 dark:text-emerald-400">
                          {row.presentDays}
                        </td>
                        <td className="text-center px-3 py-3 text-red-600 dark:text-red-400">
                          {row.absentDays}
                        </td>
                        <td className="text-center px-3 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.percentage >= 75
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : row.percentage >= 50
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Export */}
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all"
              >
                <Download size={16} />
                Export as CSV
              </button>
            </>
          )}

          {!reportData && !isLoading && (
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Select a report type and click Generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
