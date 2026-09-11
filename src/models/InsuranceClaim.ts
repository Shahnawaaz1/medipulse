import mongoose, { Schema, model, models } from "mongoose";

const InsuranceClaimSchema = new Schema(
  {
    claimId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    tpaCompany: { type: String, required: true }, // e.g. Star Health, HDFC ERGO, Medi Assist, Vidal Health
    policyNumber: { type: String, required: true },
    policyHolderName: { type: String, required: true },
    hospitalizationType: {
      type: String,
      enum: ["Cashless", "Reimbursement"],
      default: "Cashless",
    },
    claimedAmount: { type: Number, required: true },
    approvedAmount: { type: Number, default: 0 },
    admissionId: { type: String },
    treatmentName: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Under Query",
        "Approved",
        "Settled",
        "Rejected",
      ],
      default: "Submitted",
    },
    queryDetails: { type: String },
    claimDate: { type: String, required: true },
    settledDate: { type: String },
    documents: [{ type: String }],
  },
  { timestamps: true }
);

export const InsuranceClaim =
  models.InsuranceClaim || model("InsuranceClaim", InsuranceClaimSchema);
export default InsuranceClaim;
