import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import NotificationLog from "@/models/NotificationLog";
import HospitalSetting from "@/models/HospitalSetting";
import { requireAuth } from "@/lib/auth";
import { getWhatsAppIntegrationStatus, sendWhatsAppNotification } from "@/lib/notifications/whatsapp";

/**
 * GET /api/notifications/whatsapp
 * Returns WhatsApp Integration Status & Recent Audit Logs (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only Super Admin and Admin can view WhatsApp settings
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can access WhatsApp integration settings" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const status = getWhatsAppIntegrationStatus();

    // Fetch hospital settings override if available
    const hospitalSetting: any = await HospitalSetting.findOne().lean();
    const integrationSettings = hospitalSetting?.whatsappIntegration || {
      enabled: true,
      senderPhoneNumber: process.env.WHATSAPP_PHONE_NUMBER_ID ? "+1 555-0199 (Configured)" : "",
      autoNotifyAppointments: true,
      autoNotifyBilling: true,
      autoNotifyReports: true,
      autoNotifyAdmissions: true,
      appointmentReminderHours: 24,
    };

    // Fetch recent delivery logs
    const recentLogs = await NotificationLog.find()
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return NextResponse.json({
      success: true,
      status,
      settings: integrationSettings,
      logs: recentLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/notifications/whatsapp
 * Sends a test notification to verify integration / demo simulation (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can dispatch test messages" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { recipientPhone, messageText, recipientName } = body;

    if (!recipientPhone) {
      return NextResponse.json(
        { error: "Recipient phone number is required" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppNotification({
      to: recipientPhone,
      recipientName: recipientName || "Admin Test",
      eventType: "TEST_MESSAGE",
      templateData: {
        customNote: messageText,
      },
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      messageId: result.messageId,
      demoMode: result.mode === "DEMO",
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to dispatch test notification" }, { status: 500 });
  }
}
