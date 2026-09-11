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
    medicines: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String, default: "After food" },
      },
    ],
    labAdvice: [{ type: String }],
    followUpDate: { type: String },
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
