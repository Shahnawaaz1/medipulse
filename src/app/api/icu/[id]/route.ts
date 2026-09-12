import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import IcuRecord from "@/models/IcuRecord";
import Bed from "@/models/Bed";
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

    let record = await IcuRecord.findById(id)
      .populate("patient")
      .populate("admission")
      .populate("bed")
      .populate("attendingIntensivist");

    if (!record) {
      record = await IcuRecord.findOne({ icuId: id })
        .populate("patient")
        .populate("admission")
        .populate("bed")
        .populate("attendingIntensivist");
    }

    if (!record) {
      return NextResponse.json({ error: "ICU record not found" }, { status: 404 });
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

    const updated = await IcuRecord.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient")
      .populate("admission")
      .populate("bed")
      .populate("attendingIntensivist");

    if (!updated) {
      return NextResponse.json({ error: "ICU record not found" }, { status: 404 });
    }

    if (body.status && body.status !== "Active" && updated.bed) {
      await Bed.findByIdAndUpdate(updated.bed._id || updated.bed, {
        status: "Available",
        currentAdmission: null,
      });
    }

    await logAudit(req, {
      action: "UPDATE",
      module: "ICU",
      recordId: updated.icuId,
      recordTitle: `ICU Update: ${updated.icuId}`,
      details: `Updated ICU parameters. Status: ${updated.status}. Ventilator: ${updated.ventilatorStatus}`,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
