import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Bed from "@/models/Bed";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const ward = searchParams.get("ward") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (ward) query.ward = ward;
    if (status) query.status = status;

    const beds = await Bed.find(query).sort({ ward: 1, bedNumber: 1 });

    // Group by ward
    const wardMap: Record<string, any[]> = {};
    beds.forEach((b) => {
      if (!wardMap[b.ward]) wardMap[b.ward] = [];
      wardMap[b.ward].push(b);
    });

    const summary = {
      total: beds.length,
      available: beds.filter((b) => b.status === "Available").length,
      occupied: beds.filter((b) => b.status === "Occupied").length,
      reserved: beds.filter((b) => b.status === "Reserved").length,
      maintenance: beds.filter((b) => b.status === "Maintenance").length,
    };

    return NextResponse.json({ success: true, beds, wardMap, summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const bed = await Bed.create(body);
    return NextResponse.json({ success: true, bed }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
