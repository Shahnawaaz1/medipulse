import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Department from "@/models/Department";
import Doctor from "@/models/Doctor";

export async function GET() {
  try {
    await connectToDatabase();
    const departments = await Department.find().sort({ name: 1 });

    // Update doctor counts dynamically
    const deptsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const count = await Doctor.countDocuments({ department: dept.name });
        return {
          ...dept.toObject(),
          totalDoctors: count,
        };
      })
    );

    return NextResponse.json({ success: true, departments: deptsWithCounts, data: deptsWithCounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const dept = await Department.create(body);
    return NextResponse.json({ success: true, department: dept }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
