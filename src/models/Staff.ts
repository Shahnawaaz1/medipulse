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
        "STAFF",
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
        "staff",
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
      enum: ["Active", "Inactive", "On Leave", "Terminated", "Suspended", "active", "inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export const Staff = models.Staff || model("Staff", StaffSchema);
export default Staff;
