import mongoose, { Schema, Document } from "mongoose";

export interface IEmergencyCaseDocument extends Document {
  emergencyId: string;
  patient?: mongoose.Types.ObjectId;
  temporaryPatientName?: string;
  temporaryAge?: number;
  temporaryGender?: string;
  arrivalTime: Date;
  arrivalMode: "Ambulance" | "Walk-in" | "Referral" | "Police";
  broughtBy: string;
  emergencyContactPhone: string;
  chiefComplaint: string;
  initialCondition: string;
  triagePriority: "Critical" | "High" | "Medium" | "Low";
  vitalSigns: {
    bp: string;
    pulse: string;
    temperature: string;
    spo2: string;
    respiratoryRate?: string;
  };
  painScore: number;
  consciousness: "Alert" | "Voice" | "Pain" | "Unresponsive";
  assignedDoctor?: mongoose.Types.ObjectId;
  assignedNurse?: string;
  traumaBay?: string;
  treatmentNotes?: string;
  medicationsAdministered?: string[];
  investigationsOrdered?: string[];
  status:
    | "Registered"
    | "Triaged"
    | "Under Assessment"
    | "Treatment"
    | "Observation"
    | "Admitted"
    | "Discharged"
    | "Referred"
    | "Transferred"
    | "LAMA";
  disposition?: "Discharged" | "Admitted" | "Referred" | "Transferred" | "Left Against Medical Advice";
  dispositionNotes?: string;
  dispositionTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyCaseSchema = new Schema<IEmergencyCaseDocument>(
  {
    emergencyId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    temporaryPatientName: { type: String },
    temporaryAge: { type: Number },
    temporaryGender: { type: String },
    arrivalTime: { type: Date, default: Date.now },
    arrivalMode: {
      type: String,
      enum: ["Ambulance", "Walk-in", "Referral", "Police"],
      default: "Walk-in",
    },
    broughtBy: { type: String, default: "Self / Relative" },
    emergencyContactPhone: { type: String, default: "" },
    chiefComplaint: { type: String, required: true },
    initialCondition: { type: String, default: "Stable" },
    triagePriority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    vitalSigns: {
      bp: { type: String, default: "120/80" },
      pulse: { type: String, default: "72" },
      temperature: { type: String, default: "98.6" },
      spo2: { type: String, default: "98" },
      respiratoryRate: { type: String, default: "18" },
    },
    painScore: { type: Number, default: 0, min: 0, max: 10 },
    consciousness: {
      type: String,
      enum: ["Alert", "Voice", "Pain", "Unresponsive"],
      default: "Alert",
    },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: "Doctor" },
    assignedNurse: { type: String },
    traumaBay: { type: String, default: "Bay 1" },
    treatmentNotes: { type: String, default: "" },
    medicationsAdministered: [{ type: String }],
    investigationsOrdered: [{ type: String }],
    status: {
      type: String,
      enum: [
        "Registered",
        "Triaged",
        "Under Assessment",
        "Treatment",
        "Observation",
        "Admitted",
        "Discharged",
        "Referred",
        "Transferred",
        "LAMA",
      ],
      default: "Registered",
    },
    disposition: {
      type: String,
      enum: ["Discharged", "Admitted", "Referred", "Transferred", "Left Against Medical Advice"],
    },
    dispositionNotes: { type: String },
    dispositionTime: { type: Date },
  },
  { timestamps: true }
);

EmergencyCaseSchema.index({ status: 1, triagePriority: 1 });
EmergencyCaseSchema.index({ patient: 1 });
EmergencyCaseSchema.index({ assignedDoctor: 1 });
EmergencyCaseSchema.index({ arrivalTime: -1 });
EmergencyCaseSchema.index({ createdAt: -1 });

export default mongoose.models.EmergencyCase ||
  mongoose.model<IEmergencyCaseDocument>("EmergencyCase", EmergencyCaseSchema);
