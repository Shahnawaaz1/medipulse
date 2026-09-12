import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import DischargeSummary from "@/models/DischargeSummary";
import Admission from "@/models/Admission";
import Bed from "@/models/Bed";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { triggerAsyncNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const admissionId = searchParams.get("admission");
    const patientId = searchParams.get("patient");

    const query: any = {};
    if (admissionId) query.admission = admissionId;
    if (patientId) query.patient = patientId;

    const discharges = await DischargeSummary.find(query)
      .populate("patient")
      .populate("admission")
      .populate("attendingDoctor")
      .sort({ dischargeDate: -1 });

    return NextResponse.json({ success: true, discharges });
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

    if (!body.dischargeId) {
      const count = await DischargeSummary.countDocuments();
      body.dischargeId = `DSC-2026-${String(count + 1).padStart(3, "0")}`;
    }

    const newDischarge = await DischargeSummary.create(body);

    // Update Admission status to "Discharged" and free Bed
    if (body.admission) {
      const adm = await Admission.findByIdAndUpdate(
        body.admission,
        {
          status: "Discharged",
          dischargeDate: body.dischargeDate || new Date(),
          dischargeSummary: body.clinicalSummary,
        },
        { new: true }
      );

      if (adm && adm.bed) {
        await Bed.findByIdAndUpdate(adm.bed, {
          status: "Available",
          currentAdmission: null,
          patientName: "",
        });
      }
    }

    let patientDoc = null;
    if (body.patient) {
      patientDoc = await Patient.findByIdAndUpdate(body.patient, { status: "Discharged" });
    }

    await logAudit(req, {
      action: "DISCHARGE",
      module: "IPD",
      recordId: newDischarge.dischargeId,
      recordTitle: `Discharge Summary: ${newDischarge.dischargeId}`,
      details: `Finalized discharge for patient. Diagnosis: ${newDischarge.finalDiagnosis}. Type: ${newDischarge.dischargeType}`,
    });

    // Trigger async WhatsApp + In-App notification safely
    triggerAsyncNotification({
      eventType: "DISCHARGE_READY",
      patient: patientDoc,
      data: {
        dischargeId: newDischarge.dischargeId,
        dischargeDate: newDischarge.dischargeDate ? new Date(newDischarge.dischargeDate).toLocaleDateString() : undefined,
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/patient/portal`,
      },
    });

    return NextResponse.json({ success: true, discharge: newDischarge }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
