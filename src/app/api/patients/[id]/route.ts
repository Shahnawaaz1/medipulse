import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import Prescription from "@/models/Prescription";
import LabOrder from "@/models/LabOrder";
import RadiologyOrder from "@/models/RadiologyOrder";
import Admission from "@/models/Admission";
import Invoice from "@/models/Invoice";
import Referral from "@/models/Referral";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    let patient = await Patient.findById(id);
    if (!patient) {
      patient = await Patient.findOne({ patientId: id });
    }

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patientMongoId = patient._id;

    const [
      appointments,
      prescriptions,
      labOrders,
      radiologyOrders,
      admissions,
      invoices,
      referrals,
    ] = await Promise.all([
      Appointment.find({ patient: patientMongoId }).populate("doctor").sort({ appointmentDate: -1 }),
      Prescription.find({ patient: patientMongoId }).populate("doctor").sort({ date: -1 }),
      LabOrder.find({ patient: patientMongoId }).populate("doctor").sort({ orderDate: -1 }),
      RadiologyOrder.find({ patient: patientMongoId }).populate("doctor").sort({ orderDate: -1 }),
      Admission.find({ patient: patientMongoId }).populate("doctor bed").sort({ admissionDate: -1 }),
      Invoice.find({ patient: patientMongoId }).populate("doctor").sort({ invoiceDate: -1 }),
      Referral.find({ patient: patientMongoId }).populate("referringDoctor").sort({ referralDate: -1 }),
    ]);

    return NextResponse.json({
      success: true,
      patient,
      history: {
        appointments,
        prescriptions,
        labOrders,
        radiologyOrders,
        admissions,
        invoices,
        referrals,
      },
    });
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
    const updated = await Patient.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, patient: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const updated = await Patient.findByIdAndUpdate(
      params.id,
      { status: "Discharged" },
      { new: true }
    );
    return NextResponse.json({ success: true, message: "Patient deactivated", patient: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
