import mongoose, { Schema, model, models } from "mongoose";

const PatientSchema = new Schema(
  {
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dob: { type: String, required: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    address: { type: String, required: true },
    city: { type: String, required: true },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    allergies: [{ type: String }],
    medicalHistory: [{ type: String }],
    abhaNumber: { type: String },
    abhaAddress: { type: String },
    status: {
      type: String,
      enum: ["Active", "Discharged", "Outpatient", "Inpatient"],
      default: "Active",
    },
  },
  { timestamps: true }
);

PatientSchema.index({ phone: 1 });
PatientSchema.index({ email: 1 });
PatientSchema.index({ status: 1 });
PatientSchema.index({ name: 1 });
PatientSchema.index({ createdAt: -1 });

export const Patient = models.Patient || model("Patient", PatientSchema);
export default Patient;
