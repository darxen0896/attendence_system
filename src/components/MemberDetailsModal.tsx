"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Member, AttendanceRecord } from "@/types";

interface MemberDetailsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function MemberDetailsModal({
  member,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: MemberDetailsModalProps) {
  const { addToast } = useApp();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    total: 0,
    percentage: 0,
  });
  const [todayStatus, setTodayStatus] = useState<"present" | "absent" | null>(null);
  const [todayTime, setTodayTime] = useState<string | null>(null);
  const [lastAttendance, setLastAttendance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (member && isOpen) {
      fetchDetails();
    }
  }, [member, isOpen, filter]);

  if (!isOpen || !member) return null;

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch today's attendance
      const today = new Date().toISOString().split("T")[0];
      const todayRes = await fetch(
        `/api/attendance?memberId=${member.id}&date=${today}`
      );
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        if (todayData.length > 0) {
          setTodayStatus(todayData[0].status);
          setTodayTime(
            new Date(todayData[0].markedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          );
        } else {
          setTodayStatus(null);
          setTodayTime(null);
        }
      }

      // Fetch history
      const historyRes = await fetch(
        `/api/attendance/history?memberId=${member.id}&filter=${filter}`
      );
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.records);
        setStats(data.stats);
      }

      // Fetch last attendance date
      const allRes = await fetch(
        `/api/attendance/history?memberId=${member.id}&filter=all`
      );
      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData.records.length > 0) {
          setLastAttendance(allData.records[0].date);
        }
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <User size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {member.fullName}
              </h2>
              {member.phoneNumber && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Phone size={10} />
                  {member.phoneNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(member)}
              className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700 transition-colors"
              title="Edit"
            >
              <Edit size={16} className="text-slate-500 dark:text-slate-400" />
            </button>
            <button
              onClick={() => onDelete(member)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={16} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-5 space-y-5">
          {/* Today's Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Today&apos;s Status
              </p>
              {todayStatus ? (
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                    todayStatus === "present"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {todayStatus === "present" ? "🟢 Present" : "🔴 Absent"}
                </span>
              ) : (
                <span className="text-sm text-slate-400">Not marked</span>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Marked Time
              </p>
              {todayTime ? (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock size={12} />
                  {todayTime}
                </span>
              ) : (
                <span className="text-sm text-slate-400">--</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats.totalPresent}
              </p>
              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                Present
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.totalAbsent}
              </p>
              <p className="text-[10px] text-red-600/70 dark:text-red-400/70">
                Absent
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats.total}
              </p>
              <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
                Total Days
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {stats.percentage}%
              </p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                Rate
              </p>
            </div>
          </div>

          {/* Member Info */}
          {(member.age || member.notes || lastAttendance) && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Member Info
              </h4>
              {member.age && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar size={12} /> Age: {member.age}
                </p>
              )}
              {lastAttendance && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock size={12} /> Last Attendance: {lastAttendance}
                </p>
              )}
              {member.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <FileText size={12} className="mt-0.5 flex-shrink-0" />
                  {member.notes}
                </p>
              )}
            </div>
          )}

          {/* Attendance History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <TrendingUp size={14} />
                Attendance History
              </h4>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          record.status === "present"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {record.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          record.status === "present"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {record.status === "present" ? "Present" : "Absent"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(record.markedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                No attendance records found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
