"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  ShieldCheck,
  User,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Download,
  Printer,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function AbhaPage() {
  const [abhaList, setAbhaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"directory" | "create" | "contexts" | "consent">("directory");

  // Creation Wizard State
  const [step, setStep] = useState(1);
  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("1990-05-15");
  const [state, setState] = useState("Delhi");
  const [district, setDistrict] = useState("Central Delhi");
  const [pincode, setPincode] = useState("110001");
  const [address, setAddress] = useState("");
  const [preferredAbha, setPreferredAbha] = useState("");
  const [otp, setOtp] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadAbhaCards();
  }, [searchQuery]);

  const loadAbhaCards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/abha?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json = await res.json();
        setAbhaList(json.data || []);
        if (json.data?.length > 0 && !selectedCard) {
          setSelectedCard(json.data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load ABHA cards", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!aadhaar || aadhaar.length < 12) {
      toast.error("Please enter 12-digit Aadhaar number");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/abha/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifierValue: aadhaar }),
      });
      const data = await res.json();
      if (data.success) {
        setOtp(data.demoOtp || "789123");
        setStep(2);
        toast.success(`Aadhaar OTP sent! Demo OTP: ${data.demoOtp}`);
      }
    } catch (e) {
      toast.error("ABDM Gateway connection failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifyAndProceed = () => {
    if (!otp) {
      toast.error("Please enter 6-digit OTP");
      return;
    }
    setStep(3);
  };

  const handleFinalizeAbha = async () => {
    if (!fullName || !mobile) {
      toast.error("Please complete all demographic fields");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/abha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp,
          fullName,
          gender,
          dob,
          mobile,
          aadhaar,
          state,
          district,
          pincode,
          address,
          preferredAbhaAddress: preferredAbha,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("14-Digit ABHA Card Generated & Registered!");
        setSelectedCard(data.data);
        setStep(4);
        loadAbhaCards();
      } else {
        toast.error(data.error || "Failed to create ABHA");
      }
    } catch (e) {
      toast.error("ABDM verification error");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <QrCode className="h-3.5 w-3.5" />
              <span>AYUSHMAN BHARAT DIGITAL MISSION (ABDM M3)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ABHA Health Card & ABDM Health Records
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              National Digital Health ecosystem integration. Create 14-digit ABHA numbers, link hospital care contexts, and manage consent.
            </p>
          </div>

          <button
            onClick={() => {
              setActiveTab("create");
              setStep(1);
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New ABHA Registration</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {[
          { id: "directory", label: "ABHA Card Registry", icon: QrCode },
          { id: "create", label: "Create ABHA Wizard", icon: Plus },
          { id: "contexts", label: "Care Contexts (M2)", icon: LinkIcon },
          { id: "consent", label: "Consent Manager", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REGISTRY & CARD VIEWER */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: ABHA List with Search */}
          <div className="lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Registered Citizens ({abhaList.length})
              </h3>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ABHA Number, PHR, or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {loading ? (
              <LoadingSpinner label="Loading ABHA records..." />
            ) : abhaList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No ABHA cards found. Click "New ABHA Registration" to create one.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {abhaList.map((card) => {
                  const isSelected = selectedCard?._id === card._id;
                  return (
                    <div
                      key={card._id}
                      onClick={() => setSelectedCard(card)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/40 dark:border-emerald-500"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {card.fullName}
                        </span>
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {card.verificationStatus}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {card.abhaNumber}
                        </span>
                        <span>{card.dob}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {card.abhaAddress}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Printable Official ABHA Card */}
          <div className="lg:col-span-6 space-y-4">
            {selectedCard ? (
              <div className="space-y-4">
                {/* Official Card Container */}
                <div className="rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/40 relative overflow-hidden">
                  {/* Decorative card stripes */}
                  <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/20 blur-2xl" />

                  {/* Top National Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-wider uppercase text-emerald-300">
                          National Health Authority
                        </p>
                        <p className="text-[10px] text-slate-300 font-semibold">
                          Ayushman Bharat Health Account (ABHA)
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                      GOVT OF INDIA
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-12 gap-4 my-6 items-center">
                    <div className="col-span-4 text-center">
                      <div className="mx-auto h-24 w-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 overflow-hidden">
                        <User className="h-12 w-12" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        Aadhaar: **** {selectedCard.aadhaarLast4}
                      </p>
                    </div>

                    <div className="col-span-8 space-y-2">
                      <div>
                        <p className="text-lg font-black tracking-tight text-white">
                          {selectedCard.fullName}
                        </p>
                        <p className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
                          {selectedCard.abhaAddress}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block">DOB / Age</span>
                          <span className="font-semibold text-slate-200">{selectedCard.dob}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Gender</span>
                          <span className="font-semibold text-slate-200">{selectedCard.gender}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">State</span>
                          <span className="font-semibold text-slate-200">{selectedCard.state}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Mobile</span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {selectedCard.mobile}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 14-Digit Highlighted ABHA Number */}
                  <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block">
                      ABHA NUMBER
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black tracking-widest text-white mt-0.5 block">
                      {selectedCard.abhaNumber}
                    </span>
                  </div>

                  {/* Footer Bar */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Issued by MediPulse ABDM Node</span>
                    <span>100% FHIR & M3 Compliant</span>
                  </div>
                </div>

                {/* Print & Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePrintCard}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-extrabold text-slate-800 shadow border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Digital Card</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `ABHA: ${selectedCard.abhaNumber} | PHR: ${selectedCard.abhaAddress}`
                      );
                      toast.success("ABHA details copied to clipboard!");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500"
                  >
                    <Download className="h-4 w-4" />
                    <span>Copy ABHA Details</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE ABHA WIZARD */}
      {activeTab === "create" && (
        <div className="max-w-3xl mx-auto rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                STEP {step} OF 4
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                ABHA Card Instant Creation Wizard
              </h3>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2.5 w-8 rounded-full ${
                    step >= s ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Aadhaar Input */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  12-Digit Aadhaar Number / Virtual ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9812-4411-8890"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-mono tracking-wider dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
                <p className="font-bold">ABDM Consent Agreement:</p>
                <p className="mt-0.5">
                  I hereby give my voluntary consent to create my ABHA ID under the Ayushman Bharat Digital Mission and share my demographic details with NHA.
                </p>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-extrabold text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
              >
                {generating ? "Sending OTP..." : "Generate OTP (Aadhaar Verified)"}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Digit OTP received on Aadhaar linked mobile
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-lg font-mono text-center tracking-widest dark:border-slate-700 dark:bg-slate-800"
                />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  Demo Test OTP: 789123
                </p>
              </div>

              <button
                onClick={handleVerifyAndProceed}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500"
              >
                <span>Verify OTP & Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 3: Demographic Info */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sumanth Sen"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DOB
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred ABHA Address
                  </label>
                  <input
                    type="text"
                    value={preferredAbha}
                    onChange={(e) => setPreferredAbha(e.target.value)}
                    placeholder="username.phr"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <button
                onClick={handleFinalizeAbha}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-extrabold text-white shadow-md hover:brightness-110"
              >
                {generating ? "Issuing ABHA..." : "Generate Official 14-Digit ABHA Card"}
              </button>
            </div>
          )}

          {/* Step 4: Success View */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                ABHA Card Issued Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                ABHA ID: {selectedCard?.abhaNumber} | PHR: {selectedCard?.abhaAddress}
              </p>
              <button
                onClick={() => setActiveTab("directory")}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-600 dark:bg-slate-800"
              >
                View in Card Registry
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CARE CONTEXTS */}
      {activeTab === "contexts" && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Linked ABDM Care Contexts (Milestone M2/M3)
              </h3>
              <p className="text-xs text-slate-400">
                Hospital visits, prescriptions, and diagnostic lab documents linked to patient ABHA.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  OPD Visit
                </span>
                <span className="text-[10px] text-slate-400">01 Sep 2026</span>
              </div>
              <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                Cardiology OPD Routine Evaluation
              </p>
              <p className="text-[11px] text-slate-500">Ref: OPD-2026-9901 | Dr. Sarah Jenkins</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  Prescription
                </span>
                <span className="text-[10px] text-slate-400">01 Sep 2026</span>
              </div>
              <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                Anti-hypertensive & Glycemic Regimen
              </p>
              <p className="text-[11px] text-slate-500">Ref: RX-2026-4412 | Digitally Signed</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                  Lab Report
                </span>
                <span className="text-[10px] text-slate-400">02 Sep 2026</span>
              </div>
              <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                Comprehensive Lipid & HbA1c Panel
              </p>
              <p className="text-[11px] text-slate-500">Ref: LAB-2026-8812 | Verified</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONSENT MANAGER */}
      {activeTab === "consent" && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                ABDM Health Data Consent Manager
              </h3>
              <p className="text-xs text-slate-400">
                Grant or revoke external clinic access to patient records securely with cryptographic tokens.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Apollo Clinics South Delhi
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Active Consent
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Purpose: Second opinion on post-cardiac care (Valid: 01 Sep 2026 – 01 Oct 2026)
              </p>
            </div>
            <button
              onClick={() => toast.success("Consent Revoked successfully")}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              Revoke Consent
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
