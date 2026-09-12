import mongoose, { Schema, model, models } from "mongoose";

const RadiologyOrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    modality: {
      type: String,
      enum: ["X-Ray", "CT Scan", "MRI", "Ultrasound", "Mammography"],
      required: true,
    },
    bodyPart: { type: String, required: true },
    clinicalNotes: { type: String, required: true },
    orderDate: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Ordered",
        "Scheduled",
        "In Progress",
        "Completed",
        "Report Generated",
      ],
      default: "Ordered",
    },
    radiologistReport: { type: String },
    impression: { type: String },
    price: { type: Number, required: true, default: 120 },
  },
  { timestamps: true }
);

RadiologyOrderSchema.index({ patient: 1, createdAt: -1 });
RadiologyOrderSchema.index({ doctor: 1, createdAt: -1 });
RadiologyOrderSchema.index({ orderDate: -1 });
RadiologyOrderSchema.index({ status: 1 });
RadiologyOrderSchema.index({ modality: 1 });
RadiologyOrderSchema.index({ createdAt: -1 });

export const RadiologyOrder =
  models.RadiologyOrder || model("RadiologyOrder", RadiologyOrderSchema);
export default RadiologyOrder;
