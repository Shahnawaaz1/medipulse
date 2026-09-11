import mongoose, { Schema, model, models } from "mongoose";

const AdmissionSchema = new Schema(
  {
    admissionId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    department: { type: String, required: true },
    ward: { type: String, required: true },
    roomNumber: { type: String, required: true },
    bed: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
    admissionDate: { type: String, required: true },
    dischargeDate: { type: String },
    admissionReason: { type: String, required: true },
    treatmentPlan: { type: String },
    vitalsLog: [
      {
        date: { type: String },
        bp: { type: String },
        pulse: { type: String },
        temp: { type: String },
        spo2: { type: String },
        recordedBy: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["Admitted", "Under Treatment", "Ready for Discharge", "Discharged"],
      default: "Admitted",
    },
    dischargeSummary: { type: String },
  },
  { timestamps: true }
);

export const Admission = models.Admission || model("Admission", AdmissionSchema);
export default Admission;
