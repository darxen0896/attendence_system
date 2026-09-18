"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Calendar, Clock, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { darkMode, toggleDarkMode } = useApp();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "";

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <header className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80 sticky top-0 z-40 h-16 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-sm tracking-tight">YM</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                MyYuvakMandal
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none">
                Attendance Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right tools: Date, Time, Status, Dark Mode, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Database status pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MySQL Active</span>
          </div>

          {/* Date & Time */}
          {mounted && currentTime && (
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-600/40">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-500" />
                <span>{formattedDate}</span>
              </div>
              <div className="h-3 w-px bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" />
                <span className="font-mono font-medium">{formattedTime}</span>
              </div>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {mounted ? (
              darkMode ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} className="text-slate-600" />
              )
            ) : (
              <div className="w-[17px] h-[17px]" />
            )}
          </button>

          {/* User Auth Profile & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 pl-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <UserIcon size={14} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
