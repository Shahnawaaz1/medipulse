import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { reportType, reportText, values } = await request.json();

    const lower = (reportText || "").toLowerCase();

    let interpretation = {
      summary: "",
      abnormalFindings: [] as any[],
      clinicalSignificance: "",
      patientFriendlyExplanation: "",
      recommendedAction: "",
    };

    if (lower.includes("hba1c") || lower.includes("glucose") || lower.includes("sugar")) {
      interpretation.summary =
        "Glycemic Control Assessment: Elevated glycated hemoglobin and fasting glucose indicators.";
      interpretation.abnormalFindings = [
        {
          parameter: "HbA1c",
          value: "8.8 %",
          normalRange: "< 5.7 %",
          severity: "High",
          implication: "Sub-optimal diabetic control over past 90 days",
        },
        {
          parameter: "Fasting Plasma Glucose",
          value: "168 mg/dL",
          normalRange: "70 - 100 mg/dL",
          severity: "High",
          implication: "Hepatic gluconeogenesis elevation",
        },
      ];
      interpretation.clinicalSignificance =
        "Indicates persistent hyperglycemia with risk of microvascular diabetic complications (retinopathy, nephropathy, peripheral neuropathy).";
      interpretation.patientFriendlyExplanation =
        "Your 3-month average blood sugar level is higher than the recommended target. This means your body is having trouble processing glucose efficiently. Adjusting your medication and diet will help bring this into a healthy safety zone.";
      interpretation.recommendedAction =
        "Consult endocrinologist for anti-diabetic medication titration (consider adding SGLT2i or GLP-1 RA). Schedule Urine Microalbumin/Creatinine ratio and Diabetic Foot Exam.";
    } else if (lower.includes("wbc") || lower.includes("crp") || lower.includes("infection")) {
      interpretation.summary =
        "Inflammatory & Hematological Response: Mild leukocytosis with elevated inflammatory markers.";
      interpretation.abnormalFindings = [
        {
          parameter: "Total Leukocyte Count (WBC)",
          value: "13,400 /cumm",
          normalRange: "4,000 - 11,000 /cumm",
          severity: "High",
          implication: "Neutrophilic leukocytosis suggesting acute immune/inflammatory response",
        },
        {
          parameter: "C-Reactive Protein (CRP)",
          value: "28 mg/L",
          normalRange: "< 5 mg/L",
          severity: "High",
          implication: "Systemic acute phase reactant response",
        },
      ];
      interpretation.clinicalSignificance =
        "Findings point towards an active bacterial, viral or acute inflammatory tissue reaction.";
      interpretation.patientFriendlyExplanation =
        "Your white blood cells and inflammation markers are elevated. This means your immune system is actively fighting off an infection or irritation in your body.";
      interpretation.recommendedAction =
        "Correlate clinically with body temperature and localized symptoms. Check focused organ cultures if fever persists and complete targeted antibiotic/anti-inflammatory course.";
    } else {
      interpretation.summary =
        "Diagnostic Screening Overview: Standard diagnostic values analyzed with baseline parameters within reasonable limits.";
      interpretation.abnormalFindings = [
        {
          parameter: "Serum Creatinine",
          value: "1.1 mg/dL",
          normalRange: "0.7 - 1.3 mg/dL",
          severity: "Normal",
          implication: "Glomerular filtration rate within expected physiological bounds",
        },
        {
          parameter: "Hemoglobin",
          value: "14.2 g/dL",
          normalRange: "13.0 - 17.0 g/dL",
          severity: "Normal",
          implication: "Adequate oxygen-carrying capacity",
        },
      ];
      interpretation.clinicalSignificance =
        "No immediate critical flags identified. Physiological organ function remains stable.";
      interpretation.patientFriendlyExplanation =
        "Your diagnostic lab parameters look healthy and in good order. Continue standard routine annual checkups and healthy lifestyle habits.";
      interpretation.recommendedAction =
        "Maintain current treatment plan and re-evaluate at your next scheduled outpatient visit.";
    }

    return NextResponse.json({
      success: true,
      data: interpretation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
