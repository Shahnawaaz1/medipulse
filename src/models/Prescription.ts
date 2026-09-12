import mongoose, { Schema, model, models } from "mongoose";

const PrescriptionSchema = new Schema(
  {
    prescriptionId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentId: { type: String },
    date: { type: String, required: true },
    diagnosis: { type: String, required: true },
    clinicalNotes: { type: String },
    chiefComplaint: { type: String },
    medicines: [
      {
        medicineName: { type: String, required: true },
        genericName: { type: String },
        strength: { type: String },
        dosage: { type: String, required: true },
        route: { type: String, default: "Oral" },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        quantity: { type: String },
        instructions: { type: String, default: "After food" },
      },
    ],
    labAdvice: [{ type: String }],
    followUpDate: { type: String },
    isDigitallySigned: { type: Boolean, default: false },
    signedBy: { type: String },
    signedAt: { type: Date },
    signatureMetadata: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["Active", "Dispensed", "Completed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export const Prescription =
  models.Prescription || model("Prescription", PrescriptionSchema);
export default Prescription;
