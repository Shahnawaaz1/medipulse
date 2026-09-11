import mongoose, { Schema, model, models } from "mongoose";

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    headDoctor: { type: String },
    floor: { type: String, default: "1st Floor" },
    icon: { type: String, default: "Activity" },
    services: [{ type: String }],
    totalBeds: { type: Number, default: 20 },
    occupiedBeds: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    totalDoctors: { type: Number, default: 4 },
  },
  { timestamps: true }
);

export const Department =
  models.Department || model("Department", DepartmentSchema);
export default Department;
