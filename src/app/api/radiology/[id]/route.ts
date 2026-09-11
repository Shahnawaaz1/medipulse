import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import RadiologyOrder from "@/models/RadiologyOrder";
import Notification from "@/models/Notification";
import Patient from "@/models/Patient";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const order = await RadiologyOrder.findById(params.id).populate("patient doctor");
    if (!order) {
      return NextResponse.json({ error: "Radiology order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
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

    const updated = await RadiologyOrder.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor");

    if (body.status === "Report Generated") {
      const patientDoc = await Patient.findById(updated.patient);
      await Notification.create({
        title: "Radiology Report Available",
        message: `${updated.modality} report is now ready for ${patientDoc ? patientDoc.name : "Patient"}.`,
        type: "success",
        link: "/radiology",
        read: false,
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
    await RadiologyOrder.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
