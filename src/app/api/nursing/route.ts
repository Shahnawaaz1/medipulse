import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import NursingCare from "@/models/NursingCare";
import Admission from "@/models/Admission";
import Patient from "@/models/Patient";
import Bed from "@/models/Bed";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patient");
    const admissionId = searchParams.get("admission");
    const shift = searchParams.get("shift");

    const query: any = {};
    if (patientId) query.patient = patientId;
    if (admissionId) query.admission = admissionId;
    if (shift && shift !== "All") query.shift = shift;

    const nursingRecords = await NursingCare.find(query)
      .populate("patient")
      .populate("admission")
      .sort({ date: -1, createdAt: -1 });

    // Also fetch currently admitted patients for nurse workstation assignment
    const activeAdmissions = await Admission.find({
      status: { $in: ["Admitted", "Under Treatment", "Ready for Discharge"] },
    })
      .populate("patient")
      .populate("doctor")
      .populate("bed")
      .sort({ admissionDate: -1 });

    return NextResponse.json({
      success: true,
      records: nursingRecords,
      activeAdmissions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const body = await req.json();

    const newRecord = await NursingCare.create(body);

    await logAudit(req, {
      action: "CREATE",
      module: "NURSING",
      recordId: newRecord._id?.toString(),
      recordTitle: `Nursing Chart Entry`,
      details: `Logged nurse chart for patient. Shift: ${newRecord.shift}. Nurse: ${newRecord.nurse}`,
    });

    return NextResponse.json({ success: true, record: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
