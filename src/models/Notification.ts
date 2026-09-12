import mongoose, { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "danger"],
      default: "info",
    },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ read: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification =
  models.Notification || model("Notification", NotificationSchema);
export default Notification;
