import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Admission from "@/models/Admission";
import Bed from "@/models/Bed";
import Patient from "@/models/Patient";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const admission = await Admission.findById(params.id).populate("patient doctor bed");
    if (!admission) {
      return NextResponse.json({ error: "Admission record not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, admission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const existing = await Admission.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    // If status changed to Discharged
    if (body.status === "Discharged") {
      body.dischargeDate = body.dischargeDate || new Date().toISOString().split("T")[0];
      // Release the bed
      if (existing.bed) {
        await Bed.findByIdAndUpdate(existing.bed, {
          status: "Available",
          currentAdmission: null,
          patientName: "",
        });
      }
      // Update patient status
      if (existing.patient) {
        await Patient.findByIdAndUpdate(existing.patient, {
          status: "Discharged",
        });
      }
    }

    // If bed was transferred to a new bed
    if (body.bed && body.bed.toString() !== existing.bed?.toString()) {
      // Release old bed
      if (existing.bed) {
        await Bed.findByIdAndUpdate(existing.bed, {
          status: "Available",
          currentAdmission: null,
          patientName: "",
        });
      }
      // Occupy new bed
      const patientDoc = await Patient.findById(existing.patient);
      await Bed.findByIdAndUpdate(body.bed, {
        status: "Occupied",
        currentAdmission: existing._id,
        patientName: patientDoc?.name || "Admitted Patient",
      });
    }

    const updated = await Admission.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor bed");

    return NextResponse.json({ success: true, admission: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
