import mongoose, { Schema, model, models } from "mongoose";

const NotificationLogSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "APPOINTMENT_CONFIRMATION",
        "APPOINTMENT_REMINDER",
        "APPOINTMENT_CANCELLED",
        "APPOINTMENT_RESCHEDULED",
        "LAB_REPORT_READY",
        "RADIOLOGY_REPORT_READY",
        "INVOICE_GENERATED",
        "PAYMENT_RECEIVED",
        "ADMISSION_CONFIRMATION",
        "DISCHARGE_READY",
        "TEST_MESSAGE",
        "GENERAL",
      ],
    },
    channel: {
      type: String,
      required: true,
      enum: ["WHATSAPP", "IN_APP", "SMS", "EMAIL"],
      default: "WHATSAPP",
    },
    recipientName: { type: String, required: true },
    recipientPhone: { type: String },
    recipientEmail: { type: String },
    patientId: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["Sent", "Demo", "Failed", "Pending"],
      default: "Pending",
    },
    title: { type: String },
    messageSnippet: { type: String, required: true },
    providerResponse: { type: Schema.Types.Mixed },
    errorDetails: { type: String },
    metadata: { type: Schema.Types.Mixed },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

NotificationLogSchema.index({ eventType: 1 });
NotificationLogSchema.index({ channel: 1 });
NotificationLogSchema.index({ status: 1 });
NotificationLogSchema.index({ patientId: 1 });
NotificationLogSchema.index({ createdAt: -1 });

export const NotificationLog =
  models.NotificationLog || model("NotificationLog", NotificationLogSchema);
export default NotificationLog;
