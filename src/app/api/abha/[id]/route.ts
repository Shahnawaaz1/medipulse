import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AbhaCard } from "@/models/AbhaCard";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const abha = await AbhaCard.findById(params.id);
    if (!abha) {
      return NextResponse.json(
        { success: false, error: "ABHA Card not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: abha });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const updated = await AbhaCard.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "ABHA Card not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "ABHA updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
