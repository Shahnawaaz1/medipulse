import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Doctor from "@/models/Doctor";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { doctorId: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }
    if (department) query.department = department;
    if (status) query.status = status;

    const doctors = await Doctor.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, doctors, data: doctors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.doctorId) {
      const count = await Doctor.countDocuments();
      body.doctorId = `DOC-${1000 + count + 1}`;
    }

    const doctor = await Doctor.create(body);
    return NextResponse.json({ success: true, doctor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
