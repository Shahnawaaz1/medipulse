"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  HeartPulse,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Stethoscope,
  KeyRound,
  Ambulance,
  Pill,
  FlaskConical,
  ScanLine,
  Receipt,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Activity,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Department Quick-Fill Presets (Strictly Role/Department Labels - No Individual Staff Names or Emails in the UI)
const departmentPresets = [
  {
    role: "SUPER_ADMIN",
    label: "Administration",
    subLabel: "Hospital Admin & ERP Control",
    idOrEmail: "admin@hospital.com",
    pass: "password123",
    icon: Building2,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#1769AA]",
  },
  {
    role: "DOCTOR",
    label: "Doctor",
    subLabel: "Clinical OPD & Prescriptions",
    idOrEmail: "doctor@hospital.com",
    pass: "password123",
    icon: Stethoscope,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#18A6A6]",
  },
  {
    role: "NURSE",
    label: "Nursing",
    subLabel: "Inpatient Ward & Bed Vitals",
    idOrEmail: "nurse@hospital.com",
    pass: "password123",
    icon: HeartPulse,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#1769AA]",
  },
  {
    role: "RECEPTIONIST",
    label: "Reception / Front Desk",
    subLabel: "Registrations & Appointments",
    idOrEmail: "receptionist@hospital.com",
    pass: "password123",
    icon: Phone,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#18A6A6]",
  },
  {
    role: "PHARMACIST",
    label: "Pharmacy",
    subLabel: "Medicine Inventory & POS",
    idOrEmail: "pharmacist@hospital.com",
    pass: "password123",
    icon: Pill,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#1769AA]",
  },
  {
    role: "LAB_TECHNICIAN",
    label: "Laboratory",
    subLabel: "Pathology Tests & Diagnostics",
    idOrEmail: "lab@hospital.com",
    pass: "password123",
    icon: FlaskConical,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#18A6A6]",
  },
  {
    role: "RADIOLOGY_TECHNICIAN",
    label: "Radiology",
    subLabel: "MRI / CT / X-Ray Scans",
    idOrEmail: "radiology@hospital.com",
    pass: "password123",
    icon: ScanLine,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#1769AA]",
  },
  {
    role: "ACCOUNTANT",
    label: "Billing / Finance",
    subLabel: "Invoices, TPA & Revenue",
    idOrEmail: "billing@hospital.com",
    pass: "password123",
    icon: Receipt,
    badgeBg: "bg-[#EAF4FB]",
    badgeText: "text-[#18A6A6]",
  },
];

function LoginContent() {
  const { login, registerPatient } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = searchParams.get("portal")?.toLowerCase();
  const roleParam = searchParams.get("role")?.toLowerCase();

  // Mode: "STAFF" or "PATIENT"
  const [activePortal, setActivePortal] = useState<"STAFF" | "PATIENT">(() => {
    if (portalParam === "patient") return "PATIENT";
    return "STAFF";
  });

  // Staff sub-view: "LOGIN" or "SUPER_ADMIN_SETUP"
  const [staffMode, setStaffMode] = useState<"LOGIN" | "SUPER_ADMIN_SETUP">("LOGIN");

  // Patient sub-mode: "LOGIN" or "REGISTER"
  const [patientMode, setPatientMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Staff Login Form State - initialized empty for clean security
  const [staffIdentifier, setStaffIdentifier] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  // Patient Login Form State - initialized empty for clean security
  const [patientIdentifier, setPatientIdentifier] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [showPatientPassword, setShowPatientPassword] = useState(false);

  // Sync state with URL search params
  useEffect(() => {
    if (portalParam === "patient") {
      setActivePortal("PATIENT");
      setPatientMode("LOGIN");
    } else if (portalParam === "staff") {
      setActivePortal("STAFF");
      setStaffMode("LOGIN");
    }

    if (roleParam) {
      const match = departmentPresets.find(
        (d) =>
          d.role.toLowerCase() === roleParam ||
          d.label.toLowerCase().includes(roleParam)
      );
      if (match) {
        setActivePortal("STAFF");
        setStaffMode("LOGIN");
        setSelectedDepartment(match.label);
        setStaffIdentifier(match.idOrEmail);
        setStaffPassword(match.pass);
      }
    }
  }, [portalParam, roleParam]);

  // Super Admin First-Time Setup State
  const [setupData, setSetupData] = useState({
    hospitalName: "MediPulse Hospital & Medical Institute",
    name: "",
    email: "",
    employeeId: "STF-ADMIN-01",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState<boolean | null>(null);

  // Patient Registration Form State
  const [regData, setRegData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "Male",
    dob: "1995-05-15",
    bloodGroup: "O+",
    address: "",
    city: "Delhi NCR",
  });

  const [submitting, setSubmitting] = useState(false);

  // Check if first-time setup is available
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/auth/setup-super-admin");
        if (res.ok) {
          const data = await res.json();
          setSetupAvailable(data.setupAvailable);
        }
      } catch {
        setSetupAvailable(false);
      }
    }
    checkSetup();
  }, []);

  // Handle Staff Login
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffIdentifier || !staffPassword) {
      toast.error("Please enter your Official Email or Employee ID and password");
      return;
    }
    setSubmitting(true);
    const result = await login(staffIdentifier, staffPassword);
    setSubmitting(false);

    if (result.success) {
      toast.success("Hospital Staff Authenticated Successfully!");
      router.push(result.defaultDashboard || "/dashboard");
    } else {
      toast.error(result.error || "Invalid staff credentials.");
    }
  };

  // Handle Department Quick-Fill
  const handleSelectDepartment = (dept: (typeof departmentPresets)[0]) => {
    setSelectedDepartment(dept.label);
    setStaffIdentifier(dept.idOrEmail);
    setStaffPassword(dept.pass);
    toast.info(`Auto-filled ${dept.label} credentials`);
  };

  // Handle Super Admin First-Time Creation
  const handleSuperAdminSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData.name || !setupData.email || !setupData.password) {
      toast.error("Please complete all required fields");
      return;
    }
    if (setupData.password !== setupData.confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }
    if (setupData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/setup-super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupData),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Super Admin account created successfully! You can now sign in.");
        setStaffIdentifier(setupData.email);
        setStaffPassword(setupData.password);
        setStaffMode("LOGIN");
        setSetupAvailable(false);
      } else {
        toast.error(json.error || "Super Admin creation failed");
      }
    } catch {
      toast.error("Network error during Super Admin setup");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Patient Login
  const handlePatientLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientIdentifier || !patientPassword) {
      toast.error("Please enter your registered email or phone number and password");
      return;
    }
    setSubmitting(true);
    const result = await login(patientIdentifier, patientPassword);
    setSubmitting(false);

    if (result.success) {
      toast.success("Welcome to your Patient Health Portal!");
      router.push(result.defaultDashboard || "/patient/dashboard");
    } else {
      toast.error(result.error || "Invalid patient credentials.");
    }
  };

  // Handle Patient Self-Registration
  const handlePatientRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name || !regData.email || !regData.phone || !regData.password) {
      toast.error("Please complete all required fields");
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      toast.error("Passwords do not match. Please re-enter.");
      return;
    }
    if (regData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    const result = await registerPatient(regData);
    setSubmitting(false);

    if (result.success) {
      toast.success("Account created successfully! Welcome to MediPulse Patient Portal.");
      router.push(result.defaultDashboard || "/patient/dashboard");
    } else {
      toast.error(result.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#F6F9FC] text-[#172B4D] relative selection:bg-[#1769AA]/20 selection:text-[#0B1F3A]">
      {/* Subtle healthcare geometric grid backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#D9E4EF50_1px,transparent_1px),linear-gradient(to_bottom,#D9E4EF50_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1769AA]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#18A6A6]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Enterprise Card */}
      <div className="w-full max-w-6xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(11,31,58,0.07)] border border-[#D9E4EF] bg-white relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
        
        {/* ================= LEFT SIDE: DEEP NAVY HOSPITAL HERO ================= */}
        <div className="lg:col-span-5 relative flex flex-col justify-between p-6 sm:p-10 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#D9E4EF] bg-[#0B1F3A]">
          
          {/* Authentic Modern Medical Center Hero Background Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105 opacity-25"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80')`
            }}
          />
          {/* Deep Navy Overlays for High Contrast Readability */}
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/90 to-[#0B1F3A]/80" />

          {/* Top: Hospital ERP Branding */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/30 group-hover:scale-105 transition-transform duration-200">
                <HeartPulse className="h-6 w-6 animate-pulse text-[#18A6A6]" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Medi<span className="text-[#18A6A6]">Pulse</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1769AA]/40 text-[#EAF4FB] border border-[#1769AA]/60 uppercase tracking-wider">
                    ERP
                  </span>
                </span>
                <span className="block text-[11px] font-medium tracking-wide text-slate-300">
                  Hospital Management System
                </span>
              </div>
            </Link>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed font-medium">
              Connected Care. Smarter Operations.
            </p>
          </div>

          {/* Middle: Key Clinical & Operational Pillars */}
          <div className="relative z-10 my-8 space-y-3.5">
            <div className="flex items-start gap-3 rounded-xl bg-[#0B1F3A]/80 p-3 border border-[#1769AA]/30 backdrop-blur-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18A6A6]/20 text-[#18A6A6] shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Enterprise Access & RBAC</h4>
                <p className="text-[11px] text-slate-300">Enforced role isolation, audit-logging & authorization</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#0B1F3A]/80 p-3 border border-[#1769AA]/30 backdrop-blur-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18A6A6]/20 text-[#18A6A6] shrink-0 mt-0.5">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Integrated Clinical Workstations</h4>
                <p className="text-[11px] text-slate-300">OPD, IPD, ICU Vitals, Pathology, Pharmacy & Radiology</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#0B1F3A]/80 p-3 border border-[#1769AA]/30 backdrop-blur-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18A6A6]/20 text-[#18A6A6] shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">NABH & ABDM M3 Standard</h4>
                <p className="text-[11px] text-slate-300">ABHA Health IDs, e-Prescriptions & Clinical Diagnostics</p>
              </div>
            </div>
          </div>

          {/* Bottom: Hospital System Operational Status */}
          <div className="relative z-10 pt-4 border-t border-[#1769AA]/30">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#18A6A6] animate-ping" />
                <span className="text-white font-medium">Hospital Nodes Active</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <Ambulance className="h-3.5 w-3.5 text-[#18A6A6]" />
                <span>24x7 ER Hotline</span>
              </span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: CLEAN WHITE STAFF PORTAL PANEL ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          
          <div>
            {/* Dual Portal Switcher Tabs */}
            <div className="flex rounded-xl bg-[#F6F9FC] p-1 border border-[#D9E4EF] mb-6">
              <button
                type="button"
                onClick={() => {
                  setActivePortal("STAFF");
                  setStaffMode("LOGIN");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activePortal === "STAFF"
                    ? "bg-[#1769AA] text-white shadow-sm shadow-[#1769AA]/20"
                    : "text-[#64748B] hover:text-[#172B4D] hover:bg-[#EAF4FB]/60"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Hospital Staff Login</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePortal("PATIENT")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activePortal === "PATIENT"
                    ? "bg-[#1769AA] text-white shadow-sm shadow-[#1769AA]/20"
                    : "text-[#64748B] hover:text-[#172B4D] hover:bg-[#EAF4FB]/60"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Patient Portal</span>
              </button>
            </div>

            {/* ================= HOSPITAL STAFF LOGIN ================= */}
            {activePortal === "STAFF" && (
              <div>
                {staffMode === "LOGIN" ? (
                  <div>
                    {/* Header */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[#0B1F3A] tracking-tight">
                          Hospital Staff Portal
                        </h2>
                        <span className="rounded-md bg-[#EAF4FB] px-2 py-0.5 text-[10px] font-bold text-[#1769AA] border border-[#D9E4EF]">
                          Internal ERP
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">
                        Sign in with your official hospital email address or Employee ID.
                      </p>
                    </div>

                    {/* Manual Login Form */}
                    <form onSubmit={handleStaffSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                          Official Email OR Employee ID
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                          <input
                            type="text"
                            required
                            value={staffIdentifier}
                            onChange={(e) => setStaffIdentifier(e.target.value)}
                            placeholder="e.g. doctor@hospital.com or DOC-2026-001"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white pl-10 pr-4 py-2.5 text-xs text-[#172B4D] placeholder:text-[#64748B]/60 outline-none focus:border-[#1769AA] focus:ring-2 focus:ring-[#1769AA]/15 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-[#172B4D]">Password</label>
                          <button
                            type="button"
                            onClick={() =>
                              toast.info("Please contact hospital IT administration or HR to reset your credentials.")
                            }
                            className="text-[11px] text-[#1769AA] hover:text-[#0B1F3A] hover:underline transition-colors font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                          <input
                            type={showStaffPassword ? "text" : "password"}
                            required
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white pl-10 pr-10 py-2.5 text-xs text-[#172B4D] placeholder:text-[#64748B]/60 outline-none focus:border-[#1769AA] focus:ring-2 focus:ring-[#1769AA]/15 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStaffPassword(!showStaffPassword)}
                            aria-label={showStaffPassword ? "Hide password" : "Show password"}
                            className="absolute right-3.5 top-3 text-[#64748B] hover:text-[#172B4D] transition-colors"
                          >
                            {showStaffPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] hover:bg-[#135992] py-3 text-xs font-bold text-white shadow-md shadow-[#1769AA]/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
                      >
                        {submitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Authenticating Staff...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In to Hospital ERP</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Department Quick-Fill Section (Strictly Department/Role Cards - Zero Staff Names) */}
                    <div className="mt-6 pt-5 border-t border-[#D9E4EF]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5 text-[#1769AA]" />
                          <span>Select Department for Demo Quick-Fill</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {departmentPresets.map((dept) => {
                          const IconComponent = dept.icon;
                          const isSelected = selectedDepartment === dept.label;
                          return (
                            <button
                              key={dept.label}
                              type="button"
                              onClick={() => handleSelectDepartment(dept)}
                              className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-left group relative ${
                                isSelected
                                  ? "border-[#1769AA] bg-[#EAF4FB] shadow-sm ring-1 ring-[#1769AA]"
                                  : "border-[#D9E4EF] bg-white hover:border-[#1769AA]/60 hover:bg-[#EAF4FB]/50"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className={`flex h-5 w-5 items-center justify-center rounded-md ${dept.badgeBg} ${dept.badgeText} shrink-0`}>
                                    <IconComponent className="h-3 w-3" />
                                  </div>
                                  <span className="text-[11px] font-bold text-[#172B4D] group-hover:text-[#1769AA] truncate transition-colors">
                                    {dept.label}
                                  </span>
                                </div>
                                {isSelected && (
                                  <Check className="h-3 w-3 text-[#18A6A6] shrink-0 ml-1" />
                                )}
                              </div>
                              <span className="text-[9px] text-[#64748B] truncate w-full mt-1 font-medium">
                                {dept.subLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* First-Time Hospital Setup Option */}
                    <div className="mt-5 pt-4 border-t border-[#D9E4EF] flex items-center justify-between text-xs">
                      <span className="text-[#64748B] text-[11px]">
                        First-time hospital setup?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (setupAvailable === false) {
                            toast.info("A Super Admin account is already configured. Please sign in with your administrator credentials.");
                          } else {
                            setStaffMode("SUPER_ADMIN_SETUP");
                          }
                        }}
                        className="font-bold text-[#1769AA] hover:text-[#0B1F3A] text-[11px] inline-flex items-center gap-1 hover:underline transition-colors"
                      >
                        <Shield className="h-3 w-3" />
                        <span>Create Super Admin Account →</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ================= SUPER ADMIN SETUP FORM ================= */
                  <div>
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setStaffMode("LOGIN")}
                        className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#172B4D] mb-2 transition-colors font-medium"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Staff Login</span>
                      </button>
                      <h2 className="text-xl font-bold text-[#0B1F3A] flex items-center gap-2">
                        <span>Initial Hospital Setup</span>
                        <span className="rounded-md bg-[#EAF4FB] px-2 py-0.5 text-[10px] font-bold text-[#1769AA] border border-[#D9E4EF]">
                          Super Admin
                        </span>
                      </h2>
                      <p className="text-xs text-[#64748B] mt-1">
                        Provision the primary Super Admin account for your hospital institute.
                      </p>
                    </div>

                    {setupAvailable === false ? (
                      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-center space-y-3">
                        <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
                        <h3 className="text-sm font-bold text-[#0B1F3A]">
                          Super Admin Already Configured
                        </h3>
                        <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                          A Super Admin account is already active on this system. For security reasons, public first-time setup is disabled.
                        </p>
                        <button
                          type="button"
                          onClick={() => setStaffMode("LOGIN")}
                          className="rounded-xl bg-[#1769AA] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#135992] transition-all"
                        >
                          Return to Staff Login
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSuperAdminSetupSubmit} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Hospital / Medical Institute Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={setupData.hospitalName}
                            onChange={(e) =>
                              setSetupData({ ...setupData, hospitalName: e.target.value })
                            }
                            placeholder="e.g. City General Hospital & Research Institute"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA]/20"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                              Super Admin Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={setupData.name}
                              onChange={(e) =>
                                setSetupData({ ...setupData, name: e.target.value })
                              }
                              placeholder="e.g. Dr. Alexander Wright"
                              className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA]/20"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                              Official Hospital Email *
                            </label>
                            <input
                              type="email"
                              required
                              value={setupData.email}
                              onChange={(e) =>
                                setSetupData({ ...setupData, email: e.target.value })
                              }
                              placeholder="admin@hospital.com"
                              className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA]/20"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                              Employee ID *
                            </label>
                            <input
                              type="text"
                              required
                              value={setupData.employeeId}
                              onChange={(e) =>
                                setSetupData({ ...setupData, employeeId: e.target.value })
                              }
                              placeholder="STF-ADMIN-01"
                              className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA]/20"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                              Official Contact Phone
                            </label>
                            <input
                              type="tel"
                              value={setupData.phone}
                              onChange={(e) =>
                                setSetupData({ ...setupData, phone: e.target.value })
                              }
                              placeholder="+91 9876543210"
                              className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA]/20"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                              Master Password *
                            </label>
                            <div className="relative">
                              <input
                                type={showSetupPassword ? "text" : "password"}
                                required
                                value={setupData.password}
                                onChange={(e) =>
                                  setSetupData({ ...setupData, password: e.target.value })
                                }
                                placeholder="Min 6 characters"
                                className="w-full rounded-xl border border-[#D9E4EF] bg-white pl-3 pr-9 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA]/20"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSetupPassword(!showSetupPassword)}
                                className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#172B4D]"
                              >
                                {showSetupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                              Confirm Password *
                            </label>
                            <input
                              type={showSetupPassword ? "text" : "password"}
                              required
                              value={setupData.confirmPassword}
                              onChange={(e) =>
                                setSetupData({
                                  ...setupData,
                                  confirmPassword: e.target.value,
                                })
                              }
                              placeholder="Re-enter password"
                              className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA]/20"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] hover:bg-[#135992] py-3 text-xs font-bold text-white shadow-md shadow-[#1769AA]/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-3"
                        >
                          {submitting ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Provisioning Super Admin...</span>
                            </>
                          ) : (
                            <>
                              <span>Create Super Admin Account</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= PATIENT PORTAL ================= */}
            {activePortal === "PATIENT" && (
              <div>
                {patientMode === "LOGIN" ? (
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-[#0B1F3A] tracking-tight">Patient Portal Sign In</h2>
                        <p className="text-xs text-[#64748B] mt-1">
                          Access your clinical records, digital prescriptions, and doctor consultations.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handlePatientLoginSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                          Registered Email OR Mobile Number
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                          <input
                            type="text"
                            required
                            value={patientIdentifier}
                            onChange={(e) => setPatientIdentifier(e.target.value)}
                            placeholder="e.g. patient@hospital.com or 9876543217"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white pl-10 pr-4 py-2.5 text-xs text-[#172B4D] placeholder:text-[#64748B]/60 outline-none focus:border-[#1769AA] focus:ring-2 focus:ring-[#1769AA]/15 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-[#172B4D]">Password</label>
                          <button
                            type="button"
                            onClick={() =>
                              toast.info("Password recovery link sent to your registered contact.")
                            }
                            className="text-[11px] text-[#1769AA] hover:text-[#0B1F3A] hover:underline transition-colors font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                          <input
                            type={showPatientPassword ? "text" : "password"}
                            required
                            value={patientPassword}
                            onChange={(e) => setPatientPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white pl-10 pr-10 py-2.5 text-xs text-[#172B4D] placeholder:text-[#64748B]/60 outline-none focus:border-[#1769AA] focus:ring-2 focus:ring-[#1769AA]/15 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPatientPassword(!showPatientPassword)}
                            aria-label={showPatientPassword ? "Hide password" : "Show password"}
                            className="absolute right-3.5 top-3 text-[#64748B] hover:text-[#172B4D] transition-colors"
                          >
                            {showPatientPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] hover:bg-[#135992] py-3 text-xs font-bold text-white shadow-md shadow-[#1769AA]/20 active:scale-[0.99] transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <span>Access Patient Portal</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Patient Demo Quick-Fill Section */}
                    <div className="mt-4 pt-3 border-t border-[#D9E4EF]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5 text-[#18A6A6]" />
                          <span>Demo Patient Quick-Fill</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientIdentifier("patient@hospital.com");
                          setPatientPassword("password123");
                          toast.info("Auto-filled Patient demo credentials");
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#D9E4EF] bg-[#F6F9FC] hover:bg-[#EAF4FB] hover:border-[#1769AA]/60 text-left transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EAF4FB] text-[#18A6A6]">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-[#172B4D] group-hover:text-[#1769AA] block">
                              Registered Patient Demo
                            </span>
                            <span className="text-[9px] text-[#64748B]">
                              patient@hospital.com • password123
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#1769AA] group-hover:underline">
                          Auto-Fill →
                        </span>
                      </button>
                    </div>

                    <div className="mt-5 text-center pt-4 border-t border-[#D9E4EF]">
                      <p className="text-xs text-[#64748B]">
                        New Patient?{" "}
                        <button
                          type="button"
                          onClick={() => setPatientMode("REGISTER")}
                          className="font-bold text-[#1769AA] hover:text-[#0B1F3A] underline underline-offset-2 ml-1"
                        >
                          Create Your Account
                        </button>
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Patient Registration Form */
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-[#0B1F3A]">Create Patient Account</h2>
                      <p className="text-xs text-[#64748B]">
                        Register for MediPulse patient health portal and ABHA record linkage.
                      </p>
                    </div>

                    <form onSubmit={handlePatientRegisterSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={regData.name}
                            onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                            placeholder="e.g. John Doe"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={regData.phone}
                            onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                            placeholder="+91 9876543210"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={regData.email}
                            onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                            placeholder="patient@gmail.com"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={regData.dob}
                            onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Gender
                          </label>
                          <select
                            value={regData.gender}
                            onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Blood Group
                          </label>
                          <select
                            value={regData.bloodGroup}
                            onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          >
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={regData.password}
                            onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                            placeholder="Min 6 characters"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                            Confirm Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={regData.confirmPassword}
                            onChange={(e) =>
                              setRegData({ ...regData, confirmPassword: e.target.value })
                            }
                            placeholder="Re-enter password"
                            className="w-full rounded-xl border border-[#D9E4EF] bg-white px-3 py-2 text-xs text-[#172B4D] outline-none focus:border-[#1769AA]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] hover:bg-[#135992] py-2.5 text-xs font-bold text-white shadow-md shadow-[#1769AA]/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-3"
                      >
                        {submitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Complete Registration</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-3 text-center">
                      <p className="text-xs text-[#64748B]">
                        Already registered?{" "}
                        <button
                          type="button"
                          onClick={() => setPatientMode("LOGIN")}
                          className="font-bold text-[#1769AA] hover:text-[#0B1F3A] underline underline-offset-2 ml-1"
                        >
                          Sign In here
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-3 text-center border-t border-[#D9E4EF]">
            <p className="text-[10px] text-[#64748B] font-medium">
              MediPulse Hospital Management System • Authorized Clinical & Administrative Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F9FC]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1769AA] border-t-transparent" />
            <p className="text-xs font-semibold text-[#64748B]">Loading MediPulse Portal...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
