"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Stethoscope,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
  Hospital,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  FileText,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const availableSlotsList = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM",
];

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"All" | "In-Person" | "Virtual Teleconsultation">("All");

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");

  const [formData, setFormData] = useState({
    consultationType: "Virtual Teleconsultation" as "In-Person" | "Virtual Teleconsultation",
    doctor: "",
    department: "Cardiology",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM - 10:30 AM",
    type: "Teleconsultation",
    reason: "General Consultation & Health Review",
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const d = await res.json();
        setAppointments(d.appointments || []);
      }
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    async function loadMetadata() {
      try {
        const [docRes, deptRes] = await Promise.all([
          fetch("/api/doctors"),
          fetch("/api/departments"),
        ]);
        if (docRes.ok) {
          const d = await docRes.json();
          const activeDocs = (d.doctors || []).filter((doc: any) => doc.status === "Active" || !doc.status);
          setDoctors(activeDocs);
          if (activeDocs.length > 0) {
            setFormData((prev) => ({
              ...prev,
              doctor: activeDocs[0]._id,
              department: activeDocs[0].department || prev.department,
            }));
          }
        }
        if (deptRes.ok) {
          const dep = await deptRes.json();
          setDepartments(dep.departments || []);
        }
      } catch (e) {
        console.error("Failed to load metadata", e);
      }
    }
    loadMetadata();
  }, []);

  const filteredDoctors = selectedDepartment === "All"
    ? doctors
    : doctors.filter((doc) => doc.department?.toLowerCase() === selectedDepartment.toLowerCase());

  const selectedDoctorObj = doctors.find((d) => d._id === formData.doctor);

  const handleDoctorChange = (docId: string) => {
    const doc = doctors.find((d) => d._id === docId);
    setFormData((prev) => ({
      ...prev,
      doctor: docId,
      department: doc?.department || prev.department,
    }));
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor || !formData.appointmentDate || !formData.timeSlot) {
      toast.error("Please select a doctor, appointment date, and time slot.");
      return;
    }

    const doc = doctors.find((d) => d._id === formData.doctor);
    const isVirtual = formData.consultationType === "Virtual Teleconsultation";
    const fee = isVirtual
      ? (doc?.teleconsultationFee || doc?.consultationFee || 500)
      : (doc?.consultationFee || 500);

    const payload = {
      ...formData,
      department: formData.department || doc?.department || "General Medicine",
      type: isVirtual ? "Teleconsultation" : "General",
      fee,
      reason: formData.reason.trim() || (isVirtual ? "Virtual Video Consultation" : "In-Person Visit"),
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          isVirtual
            ? "Virtual Teleconsultation booked! Your secure video room is ready."
            : "In-Person appointment booked successfully!"
        );
        setIsBookModalOpen(false);
        fetchAppointments();
      } else {
        toast.error(data.error || "Failed to book appointment.");
      }
    } catch {
      toast.error("Network error while booking appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayedAppointments = appointments.filter((apt) => {
    if (filterType === "All") return true;
    if (filterType === "Virtual Teleconsultation") {
      return apt.consultationType === "Virtual Teleconsultation" || apt.type === "Teleconsultation";
    }
    return apt.consultationType === "In-Person" || apt.type !== "Teleconsultation";
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>My Appointments & Consultations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your physical hospital visits and join secure Virtual Teleconsultation rooms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                consultationType: "Virtual Teleconsultation",
                type: "Teleconsultation",
              }));
              setIsBookModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:brightness-110 transition-all"
          >
            <Video className="h-4 w-4" />
            <span>Book Virtual Teleconsult</span>
          </button>

          <button
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                consultationType: "In-Person",
                type: "General",
              }));
              setIsBookModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-500/25 hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Book Hospital Visit</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilterType("All")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "All"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          All Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setFilterType("Virtual Teleconsultation")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "Virtual Teleconsultation"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <Video className="h-3.5 w-3.5" />
          <span>Virtual Teleconsultations ({appointments.filter((a) => a.consultationType === "Virtual Teleconsultation" || a.type === "Teleconsultation").length})</span>
        </button>
        <button
          onClick={() => setFilterType("In-Person")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "In-Person"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <Hospital className="h-3.5 w-3.5" />
          <span>In-Person Visits ({appointments.filter((a) => a.consultationType !== "Virtual Teleconsultation" && a.type !== "Teleconsultation").length})</span>
        </button>
      </div>

      {/* Appointments Cards List */}
      <div className="space-y-4">
        {loading && appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <LoadingSpinner />
            <p className="text-xs mt-3">Loading your appointments...</p>
          </div>
        ) : displayedAppointments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
            <EmptyState
              icon={Calendar}
              title="No Appointments Found"
              description="You have no scheduled appointments in this category. Click below to book a consultation."
              action={{
                label: "Book Appointment Now",
                onClick: () => setIsBookModalOpen(true),
              }}
            />
          </div>
        ) : (
          displayedAppointments.map((apt) => {
            const isVirtual = apt.consultationType === "Virtual Teleconsultation" || apt.type === "Teleconsultation";
            const sessionRoom = apt.teleconsultationSession?.roomId || `TEL-${apt.appointmentId?.replace("APT-", "") || apt._id?.slice(-4)}`;

            return (
              <div
                key={apt._id}
                className={`p-5 rounded-2xl border transition-all ${
                  isVirtual
                    ? "border-sky-200/80 bg-gradient-to-r from-sky-50/40 via-white to-indigo-50/30 dark:border-sky-900/50 dark:from-slate-900 dark:to-sky-950/30 shadow-sm"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Doctor & Details */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 font-bold ${
                        isVirtual
                          ? "bg-sky-100 text-sky-700 ring-4 ring-sky-50 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900/30"
                          : "bg-teal-100 text-teal-700 ring-4 ring-teal-50 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900/30"
                      }`}
                    >
                      {apt.doctor?.photo ? (
                        <img
                          src={apt.doctor.photo}
                          alt={apt.doctor?.name}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                      ) : isVirtual ? (
                        <Video className="h-7 w-7" />
                      ) : (
                        <Stethoscope className="h-7 w-7" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {apt.doctor?.name || "Dr. Specialist"}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isVirtual
                              ? "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800"
                              : "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800"
                          }`}
                        >
                          {isVirtual ? <Video className="h-3 w-3" /> : <Hospital className="h-3 w-3" />}
                          {isVirtual ? "Virtual Teleconsultation" : "In-Person OPD Visit"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {apt.appointmentId}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {apt.department || apt.doctor?.department || "General Department"}
                        </span>{" "}
                        • {apt.doctor?.specialization || "Consultant"} • Cabin: {apt.doctor?.roomNumber || "OPD-102"}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                          <Calendar className="h-3.5 w-3.5 text-brand-600" />
                          {apt.appointmentDate}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                          <Clock className="h-3.5 w-3.5 text-brand-600" />
                          {apt.timeSlot}
                        </span>
                        <span className="text-xs text-slate-400">
                          Fee: <strong className="text-slate-700 dark:text-white">₹{apt.fee || 500}</strong>
                        </span>
                      </div>

                      {apt.reason && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                          "{apt.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={apt.status || "Scheduled"} />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {isVirtual ? (
                        apt.status === "Completed" ? (
                          <Link
                            href="/patient/prescriptions"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                          >
                            <FileText className="h-3.5 w-3.5 text-brand-600" />
                            <span>View Prescription</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/teleconsultation?room=${sessionRoom}&appointment=${apt.appointmentId}&role=patient`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-sky-500/25 hover:brightness-110 transition-all w-full sm:w-auto"
                          >
                            <Video className="h-4 w-4" />
                            <span>Join Video Consultation</span>
                          </Link>
                        )
                      ) : (
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          Physical Hospital Visit
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Book Doctor Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Doctor Consultation"
      >
        <form onSubmit={handleBookSubmit} className="space-y-5">
          {/* Step 1: Choose Consultation Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Choose Consultation Mode *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    consultationType: "In-Person",
                    type: "General",
                  })
                }
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.consultationType === "In-Person"
                    ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/30 dark:bg-teal-950/40 dark:border-teal-400"
                    : "border-slate-200 hover:border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    <Hospital className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      🏥 In-Person Hospital Visit
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Visit the hospital and meet the doctor physically in OPD.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    consultationType: "Virtual Teleconsultation",
                    type: "Teleconsultation",
                  })
                }
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.consultationType === "Virtual Teleconsultation"
                    ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/30 dark:bg-sky-950/40 dark:border-sky-400"
                    : "border-slate-200 hover:border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      💻 Virtual Teleconsultation
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Consult remotely via secure, HD hospital video room.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Department and Doctor Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Filter by Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="All">All Medical Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id || dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Doctor / Specialist *
              </label>
              <select
                required
                value={formData.doctor}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                {filteredDoctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name} ({doc.department} - {doc.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Doctor Summary Card */}
          {selectedDoctorObj && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    selectedDoctorObj.photo ||
                    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
                  }
                  alt={selectedDoctorObj.name}
                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-brand-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedDoctorObj.name}
                  </p>
                  <p className="text-[11px] text-brand-600 dark:text-brand-400">
                    {selectedDoctorObj.qualification || "MD / MBBS"} • {selectedDoctorObj.specialization}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-semibold">Consultation Fee</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  ₹{formData.consultationType === "Virtual Teleconsultation"
                    ? (selectedDoctorObj.teleconsultationFee || selectedDoctorObj.consultationFee || 500)
                    : (selectedDoctorObj.consultationFee || 500)}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Date & Slot */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Available Time Slots *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSlotsList.map((slot) => {
                  const isSelected = formData.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, timeSlot: slot })}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        isSelected
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 4: Chief Complaint / Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Visit / Chief Symptoms
            </label>
            <textarea
              rows={2}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="e.g. Follow-up regarding blood pressure, fever, general consultation..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Pre-Confirmation Summary */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Appointment Mode:</span>
              <strong className={formData.consultationType === "Virtual Teleconsultation" ? "text-sky-600 dark:text-sky-400" : "text-teal-600 dark:text-teal-400"}>
                {formData.consultationType === "Virtual Teleconsultation" ? "💻 Virtual Teleconsultation" : "🏥 In-Person Hospital Visit"}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Patient:</span>
              <strong>{user?.name || "Logged-in Patient"}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Doctor:</span>
              <strong>{selectedDoctorObj?.name || "Specialist"} ({formData.department})</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Scheduled Date & Time:</span>
              <strong>{formData.appointmentDate} at {formData.timeSlot}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-teal-600 via-brand-600 to-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
