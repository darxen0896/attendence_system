"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Search,
  Check,
  X,
  RotateCcw,
  CheckCheck,
  UserX,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Eye,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Member, AttendanceRecord } from "@/types";

interface AttendanceTableProps {
  onViewMemberDetails: (member: Member) => void;
}

export function AttendanceTable({ onViewMemberDetails }: AttendanceTableProps) {
  const { members, addToast, refreshStats } = useApp();

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [dateRecords, setDateRecords] = useState<Record<number, AttendanceRecord>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "pending">("all");
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch attendance records for the selected date
  const fetchDateAttendance = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      if (res.ok) {
        const records: AttendanceRecord[] = await res.json();
        const map: Record<number, AttendanceRecord> = {};
        records.forEach((r) => {
          map[r.memberId] = r;
        });
        setDateRecords(map);
      }
    } catch (err) {
      console.error("Error fetching date attendance:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDateAttendance(selectedDate);
  }, [selectedDate, fetchDateAttendance]);

  // Mark single member attendance
  const handleMark = async (memberId: number, status: "present" | "absent") => {
    // Optimistic local update
    const previous = dateRecords[memberId];
    const nowIso = new Date().toISOString();
    setDateRecords((prev) => ({
      ...prev,
      [memberId]: {
        id: previous?.id ?? Date.now(),
        memberId,
        date: selectedDate,
        status,
        markedAt: nowIso,
      },
    }));

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          status,
          date: selectedDate,
        }),
      });

      if (res.ok) {
        const record: AttendanceRecord = await res.json();
        setDateRecords((prev) => ({
          ...prev,
          [memberId]: record,
        }));
        if (selectedDate === getTodayStr()) {
          await refreshStats();
        }
      } else {
        // Rollback
        setDateRecords((prev) => {
          const next = { ...prev };
          if (previous) next[memberId] = previous;
          else delete next[memberId];
          return next;
        });
        addToast("Failed to mark attendance", "error");
      }
    } catch {
      setDateRecords((prev) => {
        const next = { ...prev };
        if (previous) next[memberId] = previous;
        else delete next[memberId];
        return next;
      });
      addToast("Failed to mark attendance", "error");
    }
  };

  // Batch Mark All
  const handleBatchMark = async (status: "present" | "absent") => {
    if (members.length === 0) return;
    const confirmMsg = `Are you sure you want to mark all ${members.length} members as "${status === "present" ? "Present" : "Absent"}" for ${selectedDate}?`;
    if (!window.confirm(confirmMsg)) return;

    setBatchLoading(true);
    try {
      for (const m of members) {
        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: m.id,
            status,
            date: selectedDate,
          }),
        });
      }
      addToast(`Marked all members as ${status === "present" ? "Present" : "Absent"}!`, "success");
      await fetchDateAttendance(selectedDate);
      if (selectedDate === getTodayStr()) {
        await refreshStats();
      }
    } catch {
      addToast("Error during batch attendance update", "error");
    } finally {
      setBatchLoading(false);
    }
  };

  // Reset attendance for selected date
  const handleResetDate = async () => {
    if (!window.confirm(`Reset all attendance records for ${selectedDate}?`)) return;

    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}`, {
        method: "DELETE",
      });
      if (res.ok) {
        addToast(`Attendance for ${selectedDate} has been reset.`, "success");
        setDateRecords({});
        if (selectedDate === getTodayStr()) {
          await refreshStats();
        }
      } else {
        addToast("Failed to reset attendance", "error");
      }
    } catch {
      addToast("Failed to reset attendance", "error");
    }
  };

  // Quick date navigation
  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Computed summary stats
  const totalCount = members.length;
  let presentCount = 0;
  let absentCount = 0;

  members.forEach((m) => {
    const rec = dateRecords[m.id];
    if (rec?.status === "present") presentCount++;
    else if (rec?.status === "absent") absentCount++;
  });

  const pendingCount = totalCount - presentCount - absentCount;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search
      const matchesSearch =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phoneNumber && m.phoneNumber.includes(searchQuery)) ||
        (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filter
      const status = dateRecords[m.id]?.status || "pending";
      if (statusFilter === "all") return true;
      return status === statusFilter;
    });
  }, [members, searchQuery, statusFilter, dateRecords]);

  const isToday = selectedDate === getTodayStr();

  return (
    <div className="space-y-6">
      {/* Top Header Bar: Date Picker & Quick Selectors */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Calendar size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Attendance Register
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a date to track, view, and mark attendance in table view
                </p>
              </div>
            </div>
          </div>

          {/* Date Selector & Navigation Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => adjustDate(-1)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => adjustDate(1)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isToday
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {/* Real-Time Stats Summary for this Date */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/60">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Members</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-900/40">
            <div className="flex items-center justify-between">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Present</p>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{rate}%</span>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{presentCount}</p>
          </div>
          <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-xl p-3 border border-rose-200/50 dark:border-rose-900/40">
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Absent</p>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">{absentCount}</p>
          </div>
          <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200/50 dark:border-amber-900/40">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Pending</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Controls & Batch Actions Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search member name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Batch Actions: Mark All Present, Mark All Absent, Reset Date */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBatchMark("present")}
              disabled={batchLoading || totalCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>Mark All Present</span>
            </button>

            <button
              onClick={() => handleBatchMark("absent")}
              disabled={batchLoading || totalCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <UserX size={14} />
              <span>Mark All Absent</span>
            </button>

            <button
              onClick={handleResetDate}
              disabled={batchLoading || (presentCount === 0 && absentCount === 0)}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title="Reset attendance for this date"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 pr-1">
            <Filter size={12} /> Filter:
          </span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter("present")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === "present"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
            }`}
          >
            Present ({presentCount})
          </button>
          <button
            onClick={() => setStatusFilter("absent")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === "absent"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100"
            }`}
          >
            Absent ({absentCount})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100"
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* Main Attendance Table View */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              No matching members found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {members.length === 0
                ? "No members registered yet. Add members in the dashboard to manage attendance."
                : "Try adjusting your search query or status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 sm:px-6">Member</th>
                  <th className="py-3.5 px-4 sm:px-6">Contact</th>
                  <th className="py-3.5 px-4 sm:px-6">Age</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Marked At</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Quick Action</th>
                  <th className="py-3.5 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filteredMembers.map((member, idx) => {
                  const record = dateRecords[member.id];
                  const status = record?.status || null;
                  const initial = member.fullName.trim().charAt(0).toUpperCase() || "M";

                  const formattedTime = record?.markedAt
                    ? new Date(record.markedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : null;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors group"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-400 text-center font-mono">
                        {idx + 1}
                      </td>

                      {/* Member info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <button
                              onClick={() => onViewMemberDetails(member)}
                              className="font-bold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors cursor-pointer text-sm"
                            >
                              {member.fullName}
                            </button>
                            {member.notes && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {member.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-600 dark:text-slate-300">
                        {member.phoneNumber ? (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone size={11} className="text-slate-400" />
                            {member.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Age */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-600 dark:text-slate-300">
                        {member.age ? `${member.age} yrs` : <span className="text-slate-400 italic">—</span>}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        {status === "present" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Present
                          </span>
                        ) : status === "absent" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Absent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Marked Time */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formattedTime ? (
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {formattedTime}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          <button
                            onClick={() => handleMark(member.id, "present")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              status === "present"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                            }`}
                            title="Mark Present"
                          >
                            <Check size={13} />
                            <span>Present</span>
                          </button>

                          <button
                            onClick={() => handleMark(member.id, "absent")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              status === "absent"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                            }`}
                            title="Mark Absent"
                          >
                            <X size={13} />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>

                      {/* View Details Icon */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onViewMemberDetails(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="View Attendance History"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
