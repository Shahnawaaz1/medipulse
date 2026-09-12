import mongoose, { Schema, model, models } from "mongoose";

const AppointmentSchema = new Schema(
  {
    appointmentId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    department: { type: String, required: true },
    appointmentDate: { type: String, required: true },
    timeSlot: { type: String, required: true },
    type: {
      type: String,
      enum: ["General", "Follow-up", "Emergency", "Routine Checkup", "Teleconsultation"],
      default: "General",
    },
    status: {
      type: String,
      enum: [
        "Scheduled",
        "Confirmed",
        "Checked In",
        "In Consultation",
        "Completed",
        "Cancelled",
        "No Show",
      ],
      default: "Scheduled",
    },
    reason: { type: String, required: true },
    vitals: {
      bp: { type: String },
      pulse: { type: String },
      temperature: { type: String },
      spo2: { type: String },
      weight: { type: String },
      height: { type: String },
    },
    consultationType: {
      type: String,
      enum: ["In-Person", "Virtual Teleconsultation"],
      default: "In-Person",
    },
    teleconsultationSession: {
      type: Schema.Types.ObjectId,
      ref: "TeleconsultationSession",
    },
    fee: { type: Number, default: 500 },
    clinicalNotes: { type: String },
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 });
AppointmentSchema.index({ patient: 1, appointmentDate: -1 });
AppointmentSchema.index({ appointmentDate: 1, status: 1 });
AppointmentSchema.index({ consultationType: 1, status: 1 });

export const Appointment = models.Appointment || model("Appointment", AppointmentSchema);
export default Appointment;
