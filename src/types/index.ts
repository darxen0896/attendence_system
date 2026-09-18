export interface Member {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  age: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: number;
  memberId: number;
  date: string;
  status: "present" | "absent";
  markedAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export interface AttendanceHistory {
  records: AttendanceRecord[];
  stats: {
    totalPresent: number;
    totalAbsent: number;
    total: number;
    percentage: number;
  };
}

export interface ReportData {
  report: {
    id: number;
    fullName: string;
    presentDays: number;
    absentDays: number;
    totalDays: number;
    percentage: number;
    lastRecord: AttendanceRecord | null;
  }[];
  summary: {
    totalMembers: number;
    totalPresent: number;
    totalAbsent: number;
    overallPercentage: number;
    period: { startDate: string; endDate: string };
  };
}

export type SortOption = "name_asc" | "name_desc" | "present_first" | "absent_first" | "recent";
export type FilterOption = "all" | "today" | "yesterday" | "week" | "month" | "custom";
