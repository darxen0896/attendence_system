"use client";

import { useState, useEffect } from "react";
import { Phone, Calendar, Check, X, Trash2, Clock, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Member } from "@/types";

interface MemberCardProps {
  member: Member;
  onViewDetails: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function MemberCard({ member, onViewDetails, onDelete }: MemberCardProps) {
  const { addToast, updateMemberAttendance, refreshStats } = useApp();
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | null>(null);
  const [markedTime, setMarkedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, [member.id]);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/attendance?memberId=${member.id}&date=${today}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setAttendanceStatus(data[0].status);
          const time = new Date(data[0].markedAt);
          setMarkedTime(
            time.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          );
        } else {
          setAttendanceStatus(null);
          setMarkedTime(null);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const markAttendance = async (status: "present" | "absent") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, status }),
      });

      if (res.ok) {
        const data = await res.json();
        setAttendanceStatus(status);
        const time = new Date(data.markedAt);
        setMarkedTime(
          time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
        updateMemberAttendance(member.id, status);
        await refreshStats();
        addToast(
          `${member.fullName} marked as ${status === "present" ? "Present" : "Absent"}`,
          "success"
        );
      } else {
        addToast("Failed to mark attendance", "error");
      }
    } catch {
      addToast("Failed to mark attendance", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate consistent initial and background color
  const initial = member.fullName.trim().charAt(0).toUpperCase() || "M";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-slate-600 transition-all duration-200 flex flex-col justify-between group">
      {/* Top Header Section */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Avatar & Name Details */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => onViewDetails(member)}
            title="Click to view member history"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center flex-shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-800 dark:text-white truncate text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {member.fullName}
                </h3>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {member.phoneNumber && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <Phone size={11} className="text-slate-400 shrink-0" />
                  <span>{member.phoneNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Delete action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(member);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Remove member"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Member meta & status */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-xs">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            {member.age ? (
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                Age: {member.age}
              </span>
            ) : (
              <span className="italic text-slate-400">Age: N/A</span>
            )}
            {member.notes && (
              <span className="truncate max-w-[120px] text-slate-400" title={member.notes}>
                • {member.notes}
              </span>
            )}
          </div>

          {/* Attendance status badge */}
          {attendanceStatus === "present" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Present
            </span>
          ) : attendanceStatus === "absent" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Absent
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400">
              Pending
            </span>
          )}
        </div>

        {markedTime && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
            <Clock size={11} />
            <span>Marked at {markedTime}</span>
          </p>
        )}
      </div>

      {/* Attendance Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex gap-2">
        <button
          onClick={() => markAttendance("present")}
          disabled={isLoading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            attendanceStatus === "present"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-700/70 dark:text-slate-300 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 text-slate-700"
          }`}
        >
          <Check size={15} />
          <span>Present</span>
        </button>

        <button
          onClick={() => markAttendance("absent")}
          disabled={isLoading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            attendanceStatus === "absent"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-700/70 dark:text-slate-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-slate-700"
          }`}
        >
          <X size={15} />
          <span>Absent</span>
        </button>
      </div>
    </div>
  );
}
