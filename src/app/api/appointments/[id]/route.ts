import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const appointment = await Appointment.findById(params.id).populate("patient doctor");
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, appointment });
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
    const updated = await Appointment.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor");

    if (!updated) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, appointment: updated });
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
    await Appointment.findByIdAndUpdate(params.id, { status: "Cancelled" });
    return NextResponse.json({ success: true, message: "Appointment cancelled" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
