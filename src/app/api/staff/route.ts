import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Staff from "@/models/Staff";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "";
    const department = searchParams.get("department") || "";

    const query: any = {};
    if (role) query.role = role;
    if (department) query.department = department;

    const staffList = await Staff.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, staff: staffList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.staffId) {
      const count = await Staff.countDocuments();
      body.staffId = `STF-${100 + count + 1}`;
    }

    const staff = await Staff.create(body);
    return NextResponse.json({ success: true, staff }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
