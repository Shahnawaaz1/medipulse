import mongoose, { Schema, model, models } from "mongoose";

const StaffSchema = new Schema(
  {
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
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
      required: true,
    },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    joiningDate: { type: String, required: true },
    salary: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Terminated"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export const Staff = models.Staff || model("Staff", StaffSchema);
export default Staff;
