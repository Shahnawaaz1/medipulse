import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const appointment = await Appointment.findById(params.id).populate("patient doctor");
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const previous = await Appointment.findById(params.id).populate("patient doctor");
    if (!previous) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updated = await Appointment.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor");

    if (!updated) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Trigger Notification for Status Changes & Rescheduling
    try {
      const { triggerAsyncNotification } = await import("@/lib/notifications");
      const patient = updated.patient as any;
      const doctor = updated.doctor as any;

      if (patient && patient.phone) {
        if (body.status === "Cancelled" && previous.status !== "Cancelled") {
          triggerAsyncNotification({
            eventType: "APPOINTMENT_CANCELLED",
            recipient: {
              name: patient.name,
              phone: patient.phone,
              email: patient.email,
              patientId: patient.patientId,
            },
            data: {
              appointmentId: updated.appointmentId,
              doctorName: doctor?.name,
              appointmentDate: updated.appointmentDate,
              reason: body.cancellationReason || "Hospital Schedule Update",
            },
            inAppTitle: "Appointment Cancelled",
            inAppMessage: `Your appointment with ${doctor?.name || "Doctor"} on ${updated.appointmentDate} has been cancelled.`,
            inAppLink: "/patient/appointments",
            inAppType: "warning",
          });
        } else if (
          (body.appointmentDate && body.appointmentDate !== previous.appointmentDate) ||
          (body.timeSlot && body.timeSlot !== previous.timeSlot)
        ) {
          triggerAsyncNotification({
            eventType: "APPOINTMENT_RESCHEDULED",
            recipient: {
              name: patient.name,
              phone: patient.phone,
              email: patient.email,
              patientId: patient.patientId,
            },
            data: {
              appointmentId: updated.appointmentId,
              doctorName: doctor?.name,
              newDate: updated.appointmentDate,
              newTime: updated.timeSlot,
            },
            inAppTitle: "Appointment Rescheduled",
            inAppMessage: `Your appointment with ${doctor?.name || "Doctor"} has been rescheduled to ${updated.appointmentDate} (${updated.timeSlot}).`,
            inAppLink: "/patient/appointments",
            inAppType: "info",
          });
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const updated = await Appointment.findByIdAndUpdate(
      params.id,
      { status: "Cancelled" },
      { new: true }
    ).populate("patient doctor");

    if (updated) {
      try {
        const { triggerAsyncNotification } = await import("@/lib/notifications");
        const patient = updated.patient as any;
        const doctor = updated.doctor as any;
        if (patient?.phone) {
          triggerAsyncNotification({
            eventType: "APPOINTMENT_CANCELLED",
            recipient: {
              name: patient.name,
              phone: patient.phone,
              email: patient.email,
              patientId: patient.patientId,
            },
            data: {
              appointmentId: updated.appointmentId,
              doctorName: doctor?.name,
              appointmentDate: updated.appointmentDate,
            },
            inAppTitle: "Appointment Cancelled",
            inAppMessage: `Your appointment with ${doctor?.name || "Doctor"} on ${updated.appointmentDate} has been cancelled.`,
            inAppLink: "/patient/appointments",
            inAppType: "warning",
          });
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true, message: "Appointment cancelled" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
