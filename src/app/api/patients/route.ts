import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Patient from "@/models/Patient";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const gender = searchParams.get("gender") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (gender) query.gender = gender;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (status) query.status = status;

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Auto-generate patient ID if missing
    if (!body.patientId) {
      const count = await Patient.countDocuments();
      body.patientId = `PAT-${8000 + count + 1}`;
    }

    const newPatient = await Patient.create(body);
    return NextResponse.json({ success: true, patient: newPatient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
