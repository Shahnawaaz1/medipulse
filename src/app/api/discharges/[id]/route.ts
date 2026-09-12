import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import DischargeSummary from "@/models/DischargeSummary";
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

    let discharge = await DischargeSummary.findById(id)
      .populate("patient")
      .populate("admission")
      .populate("attendingDoctor");

    if (!discharge) {
      discharge = await DischargeSummary.findOne({ dischargeId: id })
        .populate("patient")
        .populate("admission")
        .populate("attendingDoctor");
    }

    if (!discharge) {
      return NextResponse.json({ error: "Discharge summary not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, discharge });
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

    const updated = await DischargeSummary.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient")
      .populate("admission")
      .populate("attendingDoctor");

    if (!updated) {
      return NextResponse.json({ error: "Discharge summary not found" }, { status: 404 });
    }

    await logAudit(req, {
      action: "UPDATE",
      module: "IPD",
      recordId: updated.dischargeId,
      recordTitle: `Discharge Updated: ${updated.dischargeId}`,
      details: `Updated discharge summary details. Status: ${updated.status}`,
    });

    return NextResponse.json({ success: true, discharge: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
