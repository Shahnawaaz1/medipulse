import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Admission from "@/models/Admission";
import Bed from "@/models/Bed";
import Patient from "@/models/Patient";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const department = searchParams.get("department") || "";

    const query: any = {};
    if (status) query.status = status;
    if (department) query.department = department;

    const admissions = await Admission.find(query)
      .populate("patient doctor bed")
      .sort({ admissionDate: -1 })
      .lean();

    return NextResponse.json({ success: true, admissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.admissionId) {
      const count = await Admission.countDocuments();
      body.admissionId = `ADM-${9000 + count + 1}`;
    }

    const newAdmission = await Admission.create(body);

    // Update patient status to Inpatient
    const patientDoc = await Patient.findByIdAndUpdate(body.patient, {
      status: "Inpatient",
    });

    // Update bed status to Occupied
    if (body.bed) {
      await Bed.findByIdAndUpdate(body.bed, {
        status: "Occupied",
        currentAdmission: newAdmission._id,
        patientName: patientDoc?.name || "Admitted Patient",
      });
    }

    const populated = await Admission.findById(newAdmission._id).populate(
      "patient doctor bed"
    );

    return NextResponse.json({ success: true, admission: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
