"use client";

import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Plus,
  Search,
  Mail,
  Phone,
  Clock,
  DollarSign,
  GraduationCap,
  Calendar,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Cardiology",
    specialization: "",
    qualification: "",
    experienceYears: 5,
    consultationFee: 80,
    roomNumber: "Room 101",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "09:00 AM", end: "04:00 PM" },
    status: "Active",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (deptFilter) params.append("department", deptFilter);

      const [resDocs, resDepts] = await Promise.all([
        fetch(`/api/doctors?${params.toString()}`),
        fetch("/api/departments"),
      ]);

      if (resDocs.ok) {
        const json = await resDocs.json();
        setDoctors(json.doctors || []);
      }
      if (resDepts.ok) {
        const json = await resDepts.json();
        setDepartments(json.departments || []);
      }
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Dr. ${formData.name} added successfully!`);
        setIsAddModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add doctor");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Specialist Doctors Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hospital medical faculty, consultation fees, duty schedules, and specialty departments
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor name, specialization, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <CardGridSkeleton count={6} />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="Try selecting a different department filter or add a new doctor."
          actionText="Add Doctor"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:bg-slate-900 dark:border-slate-800"
            >
              <div>
                {/* Doctor Avatar & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        doc.photo ||
                        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
                      }
                      alt={doc.name}
                      onError={(e: any) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80";
                      }}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-brand-500/20"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {doc.name}
                      </h3>
                      <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {doc.specialization}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} size="sm" />
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{doc.department} • {doc.roomNumber}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.qualification} ({doc.experienceYears} yrs exp)</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{doc.workingHours?.start} - {doc.workingHours?.end}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(doc.consultationFee)} / Consultation
                    </span>
                  </div>
                </div>

                {/* Available Days */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {doc.availableDays?.map((day: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{doc.doctorId}</span>
                <Link
                  href={`/appointments?doctor=${doc._id}`}
                  className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
                >
                  Book Slot
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Doctor to Faculty"
        subtitle="Configure doctor credentials, department, and consultation hours"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Doctor Name *
              </label>
              <input
                type="text"
                required
                placeholder="Dr. Samantha Cruz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specialization *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Interventional Cardiology"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Qualification *
              </label>
              <input
                type="text"
                required
                placeholder="MD, FACC, Harvard"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Consultation Fee ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room / OPD Cabin *
              </label>
              <input
                type="text"
                required
                placeholder="Room 304"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1 555-2244"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Adding Doctor..." : "Save Doctor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
