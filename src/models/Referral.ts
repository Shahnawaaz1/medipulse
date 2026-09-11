import mongoose, { Schema, model, models } from "mongoose";

const ReferralSchema = new Schema(
  {
    referralId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    referringDoctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    destinationHospital: { type: String, required: true },
    destinationDepartment: { type: String, required: true },
    destinationSpecialist: { type: String },
    diagnosis: { type: String, required: true },
    reasonForReferral: { type: String, required: true },
    clinicalSummary: { type: String },
    priority: {
      type: String,
      enum: ["Normal", "Urgent", "Emergency"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: ["Pending", "Sent", "Accepted", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
    },
    referralDate: { type: String, required: true },
    notes: { type: String },
    createdBy: { type: String },
    transportRequired: { type: Boolean, default: false },
    accompanyingNurse: { type: String },
  },
  { timestamps: true }
);

export const Referral = models.Referral || model("Referral", ReferralSchema);
export default Referral;
