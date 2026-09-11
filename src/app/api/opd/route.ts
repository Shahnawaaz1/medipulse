import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import OpdRecord from "@/models/OpdRecord";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const query: any = { date };
    if (department) query.department = department;
    if (status) query.status = status;

    const opdQueue = await OpdRecord.find(query)
      .populate("patient")
      .populate("doctor")
      .sort({ tokenNumber: 1 });

    return NextResponse.json({ success: true, opdQueue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const today = body.date || new Date().toISOString().split("T")[0];

    // Find highest token number for today
    const lastRecord = await OpdRecord.findOne({ date: today }).sort({ tokenNumber: -1 });
    const nextToken = lastRecord ? lastRecord.tokenNumber + 1 : 101;

    body.tokenNumber = nextToken;
    body.date = today;

    const newOpd = await OpdRecord.create(body);
    const populated = await OpdRecord.findById(newOpd._id).populate("patient doctor");
    return NextResponse.json({ success: true, opdRecord: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
