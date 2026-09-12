import mongoose, { Schema, Document } from "mongoose";

export interface INursingCareDocument extends Document {
  patient: mongoose.Types.ObjectId;
  admission: mongoose.Types.ObjectId;
  nurse: string;
  shift: "Morning" | "Evening" | "Night";
  date: Date;
  carePlan: string[];
  medicationAdministration: Array<{
    medicineName: string;
    dosage: string;
    route: string;
    scheduledTime: string;
    administeredTime?: Date;
    status: "Due" | "Administered" | "Held" | "Refused";
    givenBy?: string;
    notes?: string;
  }>;
  intakeOutput: {
    oralIntakeMl: number;
    ivFluidsMl: number;
    totalIntakeMl: number;
    urineOutputMl: number;
    drainOutputMl: number;
    totalOutputMl: number;
    fluidBalanceMl: number;
  };
  vitals: Array<{
    time: string;
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
    sugar?: string;
    painLevel: number;
    recordedBy: string;
  }>;
  nursingAlerts: string[];
  shiftHandoverNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NursingCareSchema = new Schema<INursingCareDocument>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    admission: { type: Schema.Types.ObjectId, ref: "Admission", required: true },
    nurse: { type: String, required: true },
    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night"],
      default: "Morning",
    },
    date: { type: Date, default: Date.now },
    carePlan: [{ type: String }],
    medicationAdministration: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        route: { type: String, default: "Oral" },
        scheduledTime: { type: String, required: true },
        administeredTime: { type: Date },
        status: {
          type: String,
          enum: ["Due", "Administered", "Held", "Refused"],
          default: "Due",
        },
        givenBy: { type: String },
        notes: { type: String },
      },
    ],
    intakeOutput: {
      oralIntakeMl: { type: Number, default: 0 },
      ivFluidsMl: { type: Number, default: 0 },
      totalIntakeMl: { type: Number, default: 0 },
      urineOutputMl: { type: Number, default: 0 },
      drainOutputMl: { type: Number, default: 0 },
      totalOutputMl: { type: Number, default: 0 },
      fluidBalanceMl: { type: Number, default: 0 },
    },
    vitals: [
      {
        time: { type: String, default: () => new Date().toLocaleTimeString() },
        bp: { type: String, default: "120/80" },
        pulse: { type: String, default: "72" },
        temp: { type: String, default: "98.6" },
        spo2: { type: String, default: "98" },
        sugar: { type: String },
        painLevel: { type: Number, default: 0 },
        recordedBy: { type: String, default: "Nurse" },
      },
    ],
    nursingAlerts: [{ type: String }],
    shiftHandoverNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.NursingCare ||
  mongoose.model<INursingCareDocument>("NursingCare", NursingCareSchema);
