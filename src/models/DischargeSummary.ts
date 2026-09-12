import mongoose, { Schema, Document } from "mongoose";

export interface IDischargeSummaryDocument extends Document {
  dischargeId: string;
  admission: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  attendingDoctor: mongoose.Types.ObjectId;
  department: string;
  admissionDate: Date;
  dischargeDate: Date;
  dischargeType: "Normal / Cured" | "Against Medical Advice (LAMA)" | "Transfer to Higher Center" | "Deceased";
  finalDiagnosis: string;
  icd10Code?: string;
  clinicalSummary: string;
  hospitalCourse: string;
  proceduresPerformed: string[];
  investigationsSummary: string;
  dischargeMedicines: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  dietAndActivityAdvice: string;
  followUpDate: Date;
  emergencyInstructions: string;
  billingClearance: {
    isCleared: boolean;
    clearedAt?: Date;
    invoiceNumber?: string;
  };
  doctorSignature?: string;
  status: "Draft" | "Finalized" | "Printed";
  createdAt: Date;
  updatedAt: Date;
}

const DischargeSummarySchema = new Schema<IDischargeSummaryDocument>(
  {
    dischargeId: { type: String, required: true, unique: true },
    admission: { type: Schema.Types.ObjectId, ref: "Admission", required: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    attendingDoctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    department: { type: String, required: true },
    admissionDate: { type: Date, required: true },
    dischargeDate: { type: Date, default: Date.now },
    dischargeType: {
      type: String,
      enum: ["Normal / Cured", "Against Medical Advice (LAMA)", "Transfer to Higher Center", "Deceased"],
      default: "Normal / Cured",
    },
    finalDiagnosis: { type: String, required: true },
    icd10Code: { type: String, default: "" },
    clinicalSummary: { type: String, required: true },
    hospitalCourse: { type: String, default: "" },
    proceduresPerformed: [{ type: String }],
    investigationsSummary: { type: String, default: "" },
    dischargeMedicines: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String, default: "As directed" },
      },
    ],
    dietAndActivityAdvice: { type: String, default: "Regular diet as tolerated. Light physical activity." },
    followUpDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    emergencyInstructions: {
      type: String,
      default: "In case of severe pain, high fever, or shortness of breath, contact 24x7 Emergency (+91 1800-911-0000) immediately.",
    },
    billingClearance: {
      isCleared: { type: Boolean, default: true },
      clearedAt: { type: Date, default: Date.now },
      invoiceNumber: { type: String },
    },
    doctorSignature: { type: String },
    status: {
      type: String,
      enum: ["Draft", "Finalized", "Printed"],
      default: "Finalized",
    },
  },
  { timestamps: true }
);

export default mongoose.models.DischargeSummary ||
  mongoose.model<IDischargeSummaryDocument>("DischargeSummary", DischargeSummarySchema);
