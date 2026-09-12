import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLogDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  recordId?: string;
  recordTitle?: string;
  details: string;
  diffSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  timestamp: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    recordId: { type: String },
    recordTitle: { type: String },
    details: { type: String, required: true },
    diffSummary: { type: String },
    ipAddress: { type: String, default: "127.0.0.1" },
    userAgent: { type: String },
    status: {
      type: String,
      enum: ["SUCCESS", "WARNING", "FAILED"],
      default: "SUCCESS",
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AuditLogSchema.index({ module: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ userName: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
