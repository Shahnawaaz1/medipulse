import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const doctor = await Doctor.findById(params.id);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate("patient")
      .sort({ appointmentDate: -1 })
      .limit(20);

    return NextResponse.json({ success: true, doctor, appointments });
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
    const updated = await Doctor.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, doctor: updated });
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
    const updated = await Doctor.findByIdAndUpdate(
      params.id,
      { status: "Inactive" },
      { new: true }
    );
    return NextResponse.json({ success: true, doctor: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
