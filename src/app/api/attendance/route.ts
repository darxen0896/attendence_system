import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, members } from "@/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDate();
    const memberId = searchParams.get("memberId");

    const conditions = [eq(attendance.date, date)];
    if (memberId) {
      conditions.push(eq(attendance.memberId, parseInt(memberId)));
    }

    const records = await db
      .select()
      .from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.markedAt));

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, status, date } = body;
    const targetDate = date || getTodayDate();

    if (!memberId || !status) {
      return NextResponse.json(
        { error: "Member ID and status are required" },
        { status: 400 }
      );
    }

    // Check if attendance already exists for targetDate
    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.memberId, memberId), eq(attendance.date, targetDate))
      );

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(attendance)
        .set({ status, markedAt: new Date() })
        .where(eq(attendance.id, existing[0].id));

      // Fetch updated record
      const [updated] = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, existing[0].id));

      return NextResponse.json(updated);
    }

    // Create new record
    const result = await db
      .insert(attendance)
      .values({
        memberId,
        date: targetDate,
        status,
        markedAt: new Date(),
      });

    // Fetch the newly inserted record using insertId
    const insertId = result[0].insertId;
    const [newRecord] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, insertId));

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get("date") || getTodayDate();
    await db.delete(attendance).where(eq(attendance.date, targetDate));
    return NextResponse.json({ message: `Attendance for ${targetDate} reset successfully` });
  } catch (error) {
    console.error("Error resetting attendance:", error);
    return NextResponse.json(
      { error: "Failed to reset attendance" },
      { status: 500 }
    );
  }
}
