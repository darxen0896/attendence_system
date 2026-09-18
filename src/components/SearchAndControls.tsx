"use client";

import { Search, Plus, ArrowUpDown, RotateCcw, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { SortOption } from "@/types";

interface SearchAndControlsProps {
  onAddMember: () => void;
  onResetAttendance: () => void;
}

export function SearchAndControls({ onAddMember }: SearchAndControlsProps) {
  const { searchQuery, setSearchQuery, sortOption, setSortOption, addToast, refreshStats, refreshMembers } = useApp();

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset today's attendance for all members?")) {
      try {
        const res = await fetch("/api/attendance", { method: "DELETE" });
        if (res.ok) {
          addToast("Today's attendance has been reset", "success");
          await refreshStats();
          await refreshMembers();
        } else {
          addToast("Failed to reset attendance", "error");
        }
      } catch {
        addToast("Failed to reset attendance", "error");
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          type="text"
          placeholder="Search by member name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
        />
      </div>

      {/* Actions: Sort, Reset, Add Member */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Sort Dropdown */}
        <div className="relative flex-1 sm:flex-initial">
          <ArrowUpDown
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="w-full sm:w-auto pl-8 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all shadow-2xs"
          >
            <option value="name_asc">Name (A → Z)</option>
            <option value="name_desc">Name (Z → A)</option>
            <option value="recent">Recently Added</option>
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Reset Attendance Button */}
        <button
          onClick={handleReset}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800/60 dark:hover:text-rose-400 transition-all cursor-pointer shadow-2xs"
          title="Reset Today's Attendance for All"
        >
          <RotateCcw size={16} />
        </button>

        {/* Add Member Button */}
        <button
          onClick={onAddMember}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Member</span>
        </button>
      </div>
    </div>
  );
}
