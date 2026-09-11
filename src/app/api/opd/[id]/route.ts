import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import OpdRecord from "@/models/OpdRecord";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const updated = await OpdRecord.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor");

    if (!updated) {
      return NextResponse.json({ error: "OPD record not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, opdRecord: updated });
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
    await OpdRecord.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "OPD entry removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
