import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import EmergencyCase from "@/models/EmergencyCase";
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
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: any = {};
    if (priority && priority !== "All") query.triagePriority = priority;
    if (status && status !== "All") query.status = status;
    if (search) {
      query.$or = [
        { emergencyId: { $regex: search, $options: "i" } },
        { chiefComplaint: { $regex: search, $options: "i" } },
        { temporaryPatientName: { $regex: search, $options: "i" } },
      ];
    }

    const cases = await EmergencyCase.find(query)
      .populate("patient")
      .populate("assignedDoctor")
      .sort({ createdAt: -1 });

    const stats = {
      total: cases.length,
      critical: cases.filter((c) => c.triagePriority === "Critical" && !["Discharged", "Admitted", "Referred", "Transferred", "LAMA"].includes(c.status)).length,
      active: cases.filter((c) => !["Discharged", "Admitted", "Referred", "Transferred", "LAMA"].includes(c.status)).length,
      admittedToday: cases.filter((c) => c.status === "Admitted").length,
    };

    return NextResponse.json({ success: true, cases, stats });
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

    // Generate next emergency ID if not provided
    if (!body.emergencyId) {
      const count = await EmergencyCase.countDocuments();
      body.emergencyId = `EMG-2026-${String(count + 1).padStart(3, "0")}`;
    }

    const newCase = await EmergencyCase.create(body);

    await logAudit(req, {
      action: "TRIAGE",
      module: "EMERGENCY",
      recordId: newCase.emergencyId,
      recordTitle: `Emergency Intake: ${newCase.emergencyId}`,
      details: `Registered emergency case for ${newCase.temporaryPatientName || "patient"}. Priority: ${newCase.triagePriority}. Complaint: ${newCase.chiefComplaint}`,
    });

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
