import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Referral } from "@/models/Referral";
import "@/models/Patient";
import "@/models/Doctor";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const patientId = searchParams.get("patientId");
    const search = searchParams.get("search");

    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (patientId) query.patient = patientId;

    if (search) {
      query.$or = [
        { referralId: { $regex: search, $options: "i" } },
        { destinationHospital: { $regex: search, $options: "i" } },
        { destinationDepartment: { $regex: search, $options: "i" } },
        { diagnosis: { $regex: search, $options: "i" } },
        { reasonForReferral: { $regex: search, $options: "i" } },
      ];
    }

    const referrals = await Referral.find(query)
      .populate("patient", "name patientId phone gender age bloodGroup abhaNumber")
      .populate("referringDoctor", "name department specialization phone email qualification")
      .sort({ createdAt: -1 });

    const totalCount = await Referral.countDocuments();
    const pendingCount = await Referral.countDocuments({ status: "Pending" });
    const emergencyCount = await Referral.countDocuments({ priority: "Emergency" });
    const completedCount = await Referral.countDocuments({ status: "Completed" });

    return NextResponse.json({
      success: true,
      data: referrals,
      summary: {
        total: totalCount,
        pending: pendingCount,
        emergency: emergencyCount,
        completed: completedCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const count = await Referral.countDocuments();
    const referralId = `REF-2026-${String(count + 101).padStart(4, "0")}`;

    const newReferral = await Referral.create({
      ...body,
      referralId,
      referralDate: body.referralDate || new Date().toISOString().split("T")[0],
    });

    const populated = await Referral.findById(newReferral._id)
      .populate("patient", "name patientId phone gender age bloodGroup abhaNumber")
      .populate("referringDoctor", "name department specialization qualification");

    return NextResponse.json(
      {
        success: true,
        message: "Patient referral created successfully",
        data: populated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
