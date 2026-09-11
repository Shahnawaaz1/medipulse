import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Medicine from "@/models/Medicine";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (body.stockQuantity !== undefined) {
      if (body.stockQuantity <= 0) {
        body.status = "Out of Stock";
      } else if (body.stockQuantity <= (body.minThreshold || 10)) {
        body.status = "Low Stock";
      } else {
        body.status = "In Stock";
      }
    }

    const updated = await Medicine.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, medicine: updated });
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
    await Medicine.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Medicine removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
