"use client";

import React, { useEffect, useState } from "react";
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
    | "overview"
    | "appointments"
    | "prescriptions"
    | "lab"
    | "radiology"
    | "admissions"
    | "billing"
    | "referrals"
  >("overview");

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

  if (loading) {
    return <LoadingSpinner label="Loading electronic medical profile..." />;
  }

  if (!data?.patient) {
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

  const { patient, history } = data;
  const appointments = history?.appointments || [];
  const prescriptions = history?.prescriptions || [];
  const labOrders = history?.labOrders || [];
  const radiologyOrders = history?.radiologyOrders || [];
  const admissions = history?.admissions || [];
  const invoices = history?.invoices || [];
  const referrals = history?.referrals || [];

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
            <p className="text-xs text-slate-400">Next of Kin</p>
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
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-1 pb-1">
        {[
          { id: "overview", label: "Medical Overview", icon: Activity, count: null },
          { id: "referrals", label: "Referral History", icon: Share2, count: referrals.length },
          { id: "appointments", label: "Appointments", icon: Calendar, count: appointments.length },
          { id: "prescriptions", label: "Prescriptions (Rx)", icon: FileSignature, count: prescriptions.length },
          { id: "lab", label: "Laboratory Reports", icon: FlaskConical, count: labOrders.length },
          { id: "radiology", label: "Radiology Scans", icon: ScanLine, count: radiologyOrders.length },
          { id: "admissions", label: "Admissions (IPD)", icon: Hotel, count: admissions.length },
          { id: "billing", label: "Billing & Invoices", icon: Receipt, count: invoices.length },
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

      {/* Tab: Referrals History */}
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
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click "Refer Patient" above to refer them to another hospital.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="px-5 py-3.5">Referral ID</th>
                    <th className="px-5 py-3.5">Destination Hospital</th>
                    <th className="px-5 py-3.5">Referring Doctor</th>
                    <th className="px-5 py-3.5">Diagnosis</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {referrals.map((ref: any) => (
                    <tr key={ref._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {ref.referralId}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{ref.destinationHospital}</span>
                        </div>
                        <p className="text-[10px] text-purple-600 font-semibold">
                          {ref.destinationDepartment}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {ref.referringDoctor?.name || "Doctor"}
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                        {ref.diagnosis}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            ref.priority === "Emergency"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : ref.priority === "Urgent"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {ref.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={ref.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(ref.referralDate)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReferral({ ...ref, patient });
                            setIsReferSlipModalOpen(true);
                          }}
                          className="flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 ml-auto"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clinical Alerts & History */}
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

          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase text-slate-400">Consultation Summary</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Visits:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Prescriptions:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{prescriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Referrals:</span>
                  <span className="font-bold text-purple-600">{referrals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inpatient Admissions:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{admissions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Appointments */}
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

      {/* Tab 3: Prescriptions */}
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

      {/* Tab 4: Lab */}
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

      {/* Tab 5: Radiology */}
      {activeTab === "radiology" && (
        <div className="space-y-4">
          {radiologyOrders.map((rad: any) => (
            <div
              key={rad._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600">{rad.orderId}</span>
                  <p className="text-[11px] text-slate-400">{rad.modality} - {rad.bodyPart}</p>
                </div>
                <StatusBadge status={rad.status} size="sm" />
              </div>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{rad.clinicalNotes}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Admissions */}
      {activeTab === "admissions" && (
        <div className="space-y-4">
          {admissions.map((adm: any) => (
            <div
              key={adm._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-brand-600">{adm.admissionId}</span>
                  <p className="text-[11px] text-slate-400">Ward: {adm.ward} • Bed: {adm.bed?.bedNumber || "Assigned"}</p>
                </div>
                <StatusBadge status={adm.status} size="sm" />
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">Attending Physician</p>
                  <p className="font-bold text-slate-800 dark:text-white">{adm.doctor?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Admission Date</p>
                  <p className="font-bold text-slate-800 dark:text-white">{formatDate(adm.admissionDate)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-400 font-semibold">Reason for Admission</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{adm.admissionReason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: Billing */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          {invoices.map((inv: any) => (
            <div
              key={inv._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-brand-600">{inv.invoiceNumber}</span>
                  <p className="text-[11px] text-slate-400">Date: {formatDate(inv.invoiceDate)}</p>
                </div>
                <StatusBadge status={inv.paymentStatus} size="sm" />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-500">Total Billed: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(inv.totalAmount)}</span></p>
                  <p className="text-slate-500">Paid: <span className="font-bold text-emerald-600">{formatCurrency(inv.paidAmount)}</span></p>
                </div>
                <Link
                  href={`/billing/${inv._id}`}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>View Slip</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REFER PATIENT MODAL */}
      <Modal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        title={`Refer Patient — ${patient.name}`}
        subtitle="Transfer or refer this patient to another hospital / healthcare institution"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateReferral} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Referring Doctor *
              </label>
              <select
                required
                value={referralForm.referringDoctor}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, referringDoctor: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority Level *
              </label>
              <select
                value={referralForm.priority}
                onChange={(e) =>
                  setReferralForm({
                    ...referralForm,
                    priority: e.target.value as "Normal" | "Urgent" | "Emergency",
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Hospital / Institution *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AIIMS New Delhi / Apollo Hospital"
                value={referralForm.destinationHospital}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, destinationHospital: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Department *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiothoracic Surgery"
                value={referralForm.destinationDepartment}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, destinationDepartment: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Diagnosis *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Left Main Coronary Artery Disease"
              value={referralForm.diagnosis}
              onChange={(e) =>
                setReferralForm({ ...referralForm, diagnosis: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Referral *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Requires urgent specialized robotic intervention..."
              value={referralForm.reasonForReferral}
              onChange={(e) =>
                setReferralForm({ ...referralForm, reasonForReferral: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Summary & Present Management
            </label>
            <textarea
              rows={3}
              placeholder="Patient vitals, current medications, investigations..."
              value={referralForm.clinicalSummary}
              onChange={(e) =>
                setReferralForm({ ...referralForm, clinicalSummary: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsReferModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReferral}
              className="rounded-xl bg-purple-600 px-6 py-2 font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
            >
              {submittingReferral ? "Issuing..." : "Submit Referral"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW / PRINT REFERRAL SLIP MODAL */}
      {selectedReferral && (
        <Modal
          isOpen={isReferSlipModalOpen}
          onClose={() => setIsReferSlipModalOpen(false)}
          title={`Referral Slip — ${selectedReferral.referralId}`}
          subtitle="Hospital Transfer Letter"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="border-b-2 border-slate-900 pb-3 text-center dark:border-white">
              <h2 className="text-base font-black uppercase text-slate-900 dark:text-white">
                MediPulse Hospital & Medical Institute
              </h2>
              <p className="text-[10px] text-slate-500">Official Clinical Transfer Referral Slip</p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div>
                <p className="text-[10px] text-slate-400">Referral ID</p>
                <p className="font-mono font-bold text-purple-600">{selectedReferral.referralId}</p>
                <p className="text-[10px] text-slate-500">Date: {formatDate(selectedReferral.referralDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Status</p>
                <p className="font-bold text-emerald-600">{selectedReferral.status}</p>
                <p className="text-[10px] font-bold text-purple-600">Priority: {selectedReferral.priority}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <p className="text-[10px] font-bold text-slate-400">Patient</p>
                <p className="font-bold">{patient.name} ({patient.patientId})</p>
                <p className="text-[11px] text-slate-500">{patient.gender}, {patient.age}y • Blood: {patient.bloodGroup}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-[10px] font-bold text-slate-400">Referred To</p>
                <p className="font-bold">{selectedReferral.destinationHospital}</p>
                <p className="text-[11px] text-purple-600 font-semibold">{selectedReferral.destinationDepartment}</p>
              </div>
            </div>

            <div>
              <p className="font-bold">Diagnosis:</p>
              <p className="rounded-lg bg-slate-50 p-2 text-slate-800 dark:bg-slate-800 dark:text-slate-200 mt-1">
                {selectedReferral.diagnosis}
              </p>
            </div>

            <div>
              <p className="font-bold">Reason for Referral:</p>
              <p className="rounded-lg bg-slate-50 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mt-1">
                {selectedReferral.reasonForReferral}
              </p>
            </div>

            {selectedReferral.clinicalSummary && (
              <div>
                <p className="font-bold">Clinical Summary:</p>
                <p className="rounded-lg bg-slate-50 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mt-1 whitespace-pre-line">
                  {selectedReferral.clinicalSummary}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsReferSlipModalOpen(false)}
                className="rounded-xl border px-4 py-2 font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-brand-600 dark:bg-slate-800"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
