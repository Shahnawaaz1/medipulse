import mongoose, { Schema, model, models } from "mongoose";

const HospitalSettingSchema = new Schema(
  {
    hospitalName: { type: String, default: "MediPulse Hospital & Research Center" },
    tagline: { type: String, default: "Advanced Healthcare with Compassion" },
    email: { type: String, default: "contact@medipulsehospital.com" },
    phone: { type: String, default: "+1 (800) 555-0199" },
    emergencyHotline: { type: String, default: "+1 (800) 911-HELP" },
    address: { type: String, default: "742 Evergreen Healthcare Blvd, Suite 500" },
    city: { type: String, default: "New York" },
    state: { type: String, default: "NY" },
    zipCode: { type: String, default: "10001" },
    taxId: { type: String, default: "TAX-MED-994821" },
    currencySymbol: { type: String, default: "$" },
    timezone: { type: String, default: "America/New_York" },
    whatsappIntegration: {
      enabled: { type: Boolean, default: true },
      senderPhoneNumber: { type: String, default: "+1 (800) 555-0199" },
      autoNotifyAppointments: { type: Boolean, default: true },
      autoNotifyBilling: { type: Boolean, default: true },
      autoNotifyReports: { type: Boolean, default: true },
      autoNotifyAdmissions: { type: Boolean, default: true },
      appointmentReminderHours: { type: Number, default: 24 },
    },
  },
  { timestamps: true }
);

export const HospitalSetting =
  models.HospitalSetting || model("HospitalSetting", HospitalSettingSchema);
export default HospitalSetting;
