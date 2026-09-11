import mongoose, { Schema, model, models } from "mongoose";

const AiConsultationSchema = new Schema(
  {
    patientId: { type: String },
    patientName: { type: String },
    age: { type: Number },
    gender: { type: String },
    symptoms: [{ type: String }],
    vitals: {
      bp: String,
      pulse: String,
      temp: String,
      spo2: String,
      sugar: String,
    },
    differentialDiagnosis: [
      {
        condition: String,
        probability: Number,
        icd10Code: String,
        explanation: String,
        urgencyLevel: {
          type: String,
          enum: ["Low", "Moderate", "High", "Emergency"],
          default: "Moderate",
        },
      },
    ],
    recommendedTests: [{ type: String }],
    suggestedPrescription: [
      {
        medicine: String,
        dosage: String,
        frequency: String,
        duration: String,
        rational: String,
      },
    ],
    drugInteractions: [{ type: String }],
    redFlagWarnings: [{ type: String }],
    lifestyleAdvice: [{ type: String }],
    soapNotes: {
      subjective: String,
      objective: String,
      assessment: String,
      plan: String,
    },
  },
  { timestamps: true }
);

export const AiConsultation =
  models.AiConsultation || model("AiConsultation", AiConsultationSchema);
export default AiConsultation;
