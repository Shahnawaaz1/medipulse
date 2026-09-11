import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Prescription from "@/models/Prescription";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patient") || "";
    const doctorId = searchParams.get("doctor") || "";

    const query: any = {};
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;

    const prescriptions = await Prescription.find(query)
      .populate("patient doctor")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, prescriptions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.prescriptionId) {
      const count = await Prescription.countDocuments();
      body.prescriptionId = `RX-${4000 + count + 1}`;
    }
    if (!body.date) {
      body.date = new Date().toISOString().split("T")[0];
    }

    const prescription = await Prescription.create(body);
    const populated = await Prescription.findById(prescription._id).populate("patient doctor");
    return NextResponse.json({ success: true, prescription: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
