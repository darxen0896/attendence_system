import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullName, phoneNumber, age, notes } = body;

    if (!fullName || fullName.trim() === "") {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const memberId = parseInt(id);

    // Check if member exists first
    const [existing] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId));

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await db
      .update(members)
      .set({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber || null,
        age: age || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));

    // Fetch the updated member
    const [updatedMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId));

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = parseInt(id);

    // Check if member exists before deleting
    const [existing] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId));

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await db
      .delete(members)
      .where(eq(members.id, memberId));

    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
