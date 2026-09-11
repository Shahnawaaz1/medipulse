import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Staff from "@/models/Staff";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const updated = await Staff.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, staff: updated });
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
    await Staff.findByIdAndUpdate(params.id, { status: "Terminated" });
    return NextResponse.json({ success: true, message: "Staff status updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
