import mongoose, { Schema, model, models } from "mongoose";

const LabOrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    tests: [
      {
        test: { type: Schema.Types.ObjectId, ref: "LabTest" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        results: [
          {
            parameter: { type: String },
            value: { type: String },
            unit: { type: String },
            referenceRange: { type: String },
            flag: {
              type: String,
              enum: ["Normal", "High", "Low", "Abnormal"],
              default: "Normal",
            },
          },
        ],
      },
    ],
    orderDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["Ordered", "Sample Collected", "Processing", "Completed", "Cancelled"],
      default: "Ordered",
    },
    clinicalFindings: { type: String },
    technicianNotes: { type: String },
    completedAt: { type: String },
  },
  { timestamps: true }
);

LabOrderSchema.index({ patient: 1, createdAt: -1 });
LabOrderSchema.index({ doctor: 1, createdAt: -1 });
LabOrderSchema.index({ orderDate: -1 });
LabOrderSchema.index({ status: 1 });
LabOrderSchema.index({ createdAt: -1 });

export const LabOrder = models.LabOrder || model("LabOrder", LabOrderSchema);
export default LabOrder;
