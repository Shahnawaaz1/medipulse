import mongoose, { Schema, Document } from "mongoose";

export interface IOperationTheatreDocument extends Document {
  otScheduleId: string;
  theatreNumber: string;
  patient: mongoose.Types.ObjectId;
  admission?: mongoose.Types.ObjectId;
  leadSurgeon: mongoose.Types.ObjectId;
  assistantSurgeon?: mongoose.Types.ObjectId;
  anesthetist?: mongoose.Types.ObjectId;
  scrubNurse?: string;
  procedureName: string;
  specialty: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  anesthesiaType: "General" | "Spinal" | "Epidural" | "Local" | "Regional Nerve Block" | "Sedation";
  preOpChecklist: {
    consentSigned: boolean;
    npoStatusVerified: boolean;
    bloodCrossmatched: boolean;
    anesthesiaCleared: boolean;
    siteMarked: boolean;
  };
  surgeryStatus: "Scheduled" | "Pre-Op" | "In Progress" | "Recovery" | "Completed" | "Cancelled";
  surgicalFindings?: string;
  postOpNotes?: string;
  bloodUnitsUsed?: number;
  implantsUsed?: string[];
  pacuScore?: number;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OperationTheatreSchema = new Schema<IOperationTheatreDocument>(
  {
    otScheduleId: { type: String, required: true, unique: true },
    theatreNumber: { type: String, required: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    admission: { type: Schema.Types.ObjectId, ref: "Admission" },
    leadSurgeon: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    assistantSurgeon: { type: Schema.Types.ObjectId, ref: "Doctor" },
    anesthetist: { type: Schema.Types.ObjectId, ref: "Doctor" },
    scrubNurse: { type: String, default: "" },
    procedureName: { type: String, required: true },
    specialty: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    anesthesiaType: {
      type: String,
      enum: ["General", "Spinal", "Epidural", "Local", "Regional Nerve Block", "Sedation"],
      default: "General",
    },
    preOpChecklist: {
      consentSigned: { type: Boolean, default: false },
      npoStatusVerified: { type: Boolean, default: false },
      bloodCrossmatched: { type: Boolean, default: false },
      anesthesiaCleared: { type: Boolean, default: false },
      siteMarked: { type: Boolean, default: false },
    },
    surgeryStatus: {
      type: String,
      enum: ["Scheduled", "Pre-Op", "In Progress", "Recovery", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    surgicalFindings: { type: String, default: "" },
    postOpNotes: { type: String, default: "" },
    bloodUnitsUsed: { type: Number, default: 0 },
    implantsUsed: [{ type: String }],
    pacuScore: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export default mongoose.models.OperationTheatre ||
  mongoose.model<IOperationTheatreDocument>("OperationTheatre", OperationTheatreSchema);
