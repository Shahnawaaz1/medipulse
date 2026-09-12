import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import EmergencyCase from "@/models/EmergencyCase";
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

    let emergencyCase = await EmergencyCase.findById(id)
      .populate("patient")
      .populate("assignedDoctor");

    if (!emergencyCase) {
      emergencyCase = await EmergencyCase.findOne({ emergencyId: id })
        .populate("patient")
        .populate("assignedDoctor");
    }

    if (!emergencyCase) {
      return NextResponse.json({ error: "Emergency case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, case: emergencyCase });
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

    const updated = await EmergencyCase.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient")
      .populate("assignedDoctor");

    if (!updated) {
      return NextResponse.json({ error: "Emergency case not found" }, { status: 404 });
    }

    await logAudit(req, {
      action: "UPDATE",
      module: "EMERGENCY",
      recordId: updated.emergencyId,
      recordTitle: `Emergency Case Updated: ${updated.emergencyId}`,
      details: `Updated emergency record. Status: ${updated.status}. Triage: ${updated.triagePriority}. Disposition: ${updated.disposition || "None"}`,
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const deleted = await EmergencyCase.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Emergency case not found" }, { status: 404 });
    }

    await logAudit(req, {
      action: "DELETE",
      module: "EMERGENCY",
      recordId: deleted.emergencyId,
      recordTitle: `Emergency Case Deleted: ${deleted.emergencyId}`,
      details: `Deleted emergency case ${deleted.emergencyId}`,
    });

    return NextResponse.json({ success: true, message: "Emergency record deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
