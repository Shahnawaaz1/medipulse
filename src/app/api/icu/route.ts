import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import IcuRecord from "@/models/IcuRecord";
import Bed from "@/models/Bed";
import Admission from "@/models/Admission";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const unit = searchParams.get("unit");
    const status = searchParams.get("status") || "Active";

    const query: any = {};
    if (status !== "All") query.status = status;
    if (unit && unit !== "All") query.unit = unit;

    const [records, icuBeds] = await Promise.all([
      IcuRecord.find(query)
        .populate("patient")
        .populate("admission")
        .populate("bed")
        .populate("attendingIntensivist")
        .sort({ updatedAt: -1 })
        .lean(),
      Bed.find({ type: "ICU" }).populate("currentAdmission").lean(),
    ]);

    const stats = {
      totalIcuBeds: icuBeds.length,
      occupiedIcuBeds: icuBeds.filter((b) => b.status === "Occupied").length,
      availableIcuBeds: icuBeds.filter((b) => b.status === "Available").length,
      ventilatedPatients: records.filter(
        (r) => r.ventilatorStatus && !["None", "Room Air"].includes(r.ventilatorStatus) && r.status === "Active"
      ).length,
      activeCriticalAlerts: records.reduce((acc, r) => {
        return acc + (r.criticalAlerts?.filter((a: any) => !a.resolved).length || 0);
      }, 0),
    };

    return NextResponse.json({ success: true, records, icuBeds, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const body = await req.json();

    if (!body.icuId) {
      const count = await IcuRecord.countDocuments();
      body.icuId = `ICU-2026-${String(count + 1).padStart(3, "0")}`;
    }

    const newRecord = await IcuRecord.create(body);

    if (body.bed) {
      await Bed.findByIdAndUpdate(body.bed, {
        status: "Occupied",
        currentAdmission: body.admission,
      });
    }

    await logAudit(req, {
      action: "ADMIT",
      module: "ICU",
      recordId: newRecord.icuId,
      recordTitle: `ICU Admission: ${newRecord.icuId}`,
      details: `Admitted patient to ICU (${newRecord.unit}). Ventilator: ${newRecord.ventilatorStatus}`,
    });

    return NextResponse.json({ success: true, record: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
