import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import NursingCare from "@/models/NursingCare";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { id } = params;

    const record = await NursingCare.findById(id)
      .populate("patient")
      .populate("admission");

    if (!record) {
      return NextResponse.json({ error: "Nursing record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const body = await req.json();

    const updated = await NursingCare.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient")
      .populate("admission");

    if (!updated) {
      return NextResponse.json({ error: "Nursing record not found" }, { status: 404 });
    }

    await logAudit(req, {
      action: "UPDATE",
      module: "NURSING",
      recordId: updated._id?.toString(),
      recordTitle: `Nursing Chart Updated`,
      details: `Updated nursing care plan / MAR / vitals. Shift: ${updated.shift}`,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
