import mongoose, { Schema, model, models } from "mongoose";

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor" },
    items: [
      {
        description: { type: String, required: true },
        category: {
          type: String,
          enum: [
            "Consultation",
            "Pharmacy",
            "Laboratory",
            "Radiology",
            "Room Charges",
            "Procedure",
            "Nursing",
            "Other",
          ],
          default: "Consultation",
        },
        quantity: { type: Number, required: true, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partially Paid", "Pending", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "Credit Card",
        "Debit Card",
        "UPI",
        "Bank Transfer",
        "Insurance",
      ],
      default: "Cash",
    },
    invoiceDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Invoice = models.Invoice || model("Invoice", InvoiceSchema);
export default Invoice;
