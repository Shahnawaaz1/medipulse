"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Siren,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  HeartPulse,
  Clock,
  User,
  Activity,
  Bed,
  Phone,
  FileText,
  CheckCircle2,
  Stethoscope,
  Share2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { StatCard } from "@/components/common/StatCard";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function EmergencyPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    critical: 0,
    active: 0,
    admittedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [activeCase, setActiveCase] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // New Emergency Case Form
  const [formData, setFormData] = useState({
    temporaryPatientName: "",
    temporaryAge: 35,
    temporaryGender: "Male",
    arrivalMode: "Walk-in" as "Walk-in" | "Ambulance" | "Referral" | "Police",
    broughtBy: "Family",
    emergencyContactPhone: "",
    chiefComplaint: "",
    initialCondition: "Severe Acute Pain",
    triagePriority: "High" as "Critical" | "High" | "Medium" | "Low",
    vitalSigns: {
      bp: "130/90",
      pulse: "95",
      temperature: "99.1",
      spo2: "96",
      respiratoryRate: "22",
    },
    painScore: 7,
    consciousness: "Alert" as "Alert" | "Voice" | "Pain" | "Unresponsive",
    assignedDoctor: "",
    assignedNurse: "Nurse Clara Oswald",
    traumaBay: "Bay 1 (Trauma)",
  });

  // Assessment & Disposition Form
  const [assessmentForm, setAssessmentForm] = useState({
    treatmentNotes: "",
    medication: "",
    status: "Treatment" as any,
    disposition: "" as any,
    dispositionNotes: "",
    triagePriority: "High" as any,
  });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/emergency", window.location.origin);
      if (selectedPriority !== "All") url.searchParams.set("priority", selectedPriority);
      if (selectedStatus !== "All") url.searchParams.set("status", selectedStatus);
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      toast.error("Failed to load emergency cases");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
        if (data.doctors?.length > 0) {
          setFormData((prev) => ({ ...prev, assignedDoctor: data.doctors[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchDoctors();
  }, [selectedPriority, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.temporaryPatientName || !formData.chiefComplaint) {
      toast.error("Patient name and chief complaint are required!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Emergency Case ${data.case.emergencyId} registered!`);
        setIsRegisterOpen(false);
        fetchCases();
      } else {
        toast.error(data.error || "Failed to register emergency case");
      }
    } catch {
      toast.error("Error creating emergency record");
    } finally {
      setSubmitting(false);
    }
  };

  const openAssessment = (c: any) => {
    setActiveCase(c);
    setAssessmentForm({
      treatmentNotes: c.treatmentNotes || "",
      medication: "",
      status: c.status || "Treatment",
      disposition: c.disposition || "",
      dispositionNotes: c.dispositionNotes || "",
      triagePriority: c.triagePriority || "High",
    });
    setIsAssessmentOpen(true);
  };

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;

    try {
      setSubmitting(true);
      const body: any = {
        treatmentNotes: assessmentForm.treatmentNotes,
        status: assessmentForm.status,
        triagePriority: assessmentForm.triagePriority,
      };

      if (assessmentForm.medication.trim()) {
        const meds = activeCase.medicationsAdministered || [];
        body.medicationsAdministered = [...meds, assessmentForm.medication.trim()];
      }

      if (assessmentForm.disposition) {
        body.disposition = assessmentForm.disposition;
        body.dispositionNotes = assessmentForm.dispositionNotes;
        body.dispositionTime = new Date();
      }

      const res = await fetch(`/api/emergency/${activeCase._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Emergency case updated successfully!");
        setIsAssessmentOpen(false);
        fetchCases();
      } else {
        toast.error(data.error || "Failed to update record");
      }
    } catch {
      toast.error("Error updating record");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30";
      case "High":
        return "bg-amber-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-slate-900";
      case "Low":
        return "bg-emerald-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
                <Siren className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Emergency & Casualty 24x7
                </h1>
                <p className="text-xs text-slate-500">
                  Real-time Level-1 Trauma & Triage Command Center
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Fast Emergency Intake</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Emergency Cases"
            value={stats.active}
            icon={Siren}
            trend={{ value: 12, isPositive: true }}
            description="Under assessment & trauma bay"
          />
          <StatCard
            title="Critical Red Priority"
            value={stats.critical}
            icon={ShieldAlert}
            trend={{ value: 2, isPositive: false }}
            description="Immediate resuscitation required"
          />
          <StatCard
            title="Total Intake Today"
            value={stats.total}
            icon={HeartPulse}
            trend={{ value: 8, isPositive: true }}
            description="Recorded since 00:00 hrs"
          />
          <StatCard
            title="Admitted to ICU/IPD"
            value={stats.admittedToday}
            icon={Bed}
            trend={{ value: 4, isPositive: true }}
            description="Stabilized & bed assigned"
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search emergency ID, complaint, patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-[11px] font-bold text-slate-500">Triage:</span>
              {["All", "Critical", "High", "Medium", "Low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    selectedPriority === p
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="Triaged">Triaged</option>
              <option value="Under Assessment">Under Assessment</option>
              <option value="Treatment">Treatment</option>
              <option value="Observation">Observation</option>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
              <option value="Referred">Referred</option>
              <option value="LAMA">LAMA</option>
            </select>
          </div>
        </div>

        {/* Emergency Live Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Siren className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No active emergency cases found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              All casualty bays are currently clear or matching filter conditions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cases.map((c) => (
              <div
                key={c._id}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Priority Color Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${
                    c.triagePriority === "Critical"
                      ? "bg-red-500"
                      : c.triagePriority === "High"
                      ? "bg-amber-500"
                      : c.triagePriority === "Medium"
                      ? "bg-yellow-500"
                      : "bg-emerald-500"
                  }`}
                />

                <div className="pl-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {c.emergencyId}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getPriorityColor(
                            c.triagePriority
                          )}`}
                        >
                          {c.triagePriority} Triage
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {c.patient?.name || c.temporaryPatientName || "Unknown Patient"}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {c.temporaryAge || c.patient?.age || "--"} yrs •{" "}
                        {c.temporaryGender || c.patient?.gender || "Unknown"} • Mode:{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {c.arrivalMode}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-500">
                        Bay: {c.traumaBay || "Bay 1"}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(c.arrivalTime || c.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Complaint & Condition */}
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Complaint:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {c.chiefComplaint}
                      </span>
                    </p>
                    {c.initialCondition && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Initial condition: {c.initialCondition} • Pain: {c.painScore}/10 • GCS:{" "}
                        {c.consciousness}
                      </p>
                    )}
                  </div>

                  {/* Vitals Ribbon */}
                  <div className="mt-3 grid grid-cols-5 gap-2 text-center text-[11px]">
                    <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">BP</span>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {c.vitalSigns?.bp || "--"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Pulse</span>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {c.vitalSigns?.pulse || "--"} bpm
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">SpO2</span>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {c.vitalSigns?.spo2 || "--"}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Temp</span>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {c.vitalSigns?.temperature || "--"}°F
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Doctor</span>
                      <p className="font-bold text-slate-800 dark:text-white truncate">
                        {c.assignedDoctor?.name?.split(" ")[1] || "ER Doctor"}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Disposition */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="text-xs text-slate-500">
                      {c.disposition ? (
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          Disposition: {c.disposition}
                        </span>
                      ) : (
                        <span>Under ER Care</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {c.patient?._id && (
                        <Link
                          href={`/patients/${c.patient._id}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Patient 360
                        </Link>
                      )}
                      <button
                        onClick={() => openAssessment(c)}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm"
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        <span>Assess / Treat</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Fast Emergency Intake */}
        <Modal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          title="24x7 Fast Emergency Intake & Triage"
          size="lg"
        >
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma / Unknown"
                  value={formData.temporaryPatientName}
                  onChange={(e) =>
                    setFormData({ ...formData, temporaryPatientName: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Age (Years)
                </label>
                <input
                  type="number"
                  value={formData.temporaryAge}
                  onChange={(e) =>
                    setFormData({ ...formData, temporaryAge: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Gender
                </label>
                <select
                  value={formData.temporaryGender}
                  onChange={(e) => setFormData({ ...formData, temporaryGender: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Arrival Mode
                </label>
                <select
                  value={formData.arrivalMode}
                  onChange={(e) =>
                    setFormData({ ...formData, arrivalMode: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Ambulance">Ambulance (108 / Cardiac)</option>
                  <option value="Walk-in">Walk-in / Private Vehicle</option>
                  <option value="Referral">Hospital Referral</option>
                  <option value="Police">Police Escort / Medico-Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Brought By
                </label>
                <input
                  type="text"
                  placeholder="Relative, Paramedic, Bystander"
                  value={formData.broughtBy}
                  onChange={(e) => setFormData({ ...formData, broughtBy: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.emergencyContactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactPhone: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Chief Complaint & Triage Priority */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chief Emergency Complaint *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Acute severe substernal chest pain radiating to left arm with diaphoresis"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Triage Priority Assessment *
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { id: "Critical", label: "🔴 Critical (Level 1)", desc: "Immediate Life Threat" },
                    { id: "High", label: "🟠 High (Level 2)", desc: "Emergent, < 15 mins" },
                    { id: "Medium", label: "🟡 Medium (Level 3)", desc: "Urgent, < 30 mins" },
                    { id: "Low", label: "🟢 Low (Level 4)", desc: "Non-urgent standard" },
                  ].map((pri) => (
                    <button
                      type="button"
                      key={pri.id}
                      onClick={() => setFormData({ ...formData, triagePriority: pri.id as any })}
                      className={`rounded-xl border p-2 text-left transition ${
                        formData.triagePriority === pri.id
                          ? "border-brand-600 bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-200 font-bold"
                          : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <p className="text-xs font-bold">{pri.label}</p>
                      <p className="text-[10px] text-slate-400">{pri.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vital Signs Grid */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">
                Initial Vital Signs & Triage Parameters
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">BP (mmHg)</label>
                  <input
                    type="text"
                    value={formData.vitalSigns.bp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitalSigns: { ...formData.vitalSigns, bp: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={formData.vitalSigns.pulse}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitalSigns: { ...formData.vitalSigns, pulse: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">SpO2 (%)</label>
                  <input
                    type="text"
                    value={formData.vitalSigns.spo2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitalSigns: { ...formData.vitalSigns, spo2: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Temp (°F)</label>
                  <input
                    type="text"
                    value={formData.vitalSigns.temperature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitalSigns: { ...formData.vitalSigns, temperature: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Pain Score (1-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.painScore}
                    onChange={(e) =>
                      setFormData({ ...formData, painScore: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Doctor & Bay Assignment */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assign Attending ER Doctor
                </label>
                <select
                  value={formData.assignedDoctor}
                  onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Trauma Bay / Resuscitation Room
                </label>
                <select
                  value={formData.traumaBay}
                  onChange={(e) => setFormData({ ...formData, traumaBay: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Bay 1 (Red Trauma)">Bay 1 (Red Trauma Resuscitation)</option>
                  <option value="Bay 2 (Cardiac Emergent)">Bay 2 (Cardiac Emergent)</option>
                  <option value="Bay 3 (General Urgent)">Bay 3 (General Urgent)</option>
                  <option value="Bay 4 (Pediatric Emergent)">Bay 4 (Pediatric Emergent)</option>
                  <option value="Bay 5 (Observation)">Bay 5 (Observation)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                {submitting ? "Registering..." : "Admit to Emergency"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Assessment & Disposition */}
        <Modal
          isOpen={isAssessmentOpen}
          onClose={() => setIsAssessmentOpen(false)}
          title={`Clinical Assessment: ${activeCase?.emergencyId || ""}`}
          size="lg"
        >
          <form onSubmit={handleAssessmentSubmit} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Patient: {activeCase?.temporaryPatientName || activeCase?.patient?.name} • Bay:{" "}
                {activeCase?.traumaBay}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Chief Complaint: {activeCase?.chiefComplaint}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Doctor Assessment & Treatment Notes
              </label>
              <textarea
                rows={3}
                placeholder="Document clinical exam findings, differential diagnosis, procedures performed..."
                value={assessmentForm.treatmentNotes}
                onChange={(e) =>
                  setAssessmentForm({ ...assessmentForm, treatmentNotes: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Administer Emergency Medication
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inj. Morphine 4mg IV stat, Tab. Aspirin 300mg"
                  value={assessmentForm.medication}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, medication: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Workflow Stage
                </label>
                <select
                  value={assessmentForm.status}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, status: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Under Assessment">Under Assessment</option>
                  <option value="Treatment">Active Treatment</option>
                  <option value="Observation">Observation (Monitoring)</option>
                  <option value="Admitted">Admitted to IPD / ICU</option>
                  <option value="Discharged">Discharged Stable</option>
                  <option value="Referred">Referred to Specialist Center</option>
                  <option value="Transferred">Transferred</option>
                  <option value="LAMA">Left Against Medical Advice (LAMA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Final Disposition Decision
                </label>
                <select
                  value={assessmentForm.disposition}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, disposition: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">No Final Disposition (Keep in ER)</option>
                  <option value="Discharged">Discharged (Home with prescription)</option>
                  <option value="Admitted">Admitted to Ward / ICU</option>
                  <option value="Referred">Referred to Higher Tertiary Care</option>
                  <option value="Left Against Medical Advice">Left Against Medical Advice (LAMA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Disposition Notes / Discharge Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discharged with follow-up in Cardiology OPD on Monday"
                  value={assessmentForm.dispositionNotes}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, dispositionNotes: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAssessmentOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-600/20"
              >
                {submitting ? "Saving..." : "Save Assessment & Disposition"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
  );
}
