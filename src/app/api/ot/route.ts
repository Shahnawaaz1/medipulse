import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import OperationTheatre from "@/models/OperationTheatre";
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
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const theatre = searchParams.get("theatre");

    const query: any = {};
    if (status && status !== "All") query.surgeryStatus = status;
    if (theatre && theatre !== "All") query.theatreNumber = theatre;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const surgeries = await OperationTheatre.find(query)
      .populate("patient")
      .populate("leadSurgeon")
      .populate("assistantSurgeon")
      .populate("anesthetist")
      .sort({ scheduledDate: 1, startTime: 1 });

    const stats = {
      totalScheduled: surgeries.length,
      inProgress: surgeries.filter((s) => s.surgeryStatus === "In Progress").length,
      preOp: surgeries.filter((s) => s.surgeryStatus === "Pre-Op").length,
      completedToday: surgeries.filter((s) => s.surgeryStatus === "Completed").length,
    };

    return NextResponse.json({ success: true, surgeries, stats });
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

    if (!body.otScheduleId) {
      const count = await OperationTheatre.countDocuments();
      body.otScheduleId = `OT-2026-${String(count + 1).padStart(3, "0")}`;
    }

    const newSurgery = await OperationTheatre.create(body);

    await logAudit(req, {
      action: "SURGERY_SCHEDULE",
      module: "OT",
      recordId: newSurgery.otScheduleId,
      recordTitle: `OT Booking: ${newSurgery.procedureName}`,
      details: `Scheduled ${newSurgery.procedureName} in ${newSurgery.theatreNumber}. Anesthesia: ${newSurgery.anesthesiaType}`,
    });

    return NextResponse.json({ success: true, surgery: newSurgery }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
