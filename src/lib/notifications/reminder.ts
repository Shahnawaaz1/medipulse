/**
 * Scheduled Appointment Reminders Service
 * MediPulse Hospital Management System
 * 
 * Scans upcoming appointments and dispatches automated reminder notifications
 */

import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";
import NotificationLog from "@/models/NotificationLog";
import HospitalSetting from "@/models/HospitalSetting";
import { sendHospitalNotification } from "./index";

export interface ReminderRunResult {
  totalScanned: number;
  remindersSent: number;
  skippedAlreadySent: number;
  errors: number;
  details: Array<{
    appointmentId: string;
    patientName: string;
    phone: string;
    status: string;
  }>;
}

export async function processUpcomingAppointmentReminders(
  hoursOrDate?: number | string
): Promise<ReminderRunResult> {
  await connectToDatabase();

  const setting = await HospitalSetting.findOne();
  if (setting?.whatsappIntegration?.autoNotifyAppointments === false) {
    return {
      totalScanned: 0,
      remindersSent: 0,
      skippedAlreadySent: 0,
      errors: 0,
      details: [],
    };
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let targetDate = tomorrow.toISOString().split("T")[0];
  if (typeof hoursOrDate === "string") {
    targetDate = hoursOrDate;
  }

  // Find all confirmed/scheduled appointments for target date
  const appointments: any[] = await Appointment.find({
    appointmentDate: targetDate,
    status: { $in: ["Scheduled", "Confirmed"] },
  })
    .populate("patient")
    .populate("doctor")
    .lean();

  const result: ReminderRunResult = {
    totalScanned: appointments.length,
    remindersSent: 0,
    skippedAlreadySent: 0,
    errors: 0,
    details: [],
  };

  for (const apt of appointments) {
    try {
      const patient = apt.patient as any;
      const doctor = apt.doctor as any;
      const aptIdStr = String(apt.appointmentId || apt._id || "");

      if (!patient || !patient.phone) {
        continue;
      }

      // Check if reminder was already sent today for this appointment
      const alreadySent = await NotificationLog.findOne({
        eventType: "APPOINTMENT_REMINDER",
        "metadata.appointmentId": aptIdStr,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      });

      if (alreadySent) {
        result.skippedAlreadySent++;
        continue;
      }

      const dispatchResult = await sendHospitalNotification({
        eventType: "APPOINTMENT_REMINDER",
        recipient: {
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          patientId: patient.patientId,
        },
        data: {
          appointmentId: aptIdStr,
          doctorName: doctor?.name || "Attending Physician",
          department: apt.department || doctor?.department || "General Medicine",
          appointmentDate: apt.appointmentDate,
          timeSlot: apt.timeSlot,
          hoursNotice: "tomorrow's",
        },
        inAppTitle: "Upcoming Appointment Reminder",
        inAppMessage: `Reminder: You have an appointment tomorrow with ${doctor?.name || "Doctor"} at ${apt.timeSlot}.`,
        inAppLink: "/patient/appointments",
        inAppType: "info",
      });

      result.remindersSent++;
      result.details.push({
        appointmentId: aptIdStr,
        patientName: patient.name,
        phone: patient.phone,
        status: dispatchResult.whatsappStatus,
      });
    } catch (err: any) {
      result.errors++;
      console.warn(`[Reminder Service Error] Apt ${apt._id}:`, err.message);
    }
  }

  return result;
}
