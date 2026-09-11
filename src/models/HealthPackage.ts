import mongoose, { Schema, model, models } from "mongoose";

const HealthPackageSchema = new Schema(
  {
    packageCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Preventive",
        "Cardiac",
        "Maternity",
        "Senior Citizen",
        "Executive",
        "Diabetes",
        "Women Health",
      ],
      default: "Preventive",
    },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    description: { type: String, required: true },
    features: [{ type: String }],
    includedTests: [{ type: String }],
    includedConsultations: [{ type: String }],
    durationDays: { type: Number, default: 1 },
    popular: { type: Boolean, default: false },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export const HealthPackage =
  models.HealthPackage || model("HealthPackage", HealthPackageSchema);
export default HealthPackage;
