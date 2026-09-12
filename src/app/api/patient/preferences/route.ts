import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Patient from "@/models/Patient";
import { requireAuth, getPatientScope } from "@/lib/auth";

/**
 * GET /api/patient/preferences
 * Retrieve notification preferences for the logged-in patient or specified patient ID (Admin/Staff)
 */
export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const patientScope = getPatientScope(req);
    const { searchParams } = new URL(req.url);
    const targetPatientId = searchParams.get("patientId");

    let patientDoc = null;
    if (patientScope.isPatient) {
      if (patientScope.patientId) {
        patientDoc = await Patient.findOne({ patientId: patientScope.patientId });
      }
      if (!patientDoc && patientScope.patientEmail) {
        patientDoc = await Patient.findOne({ email: patientScope.patientEmail.toLowerCase() });
      }
    } else if (targetPatientId) {
      patientDoc = await Patient.findById(targetPatientId);
    }

    if (!patientDoc) {
      return NextResponse.json({
        success: true,
        preferences: {
          whatsappEnabled: true,
          appointmentAlerts: true,
          billingAlerts: true,
          reportAlerts: true,
          admissionAlerts: true,
          marketingAlerts: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences: patientDoc.notificationPreferences || {
        whatsappEnabled: true,
        appointmentAlerts: true,
        billingAlerts: true,
        reportAlerts: true,
        admissionAlerts: true,
        marketingAlerts: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/patient/preferences
 * Update notification preferences for the logged-in patient
 */
export async function PUT(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const body = await req.json();
    const patientScope = getPatientScope(req);
    const { searchParams } = new URL(req.url);
    const targetPatientId = searchParams.get("patientId");

    let filter: any = null;
    if (patientScope.isPatient) {
      if (patientScope.patientId) {
        filter = { patientId: patientScope.patientId };
      } else if (patientScope.patientEmail) {
        filter = { email: patientScope.patientEmail.toLowerCase() };
      }
    } else if (targetPatientId) {
      filter = { _id: targetPatientId };
    }

    if (!filter) {
      return NextResponse.json({ error: "Patient identifier not found" }, { status: 404 });
    }

    const updated = await Patient.findOneAndUpdate(
      filter,
      {
        $set: {
          notificationPreferences: {
            whatsappEnabled: body.whatsappEnabled !== undefined ? Boolean(body.whatsappEnabled) : true,
            appointmentAlerts: body.appointmentAlerts !== undefined ? Boolean(body.appointmentAlerts) : true,
            billingAlerts: body.billingAlerts !== undefined ? Boolean(body.billingAlerts) : true,
            reportAlerts: body.reportAlerts !== undefined ? Boolean(body.reportAlerts) : true,
            admissionAlerts: body.admissionAlerts !== undefined ? Boolean(body.admissionAlerts) : true,
            marketingAlerts: body.marketingAlerts !== undefined ? Boolean(body.marketingAlerts) : false,
          },
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: updated?.notificationPreferences,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
