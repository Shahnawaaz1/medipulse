import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import LabOrder from "@/models/LabOrder";
import Notification from "@/models/Notification";
import Patient from "@/models/Patient";
import HospitalSetting from "@/models/HospitalSetting";
import { triggerAsyncNotification } from "@/lib/notifications";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const order = await LabOrder.findById(params.id).populate("patient doctor tests.test");
    if (!order) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }

    const hospitalSetting = (await HospitalSetting.findOne()) || {
      hospitalName: "MediPulse Hospital",
      tagline: "Laboratory & Diagnostic Sciences",
    };

    return NextResponse.json({ success: true, order, hospitalSetting });
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

    if (body.status === "Completed" && !body.completedAt) {
      body.completedAt = new Date().toLocaleString();
    }

    const updated = await LabOrder.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor tests.test");

    if (body.status === "Completed") {
      const patientDoc = await Patient.findById(updated.patient);
      await Notification.create({
        title: "Lab Report Ready",
        message: `Lab report completed for ${patientDoc ? patientDoc.name : "Patient"}.`,
        type: "success",
        link: "/laboratory",
        read: false,
      });

      // Dispatch async WhatsApp + Multi-channel notification safely
      triggerAsyncNotification({
        eventType: "LAB_REPORT_READY",
        patient: patientDoc,
        data: {
          testName: updated.tests?.map((t: any) => t.test?.name || t.name).filter(Boolean).join(", ") || "Diagnostic Test",
          orderNumber: updated.orderNumber || params.id,
          portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/laboratory`,
        },
      });
    }

    return NextResponse.json({ success: true, order: updated });
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
    await LabOrder.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Order removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
