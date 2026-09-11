"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  List,
  CalendarDays,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const timeSlots = [
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
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "slots">("list");
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    department: "Cardiology",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: timeSlots[0],
    type: "General",
    reason: "",
    status: "Scheduled",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFilter) params.append("date", dateFilter);
      if (statusFilter) params.append("status", statusFilter);

      const [resApt, resDocs, resPats] = await Promise.all([
        fetch(`/api/appointments?${params.toString()}`),
        fetch("/api/doctors"),
        fetch("/api/patients"),
      ]);

      if (resApt.ok) {
        const json = await resApt.json();
        setAppointments(json.appointments || []);
      }
      if (resDocs.ok) {
        const json = await resDocs.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !formData.doctor) {
          setFormData((prev) => ({
            ...prev,
            doctor: json.doctors[0]._id,
            department: json.doctors[0].department,
          }));
        }
      }
      if (resPats.ok) {
        const json = await resPats.json();
        setPatients(json.patients || []);
        if (json.patients?.length > 0 && !formData.patient) {
          setFormData((prev) => ({ ...prev, patient: json.patients[0]._id }));
        }
      }
    } catch {
      toast.error("Failed to load appointment schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, statusFilter]);

  const handleDoctorSelect = (docId: string) => {
    const doc = doctors.find((d) => d._id === docId);
    setFormData((prev) => ({
      ...prev,
      doctor: docId,
      department: doc ? doc.department : prev.department,
    }));
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient) {
      toast.error("Please select a patient for the appointment.");
      return;
    }
    if (!formData.doctor) {
      toast.error("Please select a specialist doctor.");
      return;
    }

    const payload = {
      ...formData,
      department: formData.department || doctors.find((d) => d._id === formData.doctor)?.department || "General Medicine",
      reason: formData.reason.trim() || "General Consultation",
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Appointment booked successfully!");
        setIsBookModalOpen(false);
        setFormData({
          patient: patients[0]?._id || "",
          doctor: doctors[0]?._id || "",
          department: doctors[0]?.department || "General Medicine",
          appointmentDate: new Date().toISOString().split("T")[0],
          timeSlot: timeSlots[0],
          type: "General",
          reason: "",
          status: "Scheduled",
        });
        fetchData();
      } else {
        toast.error(json.error || "Failed to book appointment");
      }
    } catch {
      toast.error("An error occurred while booking the appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Appointment status updated to ${newStatus}`);
        fetchData();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Appointment Scheduling & Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage outpatient bookings, doctor consultations, check-ins, and slot availability
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("slots")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "slots"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Slots</span>
            </button>
          </div>

          <button
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked In">Checked In</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>{appointments.length} Total Bookings Found</span>
        </div>
      </div>

      {/* List View Mode */}
      {viewMode === "list" && (
        <>
          {loading ? (
            <LoadingSpinner label="Loading appointments..." />
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No appointments scheduled"
              description={`There are no bookings matching the selected date (${dateFilter || "All dates"}).`}
              actionText="Book Appointment"
              onAction={() => setIsBookModalOpen(true)}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">ID & Patient</th>
                      <th className="px-5 py-3.5">Attending Doctor</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Date & Time Slot</th>
                      <th className="px-5 py-3.5">Reason for Visit</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {appointments.map((apt) => (
                      <tr
                        key={apt._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/patients/${apt.patient?._id || apt.patient}`}
                            className="font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                          >
                            {apt.patient?.name || "Patient"}
                          </Link>
                          <p className="text-[11px] font-mono text-slate-400">
                            {apt.appointmentId} • {apt.patient?.phone}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {apt.doctor?.name || "Doctor"}
                          </p>
                          <p className="text-[11px] text-slate-400">{apt.doctor?.roomNumber}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-brand-600 dark:text-brand-400">
                            {apt.department}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatDate(apt.appointmentDate)}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">{apt.timeSlot}</p>
                        </td>
                        <td className="px-5 py-4 max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                          {apt.reason}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={apt.status} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {apt.status === "Scheduled" && (
                              <button
                                onClick={() => handleStatusUpdate(apt._id, "Confirmed")}
                                className="rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                              >
                                Confirm
                              </button>
                            )}
                            {apt.status === "Confirmed" && (
                              <button
                                onClick={() => handleStatusUpdate(apt._id, "Checked In")}
                                className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                              >
                                Check In
                              </button>
                            )}
                            {apt.status === "Checked In" && (
                              <button
                                onClick={() => handleStatusUpdate(apt._id, "In Consultation")}
                                className="rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300"
                              >
                                Consult
                              </button>
                            )}
                            {apt.status === "In Consultation" && (
                              <button
                                onClick={() => handleStatusUpdate(apt._id, "Completed")}
                                className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                              >
                                Complete
                              </button>
                            )}
                            {apt.status !== "Completed" && apt.status !== "Cancelled" && (
                              <button
                                onClick={() => handleStatusUpdate(apt._id, "Cancelled")}
                                className="rounded-lg p-1 text-slate-400 hover:text-rose-600"
                                title="Cancel"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Time Slot Matrix View Mode */}
      {viewMode === "slots" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {timeSlots.map((slot) => {
            const bookedInSlot = appointments.filter((a) => a.timeSlot === slot);
            return (
              <div
                key={slot}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {slot}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      bookedInSlot.length > 0 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                </div>

                <div className="mt-3 space-y-2">
                  {bookedInSlot.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Slot Available
                    </p>
                  ) : (
                    bookedInSlot.map((apt) => (
                      <div
                        key={apt._id}
                        className="rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50"
                      >
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {apt.patient?.name}
                        </p>
                        <p className="text-[10px] text-brand-600 truncate">{apt.doctor?.name}</p>
                        <div className="mt-1.5">
                          <StatusBadge status={apt.status} size="sm" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Patient Appointment"
        subtitle="Select patient, specialist doctor, date, and available time slot"
        maxWidth="2xl"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Patient *
              </label>
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId}) - {p.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Specialist Doctor *
              </label>
              <select
                required
                value={formData.doctor}
                onChange={(e) => handleDoctorSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.specialization} - {d.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot *
              </label>
              <select
                required
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-semibold"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visit Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="General">General Consultation</option>
                <option value="Follow-up">Follow-up Visit</option>
                <option value="Emergency">Emergency Evaluation</option>
                <option value="Routine Checkup">Routine Checkup</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Visit / Symptoms *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Describe symptoms, complaints, or routine evaluation..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Booking Slot..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
