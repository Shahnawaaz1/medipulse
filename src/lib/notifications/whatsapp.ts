/**
 * WhatsApp Business API & Meta Cloud API Provider
 * MediPulse Hospital Management System
 * 
 * Supports both:
 * 1. Live Meta WhatsApp Cloud API (when WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID are configured in environment)
 * 2. Safe Simulated Demo Mode (when credentials are absent, logs cleanly without throwing errors)
 */

import { NotificationEventType } from "@/types";

export interface WhatsAppMessagePayload {
  to: string; // E.164 formatted phone number
  recipientName: string;
  eventType: NotificationEventType;
  templateData: Record<string, any>;
  hospitalName?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  mode: "LIVE" | "DEMO";
  messageId?: string;
  status: "Sent" | "Demo" | "Failed";
  formattedText: string;
  providerResponse?: any;
  error?: string;
}

/**
 * Format clean E.164 international phone number for WhatsApp delivery
 * e.g. "+91 98765-43210" -> "919876543210"
 * e.g. "9876543210" -> "919876543210" (default Indian prefix if 10 digits) or "19876543210"
 */
export function sanitizeWhatsAppNumber(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  // If 10 digits without country code, default to 91 (India) or keep as-is if country code exists
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Build healthcare notification message text tailored to each event type
 * Compliant with privacy standards (never includes sensitive diagnostic/medical details directly in WhatsApp)
 */
export function buildWhatsAppMessage(
  eventType: NotificationEventType,
  recipientName: string,
  data: Record<string, any>,
  hospitalName: string = "MediPulse Hospital & Medical Institute"
): string {
  const patient = recipientName || "Valued Patient";

  switch (eventType) {
    case "APPOINTMENT_CONFIRMATION": {
      const doctor = data.doctorName ? `Dr. ${data.doctorName.replace(/^Dr\.\s*/i, "")}` : "Hospital Specialist";
      const department = data.department || "General Medicine";
      const date = data.appointmentDate || data.date || "Today";
      const time = data.timeSlot || data.time || "Scheduled Slot";
      const type = data.consultationType || data.type || "In-Person Consultation";
      const room = data.roomId ? `\n🎥 Video Room: ${data.roomId}` : "";

      return (
        `🏥 *${hospitalName}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `✅ Your appointment has been *successfully confirmed*.\n\n` +
        `📋 *Appointment Details:*\n` +
        `• *Doctor:* ${doctor}\n` +
        `• *Department:* ${department}\n` +
        `• *Type:* ${type}\n` +
        `• *Date:* ${date}\n` +
        `• *Time:* ${time}${room}\n\n` +
        `📍 *Location:* MediPulse Central Clinical Wing\n` +
        `⚠️ Please arrive 15 minutes prior to your scheduled time.\n\n` +
        `🌐 View or manage in your Patient Portal: https://medipulse-eta.vercel.app/patient/appointments\n\n` +
        `_For emergency assistance, call 24x7 Hotline: 1800-911-0000_`
      );
    }

    case "APPOINTMENT_REMINDER": {
      const doctor = data.doctorName ? `Dr. ${data.doctorName.replace(/^Dr\.\s*/i, "")}` : "Hospital Specialist";
      const date = data.appointmentDate || data.date || "Tomorrow";
      const time = data.timeSlot || data.time || "Scheduled Slot";
      const hoursNotice = data.hoursNotice || "upcoming";

      return (
        `🏥 *${hospitalName} — Appointment Reminder*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `⏰ This is a gentle reminder for your ${hoursNotice} consultation.\n\n` +
        `📋 *Schedule Summary:*\n` +
        `• *Attending Physician:* ${doctor}\n` +
        `• *Scheduled Date:* ${date}\n` +
        `• *Time Slot:* ${time}\n\n` +
        `Please carry your previous medical prescriptions and reports.\n\n` +
        `🌐 Patient Portal: https://medipulse-eta.vercel.app/patient/appointments`
      );
    }

    case "APPOINTMENT_CANCELLED": {
      const doctor = data.doctorName ? `Dr. ${data.doctorName.replace(/^Dr\.\s*/i, "")}` : "Hospital Physician";
      const date = data.appointmentDate || data.date || "Scheduled Date";
      const reason = data.reason ? `\n• *Reason:* ${data.reason}` : "";

      return (
        `🏥 *${hospitalName}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `ℹ️ Your appointment with *${doctor}* scheduled for *${date}* has been *cancelled*.${reason}\n\n` +
        `You can easily re-book a convenient slot at your preferred time:\n` +
        `🌐 Book Online: https://medipulse-eta.vercel.app/patient/appointments\n\n` +
        `📞 Helpdesk: 1800-911-0000`
      );
    }

    case "APPOINTMENT_RESCHEDULED": {
      const doctor = data.doctorName ? `Dr. ${data.doctorName.replace(/^Dr\.\s*/i, "")}` : "Hospital Physician";
      const newDate = data.newDate || data.appointmentDate || "Updated Date";
      const newTime = data.newTime || data.timeSlot || "Updated Time";

      return (
        `🏥 *${hospitalName} — Appointment Rescheduled*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `🔄 Your appointment with *${doctor}* has been rescheduled.\n\n` +
        `📋 *New Schedule:*\n` +
        `• *New Date:* ${newDate}\n` +
        `• *New Time:* ${newTime}\n\n` +
        `🌐 Review in Patient Portal: https://medipulse-eta.vercel.app/patient/appointments`
      );
    }

    case "LAB_REPORT_READY": {
      const testNames = data.testName || (data.testsCount ? `${data.testsCount} diagnostic test(s)` : "Pathology Diagnostic Test");
      const orderId = data.orderId || data.orderNumber || "LAB Record";

      return (
        `🏥 *${hospitalName} — Pathology & Diagnostics*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `🧪 Your laboratory test report (*${orderId}* — ${testNames}) is now *verified and ready*.\n\n` +
        `🔒 *Medical Privacy Notice:* For your health data security, complete medical parameters are stored securely inside your encrypted portal.\n\n` +
        `📄 *View / Download Report:* https://medipulse-eta.vercel.app/patient/reports\n\n` +
        `_Thank you for choosing MediPulse Laboratory Services._`
      );
    }

    case "RADIOLOGY_REPORT_READY": {
      const modality = data.modality || "Imaging / Scan";
      const bodyPart = data.bodyPart ? ` (${data.bodyPart})` : "";
      const orderId = data.orderId || "RAD Record";

      return (
        `🏥 *${hospitalName} — Radiology & Imaging*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `🩻 Your *${modality}${bodyPart}* diagnostic scan report (*${orderId}*) is now *ready*.\n\n` +
        `🔒 To view your radiologist's findings securely:\n` +
        `🌐 Patient Health Portal: https://medipulse-eta.vercel.app/patient/reports\n\n` +
        `_MediPulse Imaging Department_`
      );
    }

    case "INVOICE_GENERATED": {
      const invoiceNo = data.invoiceNumber || "INV-2026";
      const amount = data.totalAmount ? `${data.currency || "$"}${data.totalAmount}` : "Charges available";
      const due = data.dueDate || "Due on receipt";

      return (
        `🏥 *${hospitalName} — Billing & Accounts*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `🧾 A new hospital bill (*${invoiceNo}*) has been generated for your medical services.\n\n` +
        `💳 *Total Bill Amount:* ${amount}\n` +
        `📅 *Due Date:* ${due}\n\n` +
        `💳 *View & Pay Online via ABHA Pay / Cards:* https://medipulse-eta.vercel.app/patient/invoices\n\n` +
        `_For billing inquiries or insurance / TPA cashless assistance, please contact the Accounts Desk._`
      );
    }

    case "PAYMENT_RECEIVED": {
      const invoiceNo = data.invoiceNumber || "INV-2026";
      const paid = data.paidAmount ? `${data.currency || "$"}${data.paidAmount}` : "Settled Amount";
      const method = data.paymentMethod || "Digital Payment";
      const balance = data.balanceAmount !== undefined ? `\n• *Remaining Balance:* ${data.currency || "$"}${data.balanceAmount}` : "";

      return (
        `🏥 *${hospitalName} — Payment Receipt*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `✅ We have received your payment for Invoice *${invoiceNo}*.\n\n` +
        `💵 *Amount Paid:* ${paid}\n` +
        `💳 *Payment Mode:* ${method}${balance}\n\n` +
        `📄 *Download Tax Receipt:* https://medipulse-eta.vercel.app/patient/invoices\n\n` +
        `_Thank you for choosing MediPulse Hospital._`
      );
    }

    case "ADMISSION_CONFIRMATION": {
      const admissionId = data.admissionId || "ADM-2026";
      const ward = data.ward || "Inpatient Wing";
      const bed = data.bedNumber || "Assigned Bed";
      const doctor = data.doctorName ? `Dr. ${data.doctorName.replace(/^Dr\.\s*/i, "")}` : "Attending Consultant";

      return (
        `🏥 *${hospitalName} — Inpatient Admission*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `🛌 Patient admission confirmation for *${admissionId}*.\n\n` +
        `📋 *Ward Details:*\n` +
        `• *Ward / Unit:* ${ward}\n` +
        `• *Bed Number:* ${bed}\n` +
        `• *Attending Doctor:* ${doctor}\n\n` +
        `👨‍⚕️ Visiting Hours: 04:00 PM – 07:00 PM\n` +
        `📞 Inpatient Nursing Station Hotline: 1800-911-0000`
      );
    }

    case "DISCHARGE_READY": {
      const dischargeId = data.dischargeId || "DSC-2026";
      const doctor = data.doctorName ? `Dr. ${data.doctorName.replace(/^Dr\.\s*/i, "")}` : "Attending Doctor";
      const followUp = data.followUpDate ? `\n• *Follow-up Date:* ${data.followUpDate}` : "";

      return (
        `🏥 *${hospitalName} — Patient Discharge*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `🎉 Your hospital discharge process (*${dischargeId}*) has been successfully finalized.\n\n` +
        `📋 *Discharge Summary:*\n` +
        `• *Consultant:* ${doctor}${followUp}\n\n` +
        `📄 View complete electronic discharge summary and medication instructions:\n` +
        `🌐 https://medipulse-eta.vercel.app/patient/records\n\n` +
        `_We wish you a speedy and complete recovery!_`
      );
    }

    case "TEST_MESSAGE": {
      const time = new Date().toLocaleTimeString();
      return (
        `🏥 *${hospitalName} — WhatsApp Integration Test*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `🔔 This is a live test notification from MediPulse Hospital Communication System.\n\n` +
        `✅ *Status:* WhatsApp Gateway is connected and functioning properly.\n` +
        `⏰ *Timestamp:* ${time}\n\n` +
        `_MediPulse Hospital IT & Communications Division_`
      );
    }

    default: {
      const message = data.message || "You have a new update from MediPulse Hospital.";
      return (
        `🏥 *${hospitalName}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👋 Hello *${patient}*,\n\n` +
        `${message}\n\n` +
        `🌐 Patient Portal: https://medipulse-eta.vercel.app/patient/dashboard`
      );
    }
  }
}

/**
 * Check if Meta WhatsApp Cloud API credentials are configured in the environment
 */
export function isWhatsAppConfigured(): boolean {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(token && phoneId && token.trim() !== "" && phoneId.trim() !== "");
}

/**
 * Get sanitized integration status object for UI and diagnostics
 */
export function getWhatsAppIntegrationStatus() {
  const configured = isWhatsAppConfigured();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return {
    configured,
    demoMode: !configured,
    provider: configured ? "Meta WhatsApp Cloud API v18.0" : "Simulated Demo Provider",
    phoneNumberId: phoneId
      ? `${phoneId.slice(0, 4)}...${phoneId.slice(-4)}`
      : null,
    apiUrl: process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0",
    status: configured ? "Connected" : "Demo Mode Active",
  };
}

/**
 * Send WhatsApp Notification
 * Dispatches to Meta Graph API if credentials exist, or executes simulated demo delivery safely
 */
export async function sendWhatsAppNotification(
  payload: WhatsAppMessagePayload
): Promise<WhatsAppSendResult> {
  const cleanPhone = sanitizeWhatsAppNumber(payload.to);
  const formattedText = buildWhatsAppMessage(
    payload.eventType,
    payload.recipientName,
    payload.templateData,
    payload.hospitalName
  );

  const configured = isWhatsAppConfigured();

  // If credentials are NOT configured -> Execute in Safe Demo Mode
  if (!configured) {
    const demoId = `wamid.DEMO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Server-side audit log for demo mode
    console.log(
      `[WhatsApp Demo Simulation] To: +${cleanPhone || "UNSPECIFIED"} | Event: ${payload.eventType} | Mode: DEMO\n` +
      `Message:\n${formattedText}\n---`
    );

    return {
      success: true,
      mode: "DEMO",
      messageId: demoId,
      status: "Demo",
      formattedText,
      providerResponse: {
        messaging_product: "whatsapp",
        contacts: [{ input: cleanPhone || "demo", wa_id: cleanPhone || "demo" }],
        messages: [{ id: demoId, message_status: "simulated_delivered" }],
        note: "WhatsApp Demo Mode — Message simulated on server without live Meta API credentials.",
      },
    };
  }

  // Live Meta WhatsApp Cloud API Delivery
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiUrl =
      process.env.WHATSAPP_API_URL ||
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const metaPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: true,
        body: formattedText,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();

    if (response.ok && json.messages?.[0]?.id) {
      return {
        success: true,
        mode: "LIVE",
        messageId: json.messages[0].id,
        status: "Sent",
        formattedText,
        providerResponse: json,
      };
    } else {
      const errMsg = json.error?.message || `WhatsApp API error (${response.status})`;
      console.warn(`[WhatsApp API Warning] Delivery failed: ${errMsg}`);
      return {
        success: false,
        mode: "LIVE",
        status: "Failed",
        formattedText,
        error: errMsg,
        providerResponse: json,
      };
    }
  } catch (err: any) {
    const errMsg = err.name === "AbortError" ? "WhatsApp API request timed out (8s)" : (err.message || "Network error");
    console.warn(`[WhatsApp API Exception] ${errMsg}`);
    return {
      success: false,
      mode: "LIVE",
      status: "Failed",
      formattedText,
      error: errMsg,
    };
  }
}
