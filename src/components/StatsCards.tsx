"use client";

import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function StatsCards() {
  const { stats } = useApp();

  const cards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      badge: "Registered",
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      bgColor: "bg-blue-100/70 dark:bg-blue-950/60",
      textColor: "text-blue-600 dark:text-blue-400",
      accentBorder: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    {
      title: "Present Today",
      value: stats.presentCount,
      icon: UserCheck,
      badge: "Active",
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      bgColor: "bg-emerald-100/70 dark:bg-emerald-950/60",
      textColor: "text-emerald-600 dark:text-emerald-400",
      accentBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    {
      title: "Absent Today",
      value: stats.absentCount,
      icon: UserX,
      badge: "Missing",
      badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
      bgColor: "bg-rose-100/70 dark:bg-rose-950/60",
      textColor: "text-rose-600 dark:text-rose-400",
      accentBorder: "hover:border-rose-300 dark:hover:border-rose-700",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendancePercentage}%`,
      icon: TrendingUp,
      badge: "Today",
      badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      bgColor: "bg-amber-100/70 dark:bg-amber-950/60",
      textColor: "text-amber-600 dark:text-amber-400",
      accentBorder: "hover:border-amber-300 dark:hover:border-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200 group ${card.accentBorder}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${card.bgColor} transition-transform group-hover:scale-105`}>
              <card.icon size={20} className={card.textColor} />
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {card.value}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {card.title}
          </p>
        </div>
      ))}
    </div>
  );
}
