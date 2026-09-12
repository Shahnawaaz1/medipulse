import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processUpcomingAppointmentReminders } from "@/lib/notifications/reminder";

/**
 * POST /api/notifications/reminders
 * Scans upcoming appointments and triggers 24h / 2h reminder notifications
 */
export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    // Allow admin, staff, or internal cron authorization token
    const cronSecret = req.headers.get("x-cron-secret");
    const isCronAuthorized = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!isCronAuthorized) {
      if (errorResponse) return errorResponse;
      if (!["SUPER_ADMIN", "ADMIN", "STAFF", "RECEPTIONIST"].includes(user?.role || "")) {
        return NextResponse.json(
          { error: "Forbidden: Unauthorized to trigger reminder batch scan" },
          { status: 403 }
        );
      }
    }

    let hoursAhead = 24;
    try {
      const body = await req.json();
      if (body.hoursAhead) hoursAhead = Number(body.hoursAhead);
    } catch {
      // Body may be empty on cron requests
    }

    const result = await processUpcomingAppointmentReminders(hoursAhead);

    return NextResponse.json({
      success: true,
      message: `Appointment reminder batch completed for the next ${hoursAhead} hours.`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process appointment reminders" },
      { status: 500 }
    );
  }
}
