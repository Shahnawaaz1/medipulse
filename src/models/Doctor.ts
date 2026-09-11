import mongoose, { Schema, model, models } from "mongoose";

const DoctorSchema = new Schema(
  {
    doctorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    experienceYears: { type: Number, required: true, default: 5 },
    consultationFee: { type: Number, required: true, default: 500 },
    emergencyFee: { type: Number, default: 1000 },
    teleconsultationFee: { type: Number, default: 400 },
    roomNumber: { type: String, required: true, default: "101" },
    mciNumber: { type: String, default: "MCI-48291" },
    digitalSignature: { type: String },
    bio: { type: String },
    slotDurationMinutes: { type: Number, default: 15 },
    availableDays: [{ type: String }],
    workingHours: {
      start: { type: String, default: "09:00 AM" },
      end: { type: String, default: "05:00 PM" },
    },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
    },
    photo: { type: String },
    rating: { type: Number, default: 4.9 },
    totalReviews: { type: Number, default: 120 },
  },
  { timestamps: true }
);

export const Doctor = models.Doctor || model("Doctor", DoctorSchema);
export default Doctor;
