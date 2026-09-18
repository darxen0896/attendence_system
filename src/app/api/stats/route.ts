import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, members } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET() {
  try {
    const today = getTodayDate();

    // Total members
    const allMembers = await db.select().from(members);
    const totalMembers = allMembers.length;

    // Today's attendance
    const todayAttendance = await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, today));

    const presentCount = todayAttendance.filter(
      (a) => a.status === "present"
    ).length;
    const absentCount = totalMembers - presentCount;
    const attendancePercentage =
      totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

    return NextResponse.json({
      totalMembers,
      presentCount,
      absentCount,
      attendancePercentage,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
