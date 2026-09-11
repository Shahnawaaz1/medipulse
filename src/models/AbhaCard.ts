import mongoose, { Schema, model, models } from "mongoose";

const AbhaCardSchema = new Schema(
  {
    abhaNumber: { type: String, required: true, unique: true }, // e.g. 12-3456-7890-1234
    abhaAddress: { type: String, required: true, unique: true }, // e.g. rohit.sharma@abdm
    fullName: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dob: { type: String, required: true },
    mobile: { type: String, required: true },
    aadhaarLast4: { type: String, required: true },
    address: { type: String, default: "" },
    state: { type: String, default: "Delhi" },
    district: { type: String, default: "Central Delhi" },
    pincode: { type: String, default: "110001" },
    patientId: { type: String },
    photoUrl: { type: String },
    qrData: { type: String },
    verificationStatus: {
      type: String,
      enum: ["Verified", "Pending", "Failed"],
      default: "Verified",
    },
    careContexts: [
      {
        contextType: {
          type: String,
          enum: ["OPD Visit", "Prescription", "Diagnostic Report", "Discharge Summary"],
        },
        referenceId: String,
        title: String,
        linkedDate: { type: String, default: () => new Date().toISOString() },
      },
    ],
    consentRequests: [
      {
        requestId: String,
        requesterName: String,
        purpose: String,
        grantedFrom: String,
        grantedTo: String,
        status: {
          type: String,
          enum: ["Granted", "Requested", "Revoked", "Expired"],
          default: "Requested",
        },
      },
    ],
  },
  { timestamps: true }
);

export const AbhaCard = models.AbhaCard || model("AbhaCard", AbhaCardSchema);
export default AbhaCard;
