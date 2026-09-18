import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, members } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "daily";
    const dateParam = searchParams.get("date");

    const today = new Date();
    let startDate: string;
    let endDate: string;

    if (dateParam) {
      startDate = dateParam;
      endDate = dateParam;
    } else {
      endDate = today.toISOString().split("T")[0];
      switch (type) {
        case "daily":
          startDate = endDate;
          break;
        case "weekly": {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - 7);
          startDate = weekStart.toISOString().split("T")[0];
          break;
        }
        case "monthly": {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = monthStart.toISOString().split("T")[0];
          break;
        }
        default:
          startDate = endDate;
      }
    }

    const allMembers = await db.select().from(members);
    const records = await db
      .select()
      .from(attendance)
      .where(
        and(gte(attendance.date, startDate), lte(attendance.date, endDate))
      )
      .orderBy(desc(attendance.date));

    const report = allMembers.map((member) => {
      const memberRecords = records.filter((r) => r.memberId === member.id);
      const presentDays = memberRecords.filter(
        (r) => r.status === "present"
      ).length;
      const absentDays = memberRecords.filter(
        (r) => r.status === "absent"
      ).length;
      const total = presentDays + absentDays;
      const percentage = total > 0 ? Math.round((presentDays / total) * 100) : 0;

      return {
        id: member.id,
        fullName: member.fullName,
        presentDays,
        absentDays,
        totalDays: total,
        percentage,
        lastRecord: memberRecords[0] || null,
      };
    });

    const totalPresent = report.reduce((sum, r) => sum + r.presentDays, 0);
    const totalAbsent = report.reduce((sum, r) => sum + r.absentDays, 0);
    const totalRecords = totalPresent + totalAbsent;
    const overallPercentage =
      totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    return NextResponse.json({
      report,
      summary: {
        totalMembers: allMembers.length,
        totalPresent,
        totalAbsent,
        overallPercentage,
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
