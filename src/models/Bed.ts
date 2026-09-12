import mongoose, { Schema, model, models } from "mongoose";

const BedSchema = new Schema(
  {
    bedNumber: { type: String, required: true, unique: true },
    ward: { type: String, required: true },
    roomNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ["General", "ICU", "Semi-Private", "Deluxe", "Emergency"],
      default: "General",
    },
    dailyRate: { type: Number, required: true, default: 100 },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Reserved", "Maintenance"],
      default: "Available",
    },
    currentAdmission: { type: Schema.Types.ObjectId, ref: "Admission" },
    patientName: { type: String },
  },
  { timestamps: true }
);

BedSchema.index({ status: 1, ward: 1 });
BedSchema.index({ type: 1, status: 1 });
BedSchema.index({ currentAdmission: 1 });

export const Bed = models.Bed || model("Bed", BedSchema);
export default Bed;
