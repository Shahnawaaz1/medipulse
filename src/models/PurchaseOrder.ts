import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrderDocument extends Document {
  poNumber: string;
  supplierName: string;
  supplierContact: string;
  items: Array<{
    itemId?: mongoose.Types.ObjectId;
    itemCode: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: "Draft" | "Requested" | "Approved" | "PO Issued" | "Goods Received" | "Invoiced" | "Paid" | "Cancelled";
  goodsReceivedDate?: Date;
  requestedBy: string;
  approvedBy?: string;
  paymentStatus: "Unpaid" | "Partially Paid" | "Paid";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>(
  {
    poNumber: { type: String, required: true, unique: true },
    supplierName: { type: String, required: true },
    supplierContact: { type: String, default: "" },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId },
        itemCode: { type: String, required: true },
        name: { type: String, required: true },
        category: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: "Units" },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    status: {
      type: String,
      enum: [
        "Draft",
        "Requested",
        "Approved",
        "PO Issued",
        "Goods Received",
        "Invoiced",
        "Paid",
        "Cancelled",
      ],
      default: "Requested",
    },
    goodsReceivedDate: { type: Date },
    requestedBy: { type: String, required: true },
    approvedBy: { type: String },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrderDocument>("PurchaseOrder", PurchaseOrderSchema);
