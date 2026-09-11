import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "super_admin",
        "hospital_admin",
        "doctor",
        "receptionist",
        "nurse",
        "pharmacist",
        "lab_technician",
        "accountant",
        "patient",
      ],
      default: "receptionist",
    },
    phone: { type: String },
    avatar: { type: String },
    department: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    digitalSignature: { type: String },
    mciRegistrationNumber: { type: String },
    qualification: { type: String },
    bio: { type: String },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
export default User;
