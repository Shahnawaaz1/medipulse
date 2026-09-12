import mongoose, { Schema, Document, model, models } from "mongoose";
import "./Patient";
import "./Doctor";
import "./Appointment";
import "./Prescription";

export interface ITeleconsultationSessionDocument extends Document {
  sessionId: string;
  roomId: string;
  appointment?: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  scheduledDate?: string;
  scheduledTime?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  durationSeconds?: number;
  sessionStatus:
    | "Scheduled"
    | "Waiting Room"
    | "Doctor Joined"
    | "Patient Joined"
    | "In Consultation"
    | "Completed"
    | "Cancelled"
    | "No Show";
  connectionStatus:
    | "Idle"
    | "Connecting"
    | "Connected"
    | "Disconnected"
    | "Reconnecting"
    | "Failed";
  doctorNotes?: {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    symptoms?: string;
    clinicalObservations?: string;
    assessment?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    additionalNotes?: string;
  };
  prescription?: mongoose.Types.ObjectId;
  prescriptionSummary?: {
    prescriptionId: string;
    medicines: Array<{
      medicineName: string;
      genericName?: string;
      strength?: string;
      dosage: string;
      route?: string;
      frequency: string;
      duration: string;
      quantity?: string;
      instructions: string;
    }>;
    labAdvice?: string[];
    followUpDate?: string;
    isDigitallySigned?: boolean;
    signedBy?: string;
    signedAt?: Date;
    signatureMetadata?: any;
  };
  chatMessages: Array<{
    id: string;
    sender: string;
    senderRole: "Doctor" | "Patient" | string;
    text: string;
    timestamp: Date;
  }>;
  cdsAlertsAcknowledged?: string[];
  followUpDate?: string;
  isSigned?: boolean;
  signedByDoctorName?: string;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeleconsultationSessionSchema = new Schema<ITeleconsultationSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    roomId: { type: String, required: true, index: true },
    appointment: { type: Schema.Types.ObjectId, ref: "Appointment" },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    sessionStatus: {
      type: String,
      enum: [
        "Scheduled",
        "Waiting Room",
        "Doctor Joined",
        "Patient Joined",
        "In Consultation",
        "Completed",
        "Cancelled",
        "No Show",
      ],
      default: "Waiting Room",
    },
    connectionStatus: {
      type: String,
      enum: [
        "Idle",
        "Connecting",
        "Connected",
        "Disconnected",
        "Reconnecting",
        "Failed",
      ],
      default: "Idle",
    },
    doctorNotes: {
      chiefComplaint: { type: String, default: "" },
      historyOfPresentIllness: { type: String, default: "" },
      symptoms: { type: String, default: "" },
      clinicalObservations: { type: String, default: "" },
      assessment: { type: String, default: "" },
      diagnosis: { type: String, default: "" },
      treatmentPlan: { type: String, default: "" },
      additionalNotes: { type: String, default: "" },
    },
    prescription: { type: Schema.Types.ObjectId, ref: "Prescription" },
    prescriptionSummary: {
      prescriptionId: { type: String },
      medicines: [
        {
          medicineName: { type: String, required: true },
          genericName: { type: String },
          strength: { type: String },
          dosage: { type: String, required: true },
          route: { type: String, default: "Oral" },
          frequency: { type: String, required: true },
          duration: { type: String, required: true },
          quantity: { type: String },
          instructions: { type: String, default: "After food" },
        },
      ],
      labAdvice: [{ type: String }],
      followUpDate: { type: String },
      isDigitallySigned: { type: Boolean, default: false },
      signedBy: { type: String },
      signedAt: { type: Date },
      signatureMetadata: { type: Schema.Types.Mixed },
    },
    chatMessages: [
      {
        id: { type: String, required: true },
        sender: { type: String, required: true },
        senderRole: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    cdsAlertsAcknowledged: [{ type: String }],
    followUpDate: { type: String },
    isSigned: { type: Boolean, default: false },
    signedByDoctorName: { type: String },
    signedAt: { type: Date },
  },
  { timestamps: true }
);

TeleconsultationSessionSchema.index({ patient: 1, createdAt: -1 });
TeleconsultationSessionSchema.index({ doctor: 1, createdAt: -1 });
TeleconsultationSessionSchema.index({ appointment: 1 });
TeleconsultationSessionSchema.index({ sessionStatus: 1 });
TeleconsultationSessionSchema.index({ createdAt: -1 });

export const TeleconsultationSession =
  models.TeleconsultationSession ||
  model<ITeleconsultationSessionDocument>(
    "TeleconsultationSession",
    TeleconsultationSessionSchema
  );

export default TeleconsultationSession;
