import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { InsuranceClaim } from "@/models/InsuranceClaim";
import "@/models/Patient";

export async function GET() {
  try {
    await connectDB();
    const claims = await InsuranceClaim.find()
      .populate("patient", "name patientId phone email gender age")
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: claims });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const claimCount = await InsuranceClaim.countDocuments();
    const claimId = `CLM-2026-${String(claimCount + 9015).padStart(4, "0")}`;

    const newClaim = await InsuranceClaim.create({
      ...body,
      claimId,
      claimDate: body.claimDate || new Date().toISOString().split("T")[0],
    });

    return NextResponse.json(
      { success: true, message: "Insurance Claim submitted successfully", data: newClaim },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
