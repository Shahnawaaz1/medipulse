import mongoose, { Schema, Document } from "mongoose";

export interface IIcuRecordDocument extends Document {
  icuId: string;
  admission: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  bed: mongoose.Types.ObjectId;
  unit: "MICU" | "SICU" | "CCU" | "NICU" | "PICU";
  ventilatorStatus:
    | "None"
    | "Invasive Mechanical"
    | "Non-Invasive (NIV)"
    | "CPAP"
    | "BiPAP"
    | "High Flow Nasal Cannula"
    | "Room Air";
  ventilatorSettings?: {
    mode?: string;
    fio2?: string;
    peep?: string;
    tidalVolume?: string;
    pip?: string;
  };
  telemetryVitals: Array<{
    timestamp: Date;
    heartRate: number;
    bpSystolic: number;
    bpDiastolic: number;
    spo2: number;
    temperature: number;
    respiratoryRate: number;
    cpcOrGcs?: number;
  }>;
  inotropesAndInfusions?: Array<{
    drug: string;
    dosage: string;
    rate: string;
    startedAt: Date;
  }>;
  criticalAlerts?: Array<{
    timestamp: Date;
    alertType: "Arrythmia" | "Desaturation" | "Hypotension" | "High Peak Pressure" | "Bradycardia";
    severity: "High" | "Critical";
    resolved: boolean;
  }>;
  attendingIntensivist?: mongoose.Types.ObjectId;
  assignedNurse?: string;
  dailyNotes?: string;
  status: "Active" | "Transferred to Ward" | "Discharged" | "Deceased";
  admittedAt: Date;
  transferredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IcuRecordSchema = new Schema<IIcuRecordDocument>(
  {
    icuId: { type: String, required: true, unique: true },
    admission: { type: Schema.Types.ObjectId, ref: "Admission", required: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    bed: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
    unit: {
      type: String,
      enum: ["MICU", "SICU", "CCU", "NICU", "PICU"],
      default: "MICU",
    },
    ventilatorStatus: {
      type: String,
      enum: [
        "None",
        "Invasive Mechanical",
        "Non-Invasive (NIV)",
        "CPAP",
        "BiPAP",
        "High Flow Nasal Cannula",
        "Room Air",
      ],
      default: "Room Air",
    },
    ventilatorSettings: {
      mode: { type: String, default: "AC/VC" },
      fio2: { type: String, default: "40%" },
      peep: { type: String, default: "5 cmH2O" },
      tidalVolume: { type: String, default: "450 mL" },
      pip: { type: String, default: "22 cmH2O" },
    },
    telemetryVitals: [
      {
        timestamp: { type: Date, default: Date.now },
        heartRate: { type: Number, default: 80 },
        bpSystolic: { type: Number, default: 120 },
        bpDiastolic: { type: Number, default: 80 },
        spo2: { type: Number, default: 98 },
        temperature: { type: Number, default: 98.6 },
        respiratoryRate: { type: Number, default: 18 },
        cpcOrGcs: { type: Number, default: 15 },
      },
    ],
    inotropesAndInfusions: [
      {
        drug: { type: String },
        dosage: { type: String },
        rate: { type: String },
        startedAt: { type: Date, default: Date.now },
      },
    ],
    criticalAlerts: [
      {
        timestamp: { type: Date, default: Date.now },
        alertType: {
          type: String,
          enum: ["Arrythmia", "Desaturation", "Hypotension", "High Peak Pressure", "Bradycardia"],
        },
        severity: { type: String, enum: ["High", "Critical"], default: "High" },
        resolved: { type: Boolean, default: false },
      },
    ],
    attendingIntensivist: { type: Schema.Types.ObjectId, ref: "Doctor" },
    assignedNurse: { type: String },
    dailyNotes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Active", "Transferred to Ward", "Discharged", "Deceased"],
      default: "Active",
    },
    admittedAt: { type: Date, default: Date.now },
    transferredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.IcuRecord ||
  mongoose.model<IIcuRecordDocument>("IcuRecord", IcuRecordSchema);
