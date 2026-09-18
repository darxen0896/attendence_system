import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { desc, eq, like, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "name_asc";

    let allMembers;

    if (search) {
      allMembers = await db
        .select()
        .from(members)
        .where(like(sql`lower(${members.fullName})`, `%${search.toLowerCase()}%`));
    } else {
      allMembers = await db.select().from(members);
    }

    // Sort
    switch (sort) {
      case "name_asc":
        allMembers.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case "name_desc":
        allMembers.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case "recent":
        allMembers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        allMembers.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return NextResponse.json(allMembers);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phoneNumber, age, notes } = body;

    if (!fullName || fullName.trim() === "") {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const result = await db
      .insert(members)
      .values({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber || null,
        age: age || null,
        notes: notes || null,
      });

    // Fetch the newly inserted member using insertId
    const insertId = result[0].insertId;
    const [newMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, insertId));

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
