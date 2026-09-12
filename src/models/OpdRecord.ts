import mongoose, { Schema, model, models } from "mongoose";

const OpdRecordSchema = new Schema(
  {
    tokenNumber: { type: Number, required: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    department: { type: String, required: true },
    date: { type: String, required: true },
    vitals: {
      bp: { type: String, default: "120/80" },
      pulse: { type: String, default: "72 bpm" },
      temperature: { type: String, default: "98.6 °F" },
      spo2: { type: String, default: "98%" },
      weight: { type: String, default: "70 kg" },
      height: { type: String, default: "172 cm" },
    },
    symptoms: { type: String, required: true },
    diagnosis: { type: String },
    status: {
      type: String,
      enum: ["Waiting", "In Consultation", "Completed", "Referred"],
      default: "Waiting",
    },
  },
  { timestamps: true }
);

OpdRecordSchema.index({ date: 1, status: 1 });
OpdRecordSchema.index({ patient: 1 });
OpdRecordSchema.index({ doctor: 1 });
OpdRecordSchema.index({ createdAt: -1 });

export const OpdRecord = models.OpdRecord || model("OpdRecord", OpdRecordSchema);
export default OpdRecord;
