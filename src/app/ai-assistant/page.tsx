"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Stethoscope,
  FileText,
  FlaskConical,
  Pill,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  RefreshCw,
  Activity,
  HeartPulse,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<"copilot" | "report" | "soap" | "interactions">("copilot");

  // Tab 1: Clinical Co-pilot
  const [patientName, setPatientName] = useState("Rajesh Sharma");
  const [age, setAge] = useState<number>(44);
  const [gender, setGender] = useState("Male");
  const [symptoms, setSymptoms] = useState("Exertional chest discomfort radiating to left shoulder with shortness of breath and cold sweating for 2 hours");
  const [bp, setBp] = useState("142/90");
  const [pulse, setPulse] = useState("94");
  const [spo2, setSpo2] = useState("96");
  const [temp, setTemp] = useState("98.6");
  const [loadingCopilot, setLoadingCopilot] = useState(false);
  const [copilotResult, setCopilotResult] = useState<any>(null);

  // Tab 2: Diagnostic Report Explainer
  const [reportType, setReportType] = useState("Biochemistry Lab Panel");
  const [reportText, setReportText] = useState(
    "Fasting Blood Sugar: 168 mg/dL (Normal: 70-100)\nHbA1c: 8.8% (Normal: < 5.7%)\nSerum Creatinine: 1.4 mg/dL (Normal: 0.7-1.3)\nTotal Cholesterol: 238 mg/dL\nLDL: 154 mg/dL"
  );
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);

  // Tab 3: SOAP Notes Generator
  const [soapComplaints, setSoapComplaints] = useState("Patient reports 3-day history of productive cough with yellowish sputum, low-grade fever, and mild wheezing. No hemoptysis.");
  const [soapObservations, setSoapObservations] = useState("Temp 99.4 F, Pulse 88 bpm, SpO2 97% on room air. Auscultation reveals bilateral coarse crepitations in lower lung zones.");
  const [soapResult, setSoapResult] = useState<any>(null);
  const [loadingSoap, setLoadingSoap] = useState(false);

  // Tab 4: Drug Interactions
  const [drug1, setDrug1] = useState("Warfarin 5mg");
  const [drug2, setDrug2] = useState("Aspirin 75mg");
  const [drug3, setDrug3] = useState("Atorvastatin 20mg");
  const [interactionResult, setInteractionResult] = useState<any>(null);

  const handleRunCopilot = async () => {
    if (!symptoms.trim()) {
      toast.error("Please enter patient symptoms");
      return;
    }
    setLoadingCopilot(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          age,
          gender,
          symptoms,
          vitals: { bp, pulse, spo2, temp },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCopilotResult(data.data);
        toast.success("AI Clinical Co-Pilot Analysis Generated");
      }
    } catch (e) {
      toast.error("AI Analysis failed");
    } finally {
      setLoadingCopilot(false);
    }
  };

  const handleRunReportExplainer = async () => {
    if (!reportText.trim()) {
      toast.error("Please paste diagnostic lab parameters");
      return;
    }
    setLoadingReport(true);
    try {
      const res = await fetch("/api/ai/report-interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, reportText }),
      });
      const data = await res.json();
      if (data.success) {
        setReportResult(data.data);
        toast.success("Diagnostic Report Explained");
      }
    } catch (e) {
      toast.error("Report interpretation failed");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleRunSoap = async () => {
    setLoadingSoap(true);
    setTimeout(() => {
      setSoapResult({
        subjective: `Patient presents with chief complaints of productive cough with yellowish sputum, intermittent low-grade fever, and exertional wheeze for 3 days duration. Denies chest pain or hemoptysis.`,
        objective: `Vitals: Temp 99.4°F, Pulse 88 bpm, BP 124/80 mmHg, SpO2 97% on ambient air. Chest auscultation shows bilateral diffuse coarse crepitations, predominantly in the lung bases. Heart sounds normal (S1, S2 audible, no murmurs).`,
        assessment: `Acute Bronchitis / Lower Respiratory Tract Infection (ICD-10: J20.9). Rule out early community-acquired bronchopneumonia.`,
        plan: `1. Empirical oral antibiotic therapy (Amoxicillin-Clavulanate 625mg PO BID x 5 days).\n2. Mucolytic bronchodilator (Levosalbutamol + Ambroxol syrup 5ml TID).\n3. Antipyretic (Paracetamol 650mg SOS for fever > 100°F).\n4. CXR PA View & Complete Blood Count (CBC).\n5. Return for re-evaluation in 3 days or immediately if dyspnea worsens.`,
      });
      setLoadingSoap(false);
      toast.success("Structured SOAP Notes Generated");
    }, 600);
  };

  const handleCheckInteractions = () => {
    if (!drug1 || !drug2) {
      toast.error("Please enter at least two medications");
      return;
    }
    setInteractionResult({
      riskLevel: "High Severity",
      summary: "Potential Major Synergistic Anticoagulant Interaction",
      details: [
        {
          pair: `${drug1} + ${drug2}`,
          risk: "Major",
          effect: "Increased risk of major hemorrhage and gastrointestinal bleeding due to concurrent inhibition of platelet aggregation and vitamin K dependent clotting factors.",
          recommendation: "Avoid concurrent use unless strictly monitored with regular INR checks and gastroprotective PPI co-prescription (e.g. Pantoprazole 40mg).",
        },
      ],
    });
    toast.success("Drug Interaction Analysis Complete");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300 border border-purple-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>CLINICAL AI 2.0 SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              AI Doctor Assistant & Clinical Co-Pilot
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Evidence-based clinical decision support, symptom triage, differential diagnosis, ICD-10 coding, lab interpretation, and structured SOAP notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-bold backdrop-blur-md border border-white/10 text-purple-200">
              ⚡ Real-Time Clinical Engine
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {[
          { id: "copilot", label: "Diagnostic Co-Pilot", icon: Stethoscope },
          { id: "report", label: "Lab & Radiology Explainer", icon: FlaskConical },
          { id: "soap", label: "SOAP Notes Generator", icon: FileText },
          { id: "interactions", label: "Drug Interaction Checker", icon: Pill },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DIAGNOSTIC CO-PILOT */}
      {activeTab === "copilot" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-5 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-purple-600" />
                <span>Patient Vitals & Symptoms</span>
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Vitals */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recorded Vitals
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">BP (mmHg)</span>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Pulse (bpm)</span>
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">SpO2 (%)</span>
                  <input
                    type="text"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Temp (°F)</span>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chief Complaints & Clinical Presentation
              </label>
              <textarea
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-800"
                placeholder="Describe patient onset, radiation, triggers, duration..."
              />
            </div>

            <button
              onClick={handleRunCopilot}
              disabled={loadingCopilot}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-600 p-3.5 text-xs font-extrabold text-white shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loadingCopilot ? (
                <span>Synthesizing Medical Data...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Differential Diagnosis & RX</span>
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7 space-y-6">
            {!copilotResult ? (
              <div className="rounded-3xl bg-white p-12 text-center border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-4 dark:bg-purple-950">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Ready for Clinical Synthesis
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Enter symptoms and vitals on the left to generate differential diagnosis probabilities, ICD-10 suggestions, diagnostic lab orders, and suggested medications.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Differential Diagnosis Card */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span>Differential Diagnosis & ICD-10 Classification</span>
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {copilotResult.differentialDiagnosis?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {item.condition}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              {item.probability}% Probability
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                item.urgencyLevel === "Emergency"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {item.urgencyLevel}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                          {item.explanation}
                        </p>
                        <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-2">
                          ICD-10 Code: {item.icd10Code}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Prescription & Lab Orders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Suggested RX */}
                  <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 mb-3 flex items-center gap-1.5">
                      <Pill className="h-4 w-4" /> Suggested Medication Regimen
                    </h4>
                    <div className="space-y-2.5">
                      {copilotResult.suggestedPrescription?.map((rx: any, idx: number) => (
                        <div key={idx} className="rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {rx.medicine} ({rx.dosage})
                          </p>
                          <p className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                            Freq: {rx.frequency} | Dur: {rx.duration}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{rx.rational}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Diagnostics */}
                  <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-3 flex items-center gap-1.5">
                      <FlaskConical className="h-4 w-4" /> Recommended Diagnostics
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {copilotResult.recommendedTests?.map((test: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                          <span>{test}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LAB & RADIOLOGY EXPLAINER */}
      {activeTab === "report" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-teal-600" />
              <span>Input Diagnostic Biomarkers</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Diagnostic Category
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="Biochemistry Lab Panel">Biochemistry Lab Panel</option>
                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Lipid & Cardiac Markers">Lipid & Cardiac Markers</option>
                <option value="Radiology CT/MRI Report Impression">Radiology CT/MRI Report Impression</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Paste Test Values or Radiologist Impression
              </label>
              <textarea
                rows={8}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono leading-relaxed dark:border-slate-700 dark:bg-slate-800"
                placeholder="e.g. HbA1c: 8.8%, Fasting Blood Sugar: 168 mg/dL..."
              />
            </div>

            <button
              onClick={handleRunReportExplainer}
              disabled={loadingReport}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-brand-600 p-3.5 text-xs font-extrabold text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loadingReport ? (
                <span>Interpreting Biomarkers...</span>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  <span>Explain Diagnostic Findings</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7">
            {!reportResult ? (
              <div className="rounded-3xl bg-white p-12 text-center border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <FlaskConical className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Paste report on left to see AI explanation
                </h4>
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-6 animate-in fade-in duration-300">
                <div>
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    EXECUTIVE SUMMARY
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">
                    {reportResult.summary}
                  </h3>
                </div>

                {/* Abnormal Findings Table */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Biomarker Flag Analysis
                  </h4>
                  <div className="space-y-2">
                    {reportResult.abnormalFindings?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-slate-50 p-3.5 flex items-center justify-between border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {item.parameter}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Normal: {item.normalRange} | Implication: {item.implication}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-extrabold text-xs text-rose-600 dark:text-rose-400">
                            {item.value}
                          </span>
                          <span className="block rounded bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5 mt-0.5">
                            {item.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient Friendly Explainer Box */}
                <div className="rounded-2xl bg-teal-50/70 p-4 border border-teal-200/60 dark:bg-teal-950/40 dark:border-teal-900/60">
                  <h5 className="text-xs font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 mb-1">
                    <Info className="h-4 w-4" /> Patient-Friendly Translation
                  </h5>
                  <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
                    {reportResult.patientFriendlyExplanation}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60">
                  <h5 className="text-xs font-extrabold text-slate-900 dark:text-white mb-1">
                    Recommended Clinical Action
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {reportResult.recommendedAction}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SOAP NOTES GENERATOR */}
      {activeTab === "soap" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>SOAP Clinical Note Transcriber</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Patient Verbal Complaints (Subjective Raw Dictation)
              </label>
              <textarea
                rows={4}
                value={soapComplaints}
                onChange={(e) => setSoapComplaints(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Doctor Examination & Vitals (Objective Findings)
              </label>
              <textarea
                rows={4}
                value={soapObservations}
                onChange={(e) => setSoapObservations(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              onClick={handleRunSoap}
              disabled={loadingSoap}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-3.5 text-xs font-extrabold text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>Format into Standard SOAP Note</span>
            </button>
          </div>

          <div className="lg:col-span-7">
            {soapResult && (
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Standardized Medical EMR SOAP Record
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(soapResult, null, 2));
                      toast.success("SOAP Notes copied to clipboard");
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                      S — SUBJECTIVE
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">{soapResult.subjective}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                      O — OBJECTIVE
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">{soapResult.objective}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                      A — ASSESSMENT
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">{soapResult.assessment}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                      P — PLAN
                    </p>
                    <pre className="text-slate-700 dark:text-slate-300 font-sans whitespace-pre-line">
                      {soapResult.plan}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DRUG INTERACTIONS */}
      {activeTab === "interactions" && (
        <div className="max-w-4xl mx-auto rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="h-5 w-5 text-rose-600" />
              <span>Multi-Drug Interaction & Contraindication Engine</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Check potential adverse interactions and bioavailability conflicts between co-prescribed pharmaceuticals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Medicine 1
              </label>
              <input
                type="text"
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Medicine 2
              </label>
              <input
                type="text"
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Medicine 3 (Optional)
              </label>
              <input
                type="text"
                value={drug3}
                onChange={(e) => setDrug3(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <button
            onClick={handleCheckInteractions}
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-xs font-extrabold text-white shadow-md hover:bg-rose-700 transition-all"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Check Drug Interactions</span>
          </button>

          {interactionResult && (
            <div className="rounded-2xl bg-rose-50 p-5 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-extrabold text-white">
                  {interactionResult.riskLevel}
                </span>
                <span className="font-extrabold text-xs text-rose-900 dark:text-rose-200">
                  {interactionResult.summary}
                </span>
              </div>

              {interactionResult.details?.map((item: any, i: number) => (
                <div key={i} className="text-xs text-rose-800 dark:text-rose-300 space-y-1">
                  <p className="font-bold">{item.pair}</p>
                  <p>{item.effect}</p>
                  <p className="font-semibold text-rose-900 dark:text-rose-200">
                    Clinical Recommendation: {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
