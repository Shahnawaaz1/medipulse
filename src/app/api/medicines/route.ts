import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Medicine from "@/models/Medicine";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { genericName: { $regex: search, $options: "i" } },
        { batchNumber: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const medicines = await Medicine.find(query).sort({ name: 1 }).lean();

    const lowStockCount = medicines.filter(
      (m) => m.stockQuantity <= m.minThreshold && m.stockQuantity > 0
    ).length;
    const outOfStockCount = medicines.filter((m) => m.stockQuantity === 0).length;

    return NextResponse.json({
      success: true,
      medicines,
      stats: {
        total: medicines.length,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Set initial status
    if (body.stockQuantity <= 0) {
      body.status = "Out of Stock";
    } else if (body.stockQuantity <= (body.minThreshold || 10)) {
      body.status = "Low Stock";
    } else {
      body.status = "In Stock";
    }

    const medicine = await Medicine.create(body);
    return NextResponse.json({ success: true, medicine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
