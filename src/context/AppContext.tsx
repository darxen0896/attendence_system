"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Member, DashboardStats, SortOption } from "@/types";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  members: Member[];
  stats: DashboardStats;
  searchQuery: string;
  sortOption: SortOption;
  darkMode: boolean;
  toasts: Toast[];
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  toggleDarkMode: () => void;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
  refreshMembers: () => Promise<void>;
  refreshStats: () => Promise<void>;
  updateMemberAttendance: (memberId: number, status: "present" | "absent") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    presentCount: 0,
    absentCount: 0,
    attendancePercentage: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshMembers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("sort", sortOption);

      const res = await fetch(`/api/members?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, [searchQuery, sortOption]);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const updateMemberAttendance = useCallback(
    (memberId: number, status: "present" | "absent") => {
      setStats((prev) => {
        const newPresent =
          status === "present" ? prev.presentCount + 1 : prev.presentCount - 1;
        const newAbsent =
          status === "absent" ? prev.absentCount + 1 : prev.absentCount - 1;
        const total = prev.totalMembers;
        const percentage =
          total > 0 ? Math.round((Math.max(0, newPresent) / total) * 100) : 0;
        return {
          ...prev,
          presentCount: Math.max(0, newPresent),
          absentCount: Math.max(0, newAbsent),
          attendancePercentage: percentage,
        };
      });
    },
    []
  );

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", next ? "dark" : "light");
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = saved === "dark" || (!saved && prefersDark);
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([refreshMembers(), refreshStats()]);
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    refreshMembers();
  }, [searchQuery, sortOption, refreshMembers]);

  return (
    <AppContext.Provider
      value={{
        members,
        stats,
        searchQuery,
        sortOption,
        darkMode,
        toasts,
        isLoading,
        setSearchQuery,
        setSortOption,
        toggleDarkMode,
        addToast,
        removeToast,
        refreshMembers,
        refreshStats,
        updateMemberAttendance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
