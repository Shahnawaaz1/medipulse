"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  ArrowLeft,
  Calendar,
  FileSignature,
  FlaskConical,
  ScanLine,
  Hotel,
  Receipt,
  Droplet,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  Printer,
  Plus,
  Activity,
  CheckCircle2,
  Share2,
  Building2,
  ShieldAlert,
  Siren,
  Scissors,
  QrCode,
  HeartPulse,
  Wind,
  FileText,
  BadgeCheck,
  CreditCard,
  History,
  Pill,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "360-timeline"
    | "overview"
    | "emergency"
    | "icu-ot"
    | "appointments"
    | "prescriptions"
    | "lab"
    | "radiology"
    | "admissions"
    | "billing"
    | "referrals"
  >("360-timeline");

  const [timelineFilter, setTimelineFilter] = useState("All");

  // Referral Modal States
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isReferSlipModalOpen, setIsReferSlipModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [referralForm, setReferralForm] = useState({
    destinationHospital: "",
    destinationDepartment: "Cardiology",
    destinationSpecialist: "",
    diagnosis: "",
    reasonForReferral: "",
    clinicalSummary: "",
    priority: "Normal" as "Normal" | "Urgent" | "Emergency",
    referringDoctor: "",
    notes: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Patient record not found");
      }
    } catch {
      toast.error("Failed to load patient record");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const json = await res.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !referralForm.referringDoctor) {
          setReferralForm((prev) => ({ ...prev, referringDoctor: json.doctors[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchDoctors();
    }
  }, [id]);

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralForm.destinationHospital || !referralForm.diagnosis || !referralForm.reasonForReferral) {
      toast.error("Please fill in all required referral fields");
      return;
    }

    try {
      setSubmittingReferral(true);
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...referralForm,
          patient: data?.patient?._id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Patient referral issued successfully!");
        setIsReferModalOpen(false);
        setReferralForm({
          destinationHospital: "",
          destinationDepartment: "Cardiology",
          destinationSpecialist: "",
          diagnosis: "",
          reasonForReferral: "",
          clinicalSummary: "",
          priority: "Normal",
          referringDoctor: doctors[0]?._id || "",
          notes: "",
        });
        fetchProfile();
        setActiveTab("referrals");
      } else {
        toast.error(json.error || "Failed to create referral");
      }
    } catch {
      toast.error("Error creating referral");
    } finally {
      setSubmittingReferral(false);
    }
  };

  const patient = data?.patient;
  const history = data?.history || {};
  const appointments = history.appointments || [];
  const prescriptions = history.prescriptions || [];
  const labOrders = history.labOrders || [];
  const radiologyOrders = history.radiologyOrders || [];
  const admissions = history.admissions || [];
  const invoices = history.invoices || [];
  const referrals = history.referrals || [];
  const emergencyCases = history.emergencyCases || [];
  const icuRecords = history.icuRecords || [];
  const otSurgeries = history.otSurgeries || [];
  const nursingRecords = history.nursingRecords || [];
  const dischargeSummaries = history.dischargeSummaries || [];
  const abhaCard = history.abhaCard;
  const opdRecords = history.opdRecords || [];

  // Construct Patient 360 Unified Chronological Timeline
  const unifiedTimeline = useMemo(() => {
    if (!patient) return [];

    const events: any[] = [];

    // Registration Event
    if (patient.createdAt) {
      events.push({
        id: `reg-${patient._id}`,
        type: "Registration",
        title: "Patient Registered in MediPulse HMS",
        date: new Date(patient.createdAt),
        department: "Front Desk Registration",
        doctor: "Reception Desk",
        badge: "ID Assigned",
        badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        icon: User,
        description: `Registered with Patient ID: ${patient.patientId}. Demographics: ${patient.gender}, ${patient.age} yrs. Blood Group: ${patient.bloodGroup}`,
        category: "Administrative",
      });
    }

    // Emergency Cases
    emergencyCases.forEach((emg: any) => {
      events.push({
        id: `emg-${emg._id}`,
        type: "Emergency",
        title: `Emergency Triage: ${emg.emergencyId} (${emg.triagePriority} Priority)`,
        date: new Date(emg.arrivalTime || emg.createdAt),
        department: "Casualty / Trauma Bay",
        doctor: emg.assignedDoctor?.name || "ER Consultant",
        badge: emg.status,
        badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        icon: Siren,
        description: `Chief complaint: ${emg.chiefComplaint}. Initial condition: ${emg.initialCondition}. Vitals: BP ${emg.vitalSigns?.bp}, SpO2 ${emg.vitalSigns?.spo2}%. Mode: ${emg.arrivalMode}`,
        category: "Emergency & Critical",
      });
    });

    // ICU Stays
    icuRecords.forEach((icu: any) => {
      events.push({
        id: `icu-${icu._id}`,
        type: "ICU",
        title: `ICU Admission (${icu.unit}) - Bed ${icu.bed?.bedNumber || "ICU"}`,
        date: new Date(icu.admittedAt || icu.createdAt),
        department: "Critical Care Unit",
        doctor: icu.attendingIntensivist?.name || "Intensivist",
        badge: icu.status,
        badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        icon: Activity,
        description: `Ventilator Support: ${icu.ventilatorStatus}. Daily Clinical Notes: ${icu.dailyNotes || "Active telemetry telemetry monitoring"}`,
        category: "Emergency & Critical",
      });
    });

    // OT Surgeries
    otSurgeries.forEach((ot: any) => {
      events.push({
        id: `ot-${ot._id}`,
        type: "Surgery",
        title: `OT Surgical Procedure: ${ot.procedureName}`,
        date: new Date(ot.scheduledDate),
        department: ot.theatreNumber,
        doctor: ot.leadSurgeon?.name || "Lead Surgeon",
        badge: ot.surgeryStatus,
        badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
        icon: Scissors,
        description: `Anesthesia: ${ot.anesthesiaType}. Post-Op Notes: ${ot.postOpNotes || "Surgical recovery monitoring in PACU"}`,
        category: "Surgery",
      });
    });

    // Appointments & OPD
    appointments.forEach((apt: any) => {
      events.push({
        id: `apt-${apt._id}`,
        type: "Appointment",
        title: `Consultation: ${apt.department}`,
        date: new Date(apt.appointmentDate),
        department: apt.department,
        doctor: apt.doctor?.name || "Consultant Doctor",
        badge: apt.status,
        badgeColor: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        icon: Calendar,
        description: `Reason for consultation: ${apt.reason || "Routine visit"}. Slot: ${apt.timeSlot || "Scheduled"}`,
        category: "Consultation",
      });
    });

    // Prescriptions (Rx)
    prescriptions.forEach((rx: any) => {
      const medList = (rx.medicines || []).map((m: any) => `${m.medicineName} (${m.dosage})`).join(", ");
      events.push({
        id: `rx-${rx._id}`,
        type: "Prescription",
        title: `Prescription Issued (${rx.prescriptionId})`,
        date: new Date(rx.date || rx.createdAt),
        department: "Pharmacy & Clinical Rx",
        doctor: rx.doctor?.name || "Attending Doctor",
        badge: rx.status || "Active",
        badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
        icon: FileSignature,
        description: `Diagnosis: ${rx.diagnosis}. Prescribed Drugs: ${medList || "Standard medication regimen"}`,
        category: "Medication",
      });
    });

    // Lab Orders & Diagnostic Reports
    labOrders.forEach((lab: any) => {
      const tests = (lab.tests || []).map((t: any) => t.name).join(", ");
      events.push({
        id: `lab-${lab._id}`,
        type: "Laboratory",
        title: `Pathology Order (${lab.orderId})`,
        date: new Date(lab.orderDate || lab.createdAt),
        department: "Pathology Diagnostics",
        doctor: lab.doctor?.name || "Laboratory Tech",
        badge: lab.status,
        badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        icon: FlaskConical,
        description: `Tests: ${tests || "Comprehensive Panel"}. Clinical Findings: ${lab.clinicalFindings || "Report generated"}`,
        category: "Diagnostics",
      });
    });

    // Radiology Scans
    radiologyOrders.forEach((rad: any) => {
      events.push({
        id: `rad-${rad._id}`,
        type: "Radiology",
        title: `Radiology Scan: ${rad.modality} - ${rad.bodyPart}`,
        date: new Date(rad.orderDate || rad.createdAt),
        department: "Diagnostic Radiology & Imaging",
        doctor: rad.doctor?.name || "Radiologist",
        badge: rad.status,
        badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
        icon: ScanLine,
        description: `Impression: ${rad.impression || rad.clinicalNotes || "Imaging acquisition completed"}`,
        category: "Diagnostics",
      });
    });

    // Inpatient Admissions & Discharge Summaries
    admissions.forEach((adm: any) => {
      events.push({
        id: `adm-${adm._id}`,
        type: "Admission",
        title: `IPD Inpatient Admission (${adm.admissionId})`,
        date: new Date(adm.admissionDate),
        department: `${adm.department} (Ward: ${adm.ward}, Bed: ${adm.bed?.bedNumber || "Assigned"})`,
        doctor: adm.doctor?.name || "Ward Consultant",
        badge: adm.status,
        badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
        icon: Hotel,
        description: `Reason: ${adm.admissionReason}. Treatment Plan: ${adm.treatmentPlan || "Inpatient Care"}`,
        category: "Inpatient",
      });
    });

    dischargeSummaries.forEach((dsc: any) => {
      events.push({
        id: `dsc-${dsc._id}`,
        type: "Discharge",
        title: `Official Discharge Summary (${dsc.dischargeId})`,
        date: new Date(dsc.dischargeDate),
        department: dsc.department,
        doctor: dsc.attendingDoctor?.name || "Attending Physician",
        badge: dsc.dischargeType,
        badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
        icon: BadgeCheck,
        description: `Final Diagnosis: ${dsc.finalDiagnosis}. Hospital Course: ${dsc.hospitalCourse || "Treatment successfully completed"}`,
        category: "Inpatient",
      });
    });

    // Patient Referrals
    referrals.forEach((ref: any) => {
      events.push({
        id: `ref-${ref._id}`,
        type: "Referral",
        title: `External Referral: To ${ref.destinationHospital}`,
        date: new Date(ref.referralDate),
        department: ref.destinationDepartment,
        doctor: ref.referringDoctor?.name || "Referring Doctor",
        badge: ref.status,
        badgeColor: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
        icon: Share2,
        description: `Reason: ${ref.reasonForReferral}. Clinical Summary: ${ref.clinicalSummary || "Transferred for tertiary care"}`,
        category: "Administrative",
      });
    });

    // Invoices & Billing
    invoices.forEach((inv: any) => {
      events.push({
        id: `inv-${inv._id}`,
        type: "Billing",
        title: `Billing Invoice (${inv.invoiceNumber})`,
        date: new Date(inv.invoiceDate || inv.createdAt),
        department: "Finance & Accounts",
        doctor: inv.doctor?.name || "Accounts",
        badge: inv.paymentStatus,
        badgeColor: inv.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
        icon: Receipt,
        description: `Total Billed: ${formatCurrency(inv.totalAmount)}. Paid: ${formatCurrency(inv.paidAmount)}. Balance: ${formatCurrency(inv.balanceAmount)}`,
        category: "Billing",
      });
    });

    // Sort descending by event timestamp
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [data]);

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "All") return unifiedTimeline;
    return unifiedTimeline.filter((e) => e.category === timelineFilter || e.type === timelineFilter);
  }, [unifiedTimeline, timelineFilter]);

  if (loading) {
    return <LoadingSpinner label="Loading Patient 360 electronic health record..." />;
  }

  if (!patient) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Patient not found.</p>
        <Link
          href="/patients"
          className="mt-4 inline-block text-xs font-bold text-brand-600 hover:underline"
        >
          ← Return to Patients List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back button & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/patients"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {patient.name}
              </h1>
              <StatusBadge status={patient.status} size="sm" />
              {patient.abhaNumber && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <QrCode className="h-3 w-3" />
                  ABHA Linked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Patient ID: <span className="font-semibold text-slate-700 dark:text-slate-300">{patient.patientId}</span> • Registered on {formatDate(patient.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refer Patient Button */}
          <button
            onClick={() => setIsReferModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Refer Patient</span>
          </button>

          <Link
            href={`/appointments?patient=${patient._id}`}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Book Appointment</span>
          </Link>
          <Link
            href={`/emergency`}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-all"
          >
            <Siren className="h-3.5 w-3.5" />
            <span>Emergency Intake</span>
          </Link>
          <Link
            href={`/billing`}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Primary Patient Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-extrabold text-sm dark:bg-brand-950 dark:text-brand-300 shrink-0">
            {patient.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-slate-400">Demographics</p>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              {patient.gender}, {patient.age} Years
            </p>
            <p className="text-[11px] text-slate-500">DOB: {patient.dob}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm dark:bg-rose-950 dark:text-rose-400 shrink-0">
            <Droplet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Blood Group</p>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {patient.bloodGroup}
            </p>
            <p className="text-[11px] text-slate-500">Rh Compatible</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 font-bold text-sm dark:bg-teal-950 dark:text-teal-400 shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Contact</p>
            <p className="text-xs font-bold text-slate-800 dark:text-white">{patient.phone}</p>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{patient.email || "No email"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 font-bold text-sm dark:bg-amber-950 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Next of Kin / Contact</p>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              {patient.emergencyContact?.name || "N/A"}
            </p>
            <p className="text-[11px] text-slate-500">
              {patient.emergencyContact?.relationship} ({patient.emergencyContact?.phone})
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-1 pb-1 custom-scrollbar">
        {[
          { id: "360-timeline", label: "Patient 360 Timeline", icon: History, count: unifiedTimeline.length },
          { id: "overview", label: "Clinical Alerts", icon: Activity, count: null },
          { id: "emergency", label: "Emergency Visits", icon: Siren, count: emergencyCases.length },
          { id: "icu-ot", label: "ICU & Surgeries", icon: Scissors, count: icuRecords.length + otSurgeries.length },
          { id: "appointments", label: "Appointments", icon: Calendar, count: appointments.length },
          { id: "prescriptions", label: "Prescriptions (Rx)", icon: FileSignature, count: prescriptions.length },
          { id: "lab", label: "Laboratory", icon: FlaskConical, count: labOrders.length },
          { id: "radiology", label: "Radiology", icon: ScanLine, count: radiologyOrders.length },
          { id: "admissions", label: "Admissions (IPD)", icon: Hotel, count: admissions.length },
          { id: "billing", label: "Billing & Invoices", icon: Receipt, count: invoices.length },
          { id: "referrals", label: "Referrals", icon: Share2, count: referrals.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors whitespace-nowrap ${
                isActive
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Patient 360 Unified Chronological Timeline */}
      {activeTab === "360-timeline" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Complete Clinical & Hospital Course (Patient 360)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {["All", "Consultation", "Emergency & Critical", "Surgery", "Diagnostics", "Medication", "Inpatient", "Billing"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTimelineFilter(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    timelineFilter === cat
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No events recorded for this filter category.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:left-2.5 before:top-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {filteredTimeline.map((ev: any) => {
                const Icon = ev.icon;
                return (
                  <div key={ev.id} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[27px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-sm dark:border-slate-900">
                      <Icon className="h-3 w-3" />
                    </div>

                    {/* Timeline Event Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {ev.title}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ev.badgeColor || "bg-slate-100 text-slate-700"}`}
                            >
                              {ev.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ev.department} • In-Charge:{" "}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {ev.doctor}
                            </span>
                          </p>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                          {formatDate(ev.date)}
                        </span>
                      </div>

                      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 p-2.5 rounded-xl dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Overview (Clinical Alerts & Chronic Conditions) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                Known Allergies & Clinical Alerts
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {patient.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((allergy: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {allergy}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No known drug/food allergies recorded.</p>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 pt-6 dark:border-slate-800">
                Chronic Conditions & Medical History
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                  patient.medicalHistory.map((cond: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                      {cond}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No prior medical history entered.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase text-slate-400">Clinical Milestone Summary</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Outpatient Visits:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Triage Visits:</span>
                  <span className="font-bold text-rose-600">{emergencyCases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ICU & Surgeries:</span>
                  <span className="font-bold text-amber-600">{icuRecords.length + otSurgeries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Prescriptions:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{prescriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inpatient Admissions:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{admissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Diagnostic Reports:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{labOrders.length + radiologyOrders.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Emergency Visits */}
      {activeTab === "emergency" && (
        <div className="space-y-4">
          {emergencyCases.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:bg-slate-900 dark:border-slate-800">
              <Siren className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No emergency casualty visits recorded for this patient.
              </p>
            </div>
          ) : (
            emergencyCases.map((emg: any) => (
              <div key={emg._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600">{emg.emergencyId}</span>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {emg.triagePriority} Triage
                    </span>
                    <StatusBadge status={emg.status} size="sm" />
                  </div>
                  <span className="text-[11px] text-slate-400">{formatDate(emg.arrivalTime || emg.createdAt)}</span>
                </div>
                <p className="mt-3 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Chief Complaint: </span>{emg.chiefComplaint}
                </p>
                {emg.treatmentNotes && (
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-bold">Treatment Notes: </span>{emg.treatmentNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: ICU & OT */}
      {activeTab === "icu-ot" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              ICU Stays & Telemetry Records ({icuRecords.length})
            </h3>
            {icuRecords.length === 0 ? (
              <p className="text-xs text-slate-400">No ICU admissions logged.</p>
            ) : (
              icuRecords.map((icu: any) => (
                <div key={icu._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 mb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-600">{icu.icuId} ({icu.unit})</span>
                    <StatusBadge status={icu.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    Ventilator: <span className="font-semibold">{icu.ventilatorStatus}</span> • Intensivist: {icu.attendingIntensivist?.name || "Dr. Sarah Jenkins"}
                  </p>
                </div>
              ))
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Operation Theatre Surgeries ({otSurgeries.length})
            </h3>
            {otSurgeries.length === 0 ? (
              <p className="text-xs text-slate-400">No OT procedures logged.</p>
            ) : (
              otSurgeries.map((ot: any) => (
                <div key={ot._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 mb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-teal-600">{ot.procedureName} ({ot.otScheduleId})</span>
                    <StatusBadge status={ot.surgeryStatus} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Surgeon: {ot.leadSurgeon?.name} • Anesthesia: {ot.anesthesiaType} • Suite: {ot.theatreNumber}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          {appointments.map((apt: any) => (
            <div
              key={apt._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {apt.doctor?.name || "Dr. Unassigned"} ({apt.department})
                    </h4>
                    <p className="text-[11px] text-slate-400">{formatDate(apt.appointmentDate)} • {apt.timeSlot}</p>
                  </div>
                </div>
                <StatusBadge status={apt.status} size="sm" />
              </div>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400">Reason: </span>
                {apt.reason}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Prescriptions */}
      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          {prescriptions.map((rx: any) => (
            <div
              key={rx._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-brand-600">{rx.prescriptionId}</span>
                  <p className="text-[11px] text-slate-400">Prescribed by {rx.doctor?.name} on {formatDate(rx.date)}</p>
                </div>
                <Link
                  href={`/prescriptions/${rx._id}`}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>View & Print Rx</span>
                </Link>
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold text-slate-800 dark:text-white mb-2">Diagnosis: {rx.diagnosis}</p>
                <div className="space-y-2">
                  {rx.medicines?.map((m: any, i: number) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-2.5 text-xs flex justify-between dark:bg-slate-800/50">
                      <span className="font-bold text-slate-800 dark:text-white">{m.medicineName} ({m.dosage})</span>
                      <span className="text-slate-500">{m.frequency} • {m.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Lab */}
      {activeTab === "lab" && (
        <div className="space-y-4">
          {labOrders.map((lab: any) => (
            <div
              key={lab._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-teal-600">{lab.orderId}</span>
                  <p className="text-[11px] text-slate-400">Order Date: {formatDate(lab.orderDate)}</p>
                </div>
                <StatusBadge status={lab.status} size="sm" />
              </div>
              <div className="mt-3">
                <ul className="space-y-1 text-xs">
                  {lab.tests?.map((t: any, i: number) => (
                    <li key={i} className="flex justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t.name}</span>
                      <span className="text-slate-500">{formatCurrency(t.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Radiology */}
      {activeTab === "radiology" && (
        <div className="space-y-4">
          {radiologyOrders.map((rad: any) => (
            <div
              key={rad._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-cyan-600">{rad.orderId}</span>
                  <p className="text-[11px] text-slate-400">Modality: {rad.modality} ({rad.bodyPart})</p>
                </div>
                <StatusBadge status={rad.status} size="sm" />
              </div>
              <p className="mt-3 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold">Impression: </span>{rad.impression || rad.clinicalNotes || "Pending report"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Admissions */}
      {activeTab === "admissions" && (
        <div className="space-y-4">
          {admissions.map((adm: any) => (
            <div
              key={adm._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-violet-600">{adm.admissionId}</span>
                  <p className="text-[11px] text-slate-400">Ward: {adm.ward} • Bed: {adm.bed?.bedNumber || "General"}</p>
                </div>
                <StatusBadge status={adm.status} size="sm" />
              </div>
              <p className="mt-3 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold">Reason: </span>{adm.admissionReason}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Billing */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          {invoices.map((inv: any) => (
            <div
              key={inv._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</span>
                  <p className="text-[11px] text-slate-400">Date: {formatDate(inv.invoiceDate)}</p>
                </div>
                <StatusBadge status={inv.paymentStatus} size="sm" />
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-slate-500">Total Billed: {formatCurrency(inv.totalAmount)}</span>
                <span className="font-bold text-emerald-600">Paid: {formatCurrency(inv.paidAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Referrals */}
      {activeTab === "referrals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Patient Referral Records ({referrals.length})
            </h3>
            <button
              onClick={() => setIsReferModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Referral</span>
            </button>
          </div>

          {referrals.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:bg-slate-900 dark:border-slate-800">
              <Share2 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No referral records found for this patient.
              </p>
            </div>
          ) : (
            referrals.map((ref: any) => (
              <div key={ref._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="font-bold text-purple-600">{ref.referralId} • To: {ref.destinationHospital}</span>
                  <StatusBadge status={ref.status} size="sm" />
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">
                  <span className="font-bold">Diagnosis: </span>{ref.diagnosis} • Reason: {ref.reasonForReferral}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Referral */}
      <Modal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        title="Issue Inter-Hospital Patient Referral"
        size="lg"
      >
        <form onSubmit={handleCreateReferral} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Destination Hospital *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. All India Institute of Medical Sciences (AIIMS)"
                value={referralForm.destinationHospital}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, destinationHospital: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <input
                type="text"
                value={referralForm.destinationDepartment}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, destinationDepartment: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Diagnosis *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Complex Triple Vessel CAD"
                value={referralForm.diagnosis}
                onChange={(e) => setReferralForm({ ...referralForm, diagnosis: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for Referral *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Higher tertiary intervention required"
                value={referralForm.reasonForReferral}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, reasonForReferral: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReferModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReferral}
              className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
            >
              {submittingReferral ? "Issuing..." : "Issue Official Referral"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
