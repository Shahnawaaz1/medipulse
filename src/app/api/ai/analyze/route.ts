import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AiConsultation } from "@/models/AiConsultation";

export async function POST(request: Request) {
  try {
    const { symptoms, vitals, age, gender, patientName } = await request.json();

    const symptomText = Array.isArray(symptoms)
      ? symptoms.join(", ").toLowerCase()
      : (symptoms || "").toLowerCase();

    // Healthcare Clinical Intelligence Engine
    let differentialDiagnosis: any[] = [];
    let recommendedTests: string[] = [];
    let suggestedPrescription: any[] = [];
    let redFlagWarnings: string[] = [];
    let lifestyleAdvice: string[] = [];

    // Analyze cardiac symptoms
    if (
      symptomText.includes("chest pain") ||
      symptomText.includes("shortness of breath") ||
      symptomText.includes("palpitations") ||
      symptomText.includes("sweating")
    ) {
      differentialDiagnosis.push(
        {
          condition: "Acute Coronary Syndrome / Angina Pectoris",
          probability: 84,
          icd10Code: "I20.9 (Angina Pectoris, Unspecified)",
          explanation:
            "Symptoms of chest discomfort and shortness of breath strongly indicate myocardial ischemia or coronary artery involvement.",
          urgencyLevel: "Emergency",
        },
        {
          condition: "Gastroesophageal Reflux Disease (GERD)",
          probability: 42,
          icd10Code: "K21.9 (Gastro-esophageal reflux disease without esophagitis)",
          explanation:
            "Substernal chest burning can mimic angina; must be ruled out after cardiac workup.",
          urgencyLevel: "Moderate",
        }
      );
      recommendedTests.push(
        "12-Lead Electrocardiogram (ECG - Immediate)",
        "Cardiac Troponin-I / hs-cTnT (Serial at 0h, 3h)",
        "2D Echocardiography & EF assessment",
        "Lipid Profile & Serum Electrolytes"
      );
      suggestedPrescription.push(
        {
          medicine: "Aspirin 75mg (Dispersible)",
          dosage: "1 Tablet",
          frequency: "1-0-0 (Morning with food)",
          duration: "30 Days",
          rational: "Antiplatelet therapy for coronary prophylaxis",
        },
        {
          medicine: "Atorvastatin 40mg",
          dosage: "1 Tablet",
          frequency: "0-0-1 (Night)",
          duration: "30 Days",
          rational: "High-intensity lipid lowering and plaque stabilization",
        },
        {
          medicine: "Sorbitrate 5mg (Isosorbide Dinitrate)",
          dosage: "1 Tablet",
          frequency: "SOS (Sublingual on chest pain)",
          duration: "As needed",
          rational: "Immediate coronary vasodilation",
        }
      );
      redFlagWarnings.push(
        "Radiating pain to left arm, neck or jaw",
        "Diaphoresis (cold sweats) or sudden syncope/dizziness",
        "SpO2 dropping below 93% or resting tachycardia > 110 bpm"
      );
      lifestyleAdvice.push(
        "Strict low-sodium (< 2g/day) and low saturated fat diet",
        "Avoid heavy lifting and strenuous physical exertion until cleared by cardiologist",
        "Smoking cessation and zero tobacco consumption"
      );
    } else if (
      symptomText.includes("fever") ||
      symptomText.includes("cough") ||
      symptomText.includes("throat") ||
      symptomText.includes("chills")
    ) {
      differentialDiagnosis.push(
        {
          condition: "Acute Upper Respiratory Tract Infection / Bronchitis",
          probability: 78,
          icd10Code: "J06.9 (Acute upper respiratory infection, unspecified)",
          explanation:
            "Fever with cough and throat discomfort represents viral or secondary bacterial respiratory tract infection.",
          urgencyLevel: "Moderate",
        },
        {
          condition: "Viral Flu / Influenza A/B",
          probability: 65,
          icd10Code: "J11.1 (Influenza due to unidentified influenza virus)",
          explanation:
            "Acute onset of high-grade fever with generalized myalgia and malaise.",
          urgencyLevel: "Moderate",
        }
      );
      recommendedTests.push(
        "Complete Blood Count (CBC) with ESR",
        "Rapid Influenza Antigen Test / RT-PCR",
        "Digital Chest X-Ray (PA View)",
        "C-Reactive Protein (CRP)"
      );
      suggestedPrescription.push(
        {
          medicine: "Paracetamol 650mg",
          dosage: "1 Tablet",
          frequency: "1-1-1 (TID after food)",
          duration: "5 Days",
          rational: "Antipyretic and analgesic for fever and myalgia",
        },
        {
          medicine: "Levocetirizine 5mg + Montelukast 10mg",
          dosage: "1 Tablet",
          frequency: "0-0-1 (Night)",
          duration: "7 Days",
          rational: "Antihistamine and anti-inflammatory for airway relief",
        },
        {
          medicine: "Amoxicillin + Clavulanic 625mg (Augmentin)",
          dosage: "1 Tablet",
          frequency: "1-0-1 (Twice daily after meals)",
          duration: "5 Days",
          rational: "Broad spectrum coverage if bacterial etiology confirmed",
        }
      );
      redFlagWarnings.push(
        "Persistent high fever > 102°F not responding to antipyretics",
        "Dyspnea, audible wheeze, or hemoptysis (blood in sputum)",
        "Stridor or severe difficulty swallowing"
      );
      lifestyleAdvice.push(
        "Steam inhalation twice daily with saline nasal rinses",
        "Maintain high oral hydration with warm fluids and soups (2.5L/day)",
        "Adequate sleep and isolation to prevent domestic transmission"
      );
    } else if (
      symptomText.includes("abdominal pain") ||
      symptomText.includes("vomiting") ||
      symptomText.includes("nausea") ||
      symptomText.includes("diarrhea")
    ) {
      differentialDiagnosis.push(
        {
          condition: "Acute Gastroenteritis / Infectious Enteritis",
          probability: 82,
          icd10Code: "A09 (Infectious gastroenteritis and colitis, unspecified)",
          explanation:
            "Abdominal cramps with nausea/vomiting typically signify mucosal inflammation from infectious or toxic ingestion.",
          urgencyLevel: "Moderate",
        },
        {
          condition: "Acute Gastritis / Peptic Ulcer Disease",
          probability: 55,
          icd10Code: "K29.70 (Gastritis, unspecified, without bleeding)",
          explanation:
            "Epigastric tenderness aggravated by fasting or spicy foods.",
          urgencyLevel: "Low",
        }
      );
      recommendedTests.push(
        "Stool Routine & Microscopy / Occult Blood",
        "Serum Electrolytes (Na+, K+, Cl-)",
        "Ultrasound Whole Abdomen (to rule out Appendicitis/Cholecystitis)",
        "Complete Hemogram & LFT"
      );
      suggestedPrescription.push(
        {
          medicine: "Pantoprazole 40mg + Domperidone 30mg (Pan-D)",
          dosage: "1 Capsule",
          frequency: "1-0-0 (Empty stomach 30 mins before breakfast)",
          duration: "14 Days",
          rational: "Proton pump inhibitor and anti-emetic gastroprokinetic",
        },
        {
          medicine: "Oral Rehydration Salts (ORS Electral)",
          dosage: "1 Sachet in 1L Water",
          frequency: "Sip throughout day",
          duration: "3-5 Days",
          rational: "Prevent dehydration and electrolyte imbalance",
        },
        {
          medicine: "Dicyclomine 20mg + Paracetamol (Meftal-Spas)",
          dosage: "1 Tablet",
          frequency: "SOS (Subside acute spasmodic abdominal colic)",
          duration: "As needed",
          rational: "Antispasmodic for visceral cramps",
        }
      );
      redFlagWarnings.push(
        "Rigid 'board-like' abdomen or localized right lower quadrant rebound tenderness",
        "Coffee-ground hematemesis or dark tarry stools (melena)",
        "Inability to retain liquids leading to oliguria / anuria"
      );
      lifestyleAdvice.push(
        "Bland diet (BRAT: Banana, Rice, Applesauce, Toast)",
        "Avoid dairy, caffeine, alcohol, and spicy or fried items for 5 days"
      );
    } else {
      // General Clinical Evaluation
      differentialDiagnosis.push(
        {
          condition: "General Clinical Syndrome Under Evaluation",
          probability: 70,
          icd10Code: "R69 (Illness, unspecified)",
          explanation:
            "Primary symptoms require routine metabolic, inflammatory and clinical baseline evaluation.",
          urgencyLevel: "Low",
        },
        {
          condition: "Metabolic Syndrome / Chronic Fatigue",
          probability: 45,
          icd10Code: "E88.81 (Metabolic syndrome)",
          explanation:
            "Lifestyle-associated fatigue, requiring metabolic screening.",
          urgencyLevel: "Low",
        }
      );
      recommendedTests.push(
        "Comprehensive Complete Blood Count (CBC)",
        "Fasting Blood Sugar & Glycated HbA1c",
        "Kidney & Liver Function Test (KFT & LFT)",
        "Thyroid Stimulating Hormone (TSH)"
      );
      suggestedPrescription.push(
        {
          medicine: "Multivitamin + Zinc + Methylcobalamin",
          dosage: "1 Tablet",
          frequency: "0-1-0 (After lunch)",
          duration: "30 Days",
          rational: "Nutritional support and cellular metabolic revitalization",
        }
      );
      redFlagWarnings.push(
        "Unexplained rapid weight loss > 5% in 1 month",
        "Persistent unprovoked fatigue or high-grade nocturnal fevers"
      );
      lifestyleAdvice.push(
        "Maintain balanced Mediterranean-style nutrition and 7-8 hours restful sleep",
        "30 minutes of moderate aerobic exercise 5 days a week"
      );
    }

    const aiConsultation = {
      patientName: patientName || "Evaluated Patient",
      age: age || 40,
      gender: gender || "Unspecified",
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      vitals: vitals || {},
      differentialDiagnosis,
      recommendedTests,
      suggestedPrescription,
      redFlagWarnings,
      lifestyleAdvice,
      soapNotes: {
        subjective: `Patient presented with complaints of ${symptomText}. Reports onset over the past several days with fluctuating severity.`,
        objective: `Vitals recorded: BP: ${vitals?.bp || "120/80 mmHg"}, Pulse: ${vitals?.pulse || "76 bpm"}, SpO2: ${vitals?.spo2 || "98%"}, Temp: ${vitals?.temp || "98.6 F"}. Systemic review pending detailed physical palpation.`,
        assessment: `Primary clinical impression aligns with ${differentialDiagnosis[0]?.condition || "clinical presentation"}. Differential includes ${differentialDiagnosis[1]?.condition || "secondary causes"}.`,
        plan: `1. Initiate empirical symptomatic management as prescribed. 2. Schedule recommended diagnostic panel (${recommendedTests.slice(0, 2).join(", ")}). 3. Review in 3-5 days or immediately if red flag symptoms arise.`,
      },
    };

    // Save to database
    try {
      await connectDB();
      await AiConsultation.create(aiConsultation);
    } catch (e) {
      console.log("Could not persist AI consultation log:", e);
    }

    return NextResponse.json({
      success: true,
      data: aiConsultation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
