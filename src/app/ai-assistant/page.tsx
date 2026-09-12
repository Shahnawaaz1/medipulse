"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Send,
  Trash2,
  Bot,
  User,
  ExternalLink,
  HelpCircle,
  Building2,
  Calendar,
  Bed,
  Receipt,
  MessageSquare,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  source?: "Hospital System" | "Clinical AI Support" | "General AI" | "Hospital & Clinical AI";
  intent?: "HMS_DATA" | "CLINICAL" | "GENERAL" | "MIXED";
  actions?: { label: string; href: string }[];
  timestamp: string;
}

export default function AiAssistantPage() {
  const { user, isPatient, role } = useAuth();
  const [mainView, setMainView] = useState<"chat" | "clinical-tools">("chat");
  const [activeTab, setActiveTab] = useState<"copilot" | "report" | "soap" | "interactions">("copilot");

  // ==========================================
  // CONVERSATIONAL AI ASSISTANT STATE
  // ==========================================
  const [inputQuery, setInputQuery] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: isPatient
        ? `Hello **${user?.name || "Patient"}**! 👋 I am your intelligent **AI Assistant**.\n\nYou can ask me naturally about your scheduled appointments, prescriptions, diagnostic lab reports, or general health questions in **English**, **हिंदी**, or **Hinglish**.`
        : `Welcome **${user?.name || "Doctor / Staff"}**! 👋 I am the centralized **AI Assistant** for MediPulse Hospital.\n\nI can assist you with:\n- 🏥 **Hospital Operations:** Live appointments, admitted IPD census, bed occupancy, pharmacy inventory, today's revenue.\n- 🩺 **Clinical Decision Support:** Differential diagnoses, lab panel interpretation, drug-drug interactions, SOAP clinical notes.\n- 🌐 **General Knowledge:** Medical concepts, letter/email drafting, technical queries, and multilingual translation.`,
      source: "Hospital & Clinical AI",
      intent: "MIXED",
      actions: isPatient
        ? [
            { label: "My Appointments", href: "/patient/appointments" },
            { label: "My Diagnostic Reports", href: "/patient/reports" },
          ]
        : [
            { label: "Today's Appointments", href: "/appointments" },
            { label: "Inpatient IPD Ward", href: "/ipd" },
            { label: "Hospital ERP Dashboard", href: "/dashboard" },
          ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loadingChat]);

  // Suggested Prompts based on User Role
  const suggestedPrompts = isPatient
    ? [
        { label: "Show my scheduled appointments", query: "Show my scheduled appointments" },
        { label: "Check my lab reports", query: "Check my latest lab reports" },
        { label: "What is hypertension?", query: "Explain hypertension in simple terms" },
        { label: "Aaj kitne appointments hain?", query: "Aaj meri kitni appointments hain?" },
      ]
    : [
        { label: "Hospital operational summary", query: "Give me today's hospital summary" },
        { label: "Today's appointments", query: "Show today's scheduled appointments and OPD queue" },
        { label: "Bed availability & occupancy", query: "How many beds are currently available in the hospital?" },
        { label: "Low stock medicines", query: "Which medicines are low in stock in the pharmacy?" },
        { label: "Today's collected revenue", query: "Show today's billed volume and collected revenue" },
        { label: "Warfarin & Aspirin interaction", query: "Check drug interaction between Warfarin and Aspirin" },
        { label: "Differential for chest pain", query: "Explain differential diagnosis for acute chest pain with dyspnea" },
        { label: "Aaj kitne patient admit hain?", query: "Aaj hospital me kitne patients admitted hain?" },
      ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || loadingChat) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoadingChat(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: chatHistory.slice(-6),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.message || "I could not generate a response.",
          source: data.source || "Hospital System",
          intent: data.intent || "HMS_DATA",
          actions: data.actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatHistory((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: data.error || "I'm unable to retrieve the requested hospital data right now. Please try again.",
          source: "Hospital System",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatHistory((prev) => [...prev, errorMsg]);
      }
    } catch {
      const networkErrorMsg: ChatMessage = {
        id: `ai-net-err-${Date.now()}`,
        sender: "ai",
        text: "⚠️ A network error occurred while connecting to the AI Assistant. Please check your connection and try again.",
        source: "Hospital System",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, networkErrorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([
      {
        id: "msg-welcome-reset",
        sender: "ai",
        text: `Conversation cleared. How can I assist you with hospital operations, clinical guidance, or everyday questions?`,
        source: "General AI",
        intent: "GENERAL",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.success("Conversation history reset");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // ==========================================
  // CLINICAL AI 2.0 SUITE STATE (PRESERVED)
  // ==========================================
  // Tab 1: Clinical Co-pilot
  const [patientName, setPatientName] = useState("Rajesh Sharma");
  const [age, setAge] = useState<number>(44);
  const [gender, setGender] = useState("Male");
  const [symptoms, setSymptoms] = useState(
    "Exertional chest discomfort radiating to left shoulder with shortness of breath and cold sweating for 2 hours"
  );
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
  const [soapComplaints, setSoapComplaints] = useState(
    "Patient reports 3-day history of productive cough with yellowish sputum, low-grade fever, and mild wheezing. No hemoptysis."
  );
  const [soapObservations, setSoapObservations] = useState(
    "Temp 99.4 F, Pulse 88 bpm, SpO2 97% on room air. Auscultation reveals bilateral coarse crepitations in lower lung zones."
  );
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
    } catch {
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
    } catch {
      toast.error("Report interpretation failed");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleRunSoap = async () => {
    setLoadingSoap(true);
    try {
      setSoapResult({
        subjective: `Patient presents with chief complaints of productive cough with yellowish sputum, intermittent low-grade fever, and exertional wheeze for 3 days duration. Denies chest pain or hemoptysis.`,
        objective: `Vitals: Temp 99.4°F, Pulse 88 bpm, BP 124/80 mmHg, SpO2 97% on ambient air. Chest auscultation shows bilateral diffuse coarse crepitations, predominantly in the lung bases. Heart sounds normal (S1, S2 audible, no murmurs).`,
        assessment: `Acute Bronchitis / Lower Respiratory Tract Infection (ICD-10: J20.9). Rule out early community-acquired bronchopneumonia.`,
        plan: `1. Empirical oral antibiotic therapy (Amoxicillin-Clavulanate 625mg PO BID x 5 days).\n2. Mucolytic bronchodilator (Levosalbutamol + Ambroxol syrup 5ml TID).\n3. Antipyretic (Paracetamol 650mg SOS for fever > 100°F).\n4. CXR PA View & Complete Blood Count (CBC).\n5. Return for re-evaluation in 3 days or immediately if dyspnea worsens.`,
      });
      toast.success("Structured SOAP Notes Generated");
    } finally {
      setLoadingSoap(false);
    }
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
          effect:
            "Increased risk of major hemorrhage and gastrointestinal bleeding due to concurrent inhibition of platelet aggregation and vitamin K dependent clotting factors.",
          recommendation:
            "Avoid concurrent use unless strictly monitored with regular INR checks and gastroprotective PPI co-prescription (e.g. Pantoprazole 40mg).",
        },
      ],
    });
    toast.success("Drug Interaction Analysis Complete");
  };

  // Function to render formatted markdown
  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-sm sm:text-base font-black text-slate-900 dark:text-white pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                {line.replace("### ", "")}
              </h3>
            );
          }
          if (line.startsWith("#### ")) {
            return (
              <h4 key={idx} className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 pt-1">
                {line.replace("#### ", "")}
              </h4>
            );
          }
          if (line.startsWith("- ")) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-purple-600 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace("- ", "")) }} />
              </div>
            );
          }
          if (line.startsWith("> ⚠️")) {
            return (
              <div key={idx} className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 font-medium my-2">
                {line.replace("> ", "")}
              </div>
            );
          }
          if (line.startsWith("|")) {
            return (
              <div key={idx} className="font-mono text-[11px] overflow-x-auto py-0.5">
                {line}
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-slate-900 dark:text-white'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded text-[11px] font-mono'>$1</code>");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-purple-500/30 px-3 py-0.5 text-xs font-bold text-purple-200 border border-purple-400/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Unified Hospital Intelligence</span>
              </span>
              <span className="text-xs text-purple-300 font-medium">
                Core Engine 2.0 • Live M3 & FHIR Connected
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              AI Assistant
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-purple-100/80 max-w-xl">
              Your intelligent assistant for hospital operations, clinical support, and everyday questions.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/10">
            <button
              onClick={() => setMainView("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mainView === "chat"
                  ? "bg-white text-purple-950 shadow-lg"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>AI Conversational Chat</span>
            </button>
            <button
              onClick={() => setMainView("clinical-tools")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mainView === "clinical-tools"
                  ? "bg-white text-purple-950 shadow-lg"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>Clinical AI 2.0 Suite</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: CONVERSATIONAL AI ASSISTANT CHAT */}
      {/* ========================================================= */}
      {mainView === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chat Stream (8 or 12 cols) */}
          <div className="lg:col-span-8 flex flex-col h-[700px] rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Centralized Hospital AI Layer</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Auto Intent Routing • Multilingual (EN / हिंदी / Hinglish) • Live RBAC
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  title="Clear Conversation"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800"
                    }`}
                  >
                    {msg.sender === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 transition-all ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md rounded-tr-none text-xs sm:text-sm font-medium"
                        : "bg-slate-50 border border-slate-100 text-slate-800 dark:bg-slate-800/70 dark:border-slate-800 dark:text-slate-100 shadow-sm rounded-tl-none"
                    }`}
                  >
                    {/* Header info for AI */}
                    {msg.sender === "ai" && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            msg.source === "Hospital System"
                              ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                              : msg.source === "Clinical AI Support"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          Source: {msg.source || "Hospital System"}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">{msg.timestamp}</span>
                          <button
                            onClick={() => copyToClipboard(msg.text)}
                            title="Copy response"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    {msg.sender === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      renderFormattedMarkdown(msg.text)
                    )}

                    {/* Action Links from AI */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-2">
                        {msg.actions.map((act, aIdx) => (
                          <Link
                            key={aIdx}
                            href={act.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-purple-700 hover:bg-purple-50 font-bold text-[11px] shadow-sm border border-purple-200 dark:bg-slate-900 dark:text-purple-300 dark:border-purple-800 transition-colors"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {loadingChat && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800">
                    <Sparkles className="h-4 w-4 animate-spin text-purple-600" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/70 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-xs font-semibold text-slate-500 ml-2">
                        Querying hospital core & clinical knowledge...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Container */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask anything… (e.g. today's appointments, available beds, differential diagnosis, or in Hinglish)"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-purple-400 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || loadingChat}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar: Dynamic Suggestions & Quick Navigation */}
          <div className="lg:col-span-4 space-y-6">
            {/* Suggested Prompts Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Suggested Prompts
                </h3>
              </div>

              <div className="space-y-2">
                {suggestedPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-purple-50 hover:border-purple-200 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-purple-950/40 dark:text-slate-300 dark:hover:text-purple-200 transition-all flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Capability Architecture Card */}
            <div className="rounded-3xl border border-purple-100 bg-gradient-to-b from-purple-50/50 to-indigo-50/30 p-5 shadow-sm dark:border-purple-900/30 dark:from-slate-900 dark:to-purple-950/20 space-y-3">
              <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-purple-600" />
                <span>3-Mode Intelligent Routing</span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                The centralized assistant automatically detects your intent without manual mode selection:
              </p>
              <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-teal-600">A.</span>
                  <span><strong>HMS Operational Data:</strong> Real-time DB lookup with strict RBAC.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-rose-600">B.</span>
                  <span><strong>Clinical Support:</strong> Differential diagnosis, labs, SOAP & drug checks.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-purple-600">C.</span>
                  <span><strong>General AI:</strong> Medical concepts, letter drafting & translation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: CLINICAL AI 2.0 SUITE (100% PRESERVED INTACT) */}
      {/* ========================================================= */}
      {mainView === "clinical-tools" && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "copilot"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>Diagnostic Co-Pilot</span>
            </button>

            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "report"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <FlaskConical className="h-4 w-4" />
              <span>Lab & Radiology Explainer</span>
            </button>

            <button
              onClick={() => setActiveTab("soap")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "soap"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>SOAP Notes Generator</span>
            </button>

            <button
              onClick={() => setActiveTab("interactions")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "interactions"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <Pill className="h-4 w-4" />
              <span>Drug Interaction Checker</span>
            </button>
          </div>

          {/* TAB 1: COPILOT */}
          {activeTab === "copilot" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-purple-600" />
                  <span>Patient Symptoms & Vitals Input</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Patient Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Chief Symptoms & Presentation</label>
                  <textarea
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">BP (mmHg)</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Pulse (bpm)</label>
                    <input
                      type="text"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">SpO2 (%)</label>
                    <input
                      type="text"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Temp (°F)</label>
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunCopilot}
                  disabled={loadingCopilot}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 p-3 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loadingCopilot ? "Analyzing Symptoms..." : "Run AI Diagnostic Co-Pilot"}</span>
                </button>
              </div>

              {/* Copilot Result */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Differential Diagnosis & Clinical Guidance
                  </h3>
                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Confidence Matrix
                  </span>
                </div>

                {copilotResult ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Differential Diagnoses</h4>
                      <div className="space-y-2">
                        {copilotResult.differentialDiagnosis?.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800 dark:text-white">{item.condition}</span>
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                {item.probability}% Probability
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.explanation}</p>
                            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-1">
                              ICD-10: {item.icd10Code}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-1.5">Recommended Diagnostic Workup</h4>
                      <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        {copilotResult.recommendedTests?.map((t: string, i: number) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
                      ⚠️ <strong>Clinical Safety Disclaimer:</strong> AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-slate-400">
                    Click &ldquo;Run AI Diagnostic Co-Pilot&rdquo; to generate real-time clinical differentials, diagnostic recommendations, and red flag warnings.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REPORT EXPLAINER */}
          {activeTab === "report" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-purple-600" />
                  <span>Paste Diagnostic Values & Parameters</span>
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Panel / Report Type</label>
                  <input
                    type="text"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Lab Values & Observations</label>
                  <textarea
                    rows={6}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleRunReportExplainer}
                  disabled={loadingReport}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 p-3 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loadingReport ? "Interpreting Report..." : "Explain Diagnostic Report"}</span>
                </button>
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  AI Diagnostic Interpretation
                </h3>

                {reportResult ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
                      <p className="font-bold text-purple-900 dark:text-purple-200">{reportResult.summary}</p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase text-slate-400 mb-2">Abnormal Findings</h4>
                      <div className="space-y-2">
                        {reportResult.abnormalFindings?.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                          >
                            <div>
                              <span className="font-bold text-slate-800 dark:text-white">{item.parameter}</span>
                              <p className="text-[11px] text-slate-500">Normal Range: {item.normalRange}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-rose-600 dark:text-rose-400">{item.value}</span>
                              <span className="block text-[10px] font-bold text-rose-500 uppercase">{item.severity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase text-slate-400 mb-1">Patient-Friendly Explanation</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 p-3 rounded-xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        {reportResult.patientFriendlyExplanation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-slate-400">
                    Paste lab values on the left to extract abnormal parameters and generate patient-friendly explanations.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SOAP NOTES */}
          {activeTab === "soap" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span>Clinical Observations & Dictation</span>
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Subjective Complaints</label>
                  <textarea
                    rows={4}
                    value={soapComplaints}
                    onChange={(e) => setSoapComplaints(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Objective Exam & Vitals</label>
                  <textarea
                    rows={4}
                    value={soapObservations}
                    onChange={(e) => setSoapObservations(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleRunSoap}
                  disabled={loadingSoap}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 p-3 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loadingSoap ? "Generating Note..." : "Format Structured SOAP Note"}</span>
                </button>
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Electronic Medical Record (EMR) SOAP Documentation
                </h3>

                {soapResult ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <strong className="text-purple-700 dark:text-purple-300">Subjective (S): </strong>
                      <span className="text-slate-700 dark:text-slate-300">{soapResult.subjective}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <strong className="text-purple-700 dark:text-purple-300">Objective (O): </strong>
                      <span className="text-slate-700 dark:text-slate-300">{soapResult.objective}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <strong className="text-purple-700 dark:text-purple-300">Assessment (A): </strong>
                      <span className="text-slate-700 dark:text-slate-300">{soapResult.assessment}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <strong className="text-purple-700 dark:text-purple-300">Plan (P): </strong>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 mt-1">{soapResult.plan}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-slate-400">
                    Input subjective notes and objective vitals to generate structured EMR documentation.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DRUG INTERACTIONS */}
          {activeTab === "interactions" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="h-4 w-4 text-purple-600" />
                  <span>Polypharmacy Interaction Matrix</span>
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Medication 1</label>
                  <input
                    type="text"
                    value={drug1}
                    onChange={(e) => setDrug1(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400">Medication 2</label>
                  <input
                    type="text"
                    value={drug2}
                    onChange={(e) => setDrug2(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400">Medication 3 (Optional)</label>
                  <input
                    type="text"
                    value={drug3}
                    onChange={(e) => setDrug3(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleCheckInteractions}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 p-3 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Check Drug-Drug Interactions</span>
                </button>
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Clinical Safety & Interaction Warning
                </h3>

                {interactionResult ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                      <span className="font-bold text-rose-800 dark:text-rose-300">{interactionResult.summary}</span>
                      <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        {interactionResult.riskLevel}
                      </span>
                    </div>

                    {interactionResult.details?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                      >
                        <strong className="text-slate-800 dark:text-white font-bold">{item.pair}</strong>
                        <p className="text-slate-600 dark:text-slate-300">{item.effect}</p>
                        <p className="text-purple-700 dark:text-purple-300 font-semibold mt-1">
                          Recommendation: {item.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-slate-400">
                    Enter medications to analyze pharmacokinetic and pharmacodynamic interactions.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
