/**
 * Centralized Hospital Notification Service
 * MediPulse Hospital Management System
 * 
 * Orchestrates multi-channel delivery:
 * 1. In-App Notifications (Notification model)
 * 2. WhatsApp Business Notifications (Meta Cloud API / Demo simulator)
 * 3. Audit & Delivery Logging (NotificationLog model)
 * 
 * Ensures non-blocking async execution so hospital operations never fail due to notification delivery.
 */

import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import NotificationLog from "@/models/NotificationLog";
import Patient from "@/models/Patient";
import HospitalSetting from "@/models/HospitalSetting";
import {
  NotificationEventType,
  NotificationChannel,
  NotificationDeliveryStatus,
} from "@/types";
import {
  sendWhatsAppNotification,
  isWhatsAppConfigured,
  sanitizeWhatsAppNumber,
} from "./whatsapp";

export interface SendNotificationOptions {
  eventType: NotificationEventType;
  recipient?: {
    name: string;
    phone?: string;
    email?: string;
    patientId?: string;
  };
  patient?: any;
  data: Record<string, any>;
  channels?: NotificationChannel[];
  inAppTitle?: string;
  inAppMessage?: string;
  inAppLink?: string;
  inAppType?: "info" | "warning" | "success" | "danger";
}

export interface NotificationDispatchSummary {
  inAppDelivered: boolean;
  whatsappDelivered: boolean;
  whatsappMode: "LIVE" | "DEMO" | "SKIPPED" | "DISABLED";
  whatsappStatus: NotificationDeliveryStatus;
  logId?: string;
  error?: string;
}

/**
 * Pure function to check if patient preferences allow a specific event
 */
export function isEventAllowedByPreferences(
  prefs?: {
    whatsappEnabled?: boolean;
    appointmentAlerts?: boolean;
    billingAlerts?: boolean;
    reportAlerts?: boolean;
    admissionAlerts?: boolean;
    marketingAlerts?: boolean;
  },
  eventType?: NotificationEventType
): boolean {
  if (!prefs) return true;
  if (prefs.whatsappEnabled === false) return false;

  if (
    eventType === "APPOINTMENT_CONFIRMATION" ||
    eventType === "APPOINTMENT_REMINDER" ||
    eventType === "APPOINTMENT_CANCELLED" ||
    eventType === "APPOINTMENT_RESCHEDULED"
  ) {
    return prefs.appointmentAlerts !== false;
  }

  if (eventType === "INVOICE_GENERATED" || eventType === "PAYMENT_RECEIVED") {
    return prefs.billingAlerts !== false;
  }

  if (eventType === "LAB_REPORT_READY" || eventType === "RADIOLOGY_REPORT_READY") {
    return prefs.reportAlerts !== false;
  }

  if (eventType === "ADMISSION_CONFIRMATION" || eventType === "DISCHARGE_READY") {
    return prefs.admissionAlerts !== false;
  }

  return true;
}

/**
 * Determine if patient consent allows WhatsApp delivery for this specific event type
 */
export async function checkPatientConsent(
  patientIdOrPhone?: string,
  eventType?: NotificationEventType
): Promise<boolean> {
  if (!patientIdOrPhone) return true;

  try {
    const patient = await Patient.findOne({
      $or: [
        { patientId: patientIdOrPhone },
        { phone: patientIdOrPhone },
        { _id: patientIdOrPhone.match(/^[0-9a-fA-F]{24}$/) ? patientIdOrPhone : null },
      ].filter(Boolean),
    });

    if (!patient || !patient.notificationPreferences) {
      return true; // Default to enabled if not explicitly configured
    }

    return isEventAllowedByPreferences(patient.notificationPreferences, eventType);
  } catch {
    return true;
  }
}

/**
 * Send Multi-Channel Hospital Notification
 * Non-blocking, fault-tolerant entry point for all hospital modules
 */
export async function sendHospitalNotification(
  options: SendNotificationOptions
): Promise<NotificationDispatchSummary> {
  const result: NotificationDispatchSummary = {
    inAppDelivered: false,
    whatsappDelivered: false,
    whatsappMode: "DEMO",
    whatsappStatus: "Pending",
  };

  const channels = options.channels || ["IN_APP", "WHATSAPP"];
  const recipientName = options.recipient?.name || options.patient?.name || "Valued Patient";
  const recipientPhone = options.recipient?.phone || options.patient?.phone || "";
  const recipientId = options.recipient?.patientId || options.patient?.patientId || options.patient?._id?.toString() || "";

  try {
    await connectToDatabase();

    // Fetch hospital name & settings
    let hospitalName = "MediPulse Hospital & Medical Institute";
    let whatsappGlobalEnabled = true;

    try {
      const setting = await HospitalSetting.findOne();
      if (setting) {
        if (setting.hospitalName) hospitalName = setting.hospitalName;
        if (setting.whatsappIntegration?.enabled === false) {
          whatsappGlobalEnabled = false;
        }
      }
    } catch {
      // ignore settings load error
    }

    // 1. Deliver In-App Notification if requested
    if (channels.includes("IN_APP")) {
      try {
        const title = options.inAppTitle || options.eventType.replace(/_/g, " ");
        const message =
          options.inAppMessage ||
          `${options.eventType.replace(/_/g, " ")} for ${recipientName}`;
        const type = options.inAppType || (options.eventType.includes("CANCEL") ? "warning" : "info");

        await Notification.create({
          title,
          message,
          type,
          link: options.inAppLink || "/dashboard",
          read: false,
        });

        result.inAppDelivered = true;
      } catch (err: any) {
        console.warn("[Notification Service] In-App delivery warning:", err.message);
      }
    }

    // 2. Deliver WhatsApp Notification if requested
    if (channels.includes("WHATSAPP")) {
      if (!whatsappGlobalEnabled) {
        result.whatsappMode = "DISABLED";
        result.whatsappStatus = "Failed";
        result.error = "WhatsApp integration is globally disabled in hospital settings.";
        return result;
      }

      const rawPhone = recipientPhone || options.data.phone || options.data.patientPhone;
      const cleanPhone = sanitizeWhatsAppNumber(rawPhone);

      if (!cleanPhone) {
        result.whatsappMode = "SKIPPED";
        result.whatsappStatus = "Failed";
        result.error = "Recipient phone number is missing or invalid.";
        return result;
      }

      // Check Patient consent
      let hasConsent = true;
      if (options.patient?.notificationPreferences) {
        hasConsent = isEventAllowedByPreferences(options.patient.notificationPreferences, options.eventType);
      } else {
        hasConsent = await checkPatientConsent(recipientId || rawPhone, options.eventType);
      }

      if (!hasConsent) {
        result.whatsappMode = "SKIPPED";
        result.whatsappStatus = "Demo";
        result.error = "Patient has opted out of WhatsApp notifications.";
        return result;
      }

      // Dispatch WhatsApp message
      const waResult = await sendWhatsAppNotification({
        to: cleanPhone,
        recipientName,
        eventType: options.eventType,
        templateData: options.data,
        hospitalName,
      });

      result.whatsappDelivered = waResult.success;
      result.whatsappMode = waResult.mode;
      result.whatsappStatus = waResult.status;
      if (waResult.error) result.error = waResult.error;

      // 3. Log to NotificationLog audit collection
      try {
        const logDoc = await NotificationLog.create({
          eventType: options.eventType,
          channel: "WHATSAPP",
          recipientName,
          recipientPhone: cleanPhone,
          recipientEmail: options.recipient?.email,
          patientId: recipientId || undefined,
          status: waResult.status,
          title: options.inAppTitle || options.eventType,
          messageSnippet: waResult.formattedText.substring(0, 300),
          providerResponse: waResult.providerResponse,
          errorDetails: waResult.error,
          metadata: {
            ...options.data,
            mode: waResult.mode,
            messageId: waResult.messageId,
          },
          sentAt: waResult.success ? new Date() : undefined,
        });

        result.logId = logDoc._id.toString();
      } catch (logErr: any) {
        console.warn("[Notification Service] Log audit warning:", logErr.message);
      }
    }

    return result;
  } catch (err: any) {
    console.error("[Notification Service Exception]:", err);
    return {
      inAppDelivered: false,
      whatsappDelivered: false,
      whatsappMode: "DEMO",
      whatsappStatus: "Failed",
      error: err.message || "Notification processing error",
    };
  }
}

/**
 * Fire-and-forget helper that never blocks the calling HTTP response
 */
export function triggerAsyncNotification(options: SendNotificationOptions): void {
  // Execute in background without awaiting in the critical path
  setTimeout(() => {
    sendHospitalNotification(options).catch((err) => {
      console.warn("[Async Notification Background Warning]:", err);
    });
  }, 10);
}

export * from "./whatsapp";
