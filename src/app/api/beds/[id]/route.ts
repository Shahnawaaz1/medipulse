import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Bed from "@/models/Bed";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // If status is changed to Available, clear currentAdmission and patientName
    if (body.status === "Available") {
      body.currentAdmission = null;
      body.patientName = "";
    }

    const updated = await Bed.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, bed: updated });
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
    await Bed.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Bed removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
