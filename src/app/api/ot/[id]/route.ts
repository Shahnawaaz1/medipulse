import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import OperationTheatre from "@/models/OperationTheatre";
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

    let surgery = await OperationTheatre.findById(id)
      .populate("patient")
      .populate("leadSurgeon")
      .populate("assistantSurgeon")
      .populate("anesthetist");

    if (!surgery) {
      surgery = await OperationTheatre.findOne({ otScheduleId: id })
        .populate("patient")
        .populate("leadSurgeon")
        .populate("assistantSurgeon")
        .populate("anesthetist");
    }

    if (!surgery) {
      return NextResponse.json({ error: "Surgery not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, surgery });
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

    const updated = await OperationTheatre.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient")
      .populate("leadSurgeon")
      .populate("assistantSurgeon")
      .populate("anesthetist");

    if (!updated) {
      return NextResponse.json({ error: "Surgery not found" }, { status: 404 });
    }

    await logAudit(req, {
      action: "UPDATE",
      module: "OT",
      recordId: updated.otScheduleId,
      recordTitle: `OT Status: ${updated.otScheduleId}`,
      details: `Updated surgery status: ${updated.surgeryStatus} for ${updated.procedureName}. Theatre: ${updated.theatreNumber}`,
    });

    return NextResponse.json({ success: true, surgery: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
