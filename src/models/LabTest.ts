import mongoose, { Schema, model, models } from "mongoose";

const LabTestSchema = new Schema(
  {
    testCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Hematology",
        "Biochemistry",
        "Microbiology",
        "Immunology",
        "Pathology",
        "Urine",
      ],
      required: true,
    },
    price: { type: Number, required: true },
    sampleType: { type: String, default: "Blood" },
    turnaroundTime: { type: String, default: "24 Hours" },
    referenceRanges: [
      {
        parameter: { type: String, required: true },
        unit: { type: String, required: true },
        normalMale: { type: String, required: true },
        normalFemale: { type: String, required: true },
      },
    ],
    description: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export const LabTest = models.LabTest || model("LabTest", LabTestSchema);
export default LabTest;
