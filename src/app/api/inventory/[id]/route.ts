import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Inventory from "@/models/Inventory";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (body.quantity !== undefined) {
      if (body.quantity <= 0) {
        body.status = "Out of Stock";
      } else if (body.quantity <= (body.minThreshold || 10)) {
        body.status = "Low Stock";
      } else {
        body.status = "In Stock";
      }
    }

    const updated = await Inventory.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, item: updated });
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
    await Inventory.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Item removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
