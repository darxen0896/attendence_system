import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const filter = searchParams.get("filter") || "all";
    const customDate = searchParams.get("date");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filter) {
      case "today":
        startDate = new Date(today.toISOString().split("T")[0]);
        endDate = new Date(startDate);
        break;
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.toISOString().split("T")[0]);
        endDate = new Date(startDate);
        break;
      }
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = new Date(weekStart.toISOString().split("T")[0]);
        endDate = new Date(today.toISOString().split("T")[0]);
        break;
      }
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = new Date(monthStart.toISOString().split("T")[0]);
        endDate = new Date(today.toISOString().split("T")[0]);
        break;
      }
      case "custom":
        if (customDate) {
          startDate = new Date(customDate);
          endDate = new Date(customDate);
        }
        break;
    }

    const conditions = [eq(attendance.memberId, parseInt(memberId))];
    if (startDate) {
      conditions.push(gte(attendance.date, startDate.toISOString().split("T")[0]));
    }
    if (endDate) {
      conditions.push(lte(attendance.date, endDate.toISOString().split("T")[0]));
    }

    const records = await db
      .select()
      .from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    // Calculate stats
    const totalPresent = records.filter((r) => r.status === "present").length;
    const totalAbsent = records.filter((r) => r.status === "absent").length;
    const total = records.length;
    const percentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

    return NextResponse.json({
      records,
      stats: {
        totalPresent,
        totalAbsent,
        total,
        percentage,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance history" },
      { status: 500 }
    );
  }
}
