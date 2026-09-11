import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import RadiologyOrder from "@/models/RadiologyOrder";
import Notification from "@/models/Notification";
import Patient from "@/models/Patient";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const modality = searchParams.get("modality") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (modality) query.modality = modality;
    if (status) query.status = status;

    const orders = await RadiologyOrder.find(query)
      .populate("patient doctor")
      .sort({ orderDate: -1, createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.orderId) {
      const count = await RadiologyOrder.countDocuments();
      body.orderId = `RAD-${5000 + count + 1}`;
    }
    if (!body.orderDate) {
      body.orderDate = new Date().toISOString().split("T")[0];
    }

    const order = await RadiologyOrder.create(body);
    const populated = await RadiologyOrder.findById(order._id).populate("patient doctor");

    const patientDoc = await Patient.findById(body.patient);
    await Notification.create({
      title: "Radiology Scan Scheduled",
      message: `${body.modality} scheduled for ${patientDoc ? patientDoc.name : "Patient"}.`,
      type: "info",
      link: "/radiology",
      read: false,
    });

    return NextResponse.json({ success: true, order: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
