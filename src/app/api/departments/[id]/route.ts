import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Department from "@/models/Department";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const dept = await Department.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ success: true, department: dept });
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
    await Department.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Department deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
