import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "ADMIN",
        "HOSPITAL_ADMIN",
        "DOCTOR",
        "NURSE",
        "RECEPTIONIST",
        "PHARMACIST",
        "ACCOUNTANT",
        "LAB_TECHNICIAN",
        "RADIOLOGY_TECHNICIAN",
        "PATIENT",
        "super_admin",
        "hospital_admin",
        "admin",
        "doctor",
        "receptionist",
        "nurse",
        "pharmacist",
        "lab_technician",
        "radiology_technician",
        "accountant",
        "patient",
      ],
      default: "PATIENT",
    },
    employeeId: { type: String, sparse: true, trim: true },
    patientId: { type: String, sparse: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    department: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "Active", "Inactive", "Suspended"],
      default: "active",
    },
    digitalSignature: { type: String },
    mciRegistrationNumber: { type: String },
    qualification: { type: String },
    bio: { type: String },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
export default User;
