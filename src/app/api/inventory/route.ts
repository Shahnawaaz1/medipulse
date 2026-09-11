import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Inventory from "@/models/Inventory";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const items = await Inventory.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.itemCode) {
      const count = await Inventory.countDocuments();
      body.itemCode = `INV-ITM-${String(count + 1).padStart(3, "0")}`;
    }
    if (!body.lastRestocked) {
      body.lastRestocked = new Date().toISOString().split("T")[0];
    }

    if (body.quantity <= 0) {
      body.status = "Out of Stock";
    } else if (body.quantity <= (body.minThreshold || 10)) {
      body.status = "Low Stock";
    } else {
      body.status = "In Stock";
    }

    const item = await Inventory.create(body);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
