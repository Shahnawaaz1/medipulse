import mongoose, { Schema, model, models } from "mongoose";

const MedicineSchema = new Schema(
  {
    name: { type: String, required: true },
    genericName: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Ointment",
        "Drops",
        "Inhaler",
      ],
      required: true,
    },
    manufacturer: { type: String, required: true },
    batchNumber: { type: String, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    minThreshold: { type: Number, required: true, default: 10 },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    expiryDate: { type: String, required: true },
    locationRack: { type: String, default: "Rack A1" },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock", "Expired"],
      default: "In Stock",
    },
  },
  { timestamps: true }
);

MedicineSchema.index({ name: 1 });
MedicineSchema.index({ status: 1, stockQuantity: 1 });
MedicineSchema.index({ category: 1 });
MedicineSchema.index({ createdAt: -1 });

export const Medicine = models.Medicine || model("Medicine", MedicineSchema);
export default Medicine;
