import mongoose, { Schema, model, models } from "mongoose";

const InventorySchema = new Schema(
  {
    itemCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Surgical",
        "Equipment",
        "Consumables",
        "Diagnostic Supplies",
        "Sanitation",
      ],
      required: true,
    },
    quantity: { type: Number, required: true, default: 0 },
    minThreshold: { type: Number, required: true, default: 10 },
    unit: { type: String, required: true, default: "Pieces" },
    unitPrice: { type: Number, required: true },
    supplier: { type: String, required: true },
    lastRestocked: { type: String, required: true },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
  },
  { timestamps: true }
);

export const Inventory = models.Inventory || model("Inventory", InventorySchema);
export default Inventory;
