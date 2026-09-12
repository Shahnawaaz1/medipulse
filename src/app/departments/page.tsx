"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Users,
  MapPin,
  Search,
  Stethoscope,
  Bed,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import Link from "next/link";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    headDoctor: "",
    floor: "1st Floor",
    totalBeds: 20,
    services: "",
    status: "Active",
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/departments");
      if (res.ok) {
        const json = await res.json();
        const list = json.departments || json.data || [];
        setDepartments(list);
      }
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepts = departments.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const servicesArray = formData.services
        ? formData.services.split(",").map((s) => s.trim())
        : ["Routine OPD", "Diagnostics"];

      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services: servicesArray,
          totalBeds: Number(formData.totalBeds) || 20,
        }),
      });

      if (res.ok) {
        toast.success(`Department ${formData.name} created!`);
        setIsAddModalOpen(false);
        fetchDepartments();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create department");
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
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700 dark:bg-brand-950 dark:text-brand-300 mb-1">
            <Building2 className="h-3.5 w-3.5" />
            <span>16+ CLINICAL SPECIALITY WINGS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Clinical Departments & Hospital Wings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-speciality medical divisions, specialized ICUs, ward wings, and doctor rosters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : filteredDepts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Create your first clinical department to organize doctors and patients."
          actionText="Add Department"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((dept) => (
            <div
              key={dept._id}
              className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-xl dark:bg-slate-900 dark:border-slate-800"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500/10 to-teal-500/10 text-brand-600 border border-brand-500/20 dark:text-brand-400">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {dept.name}
                      </h3>
                      <span className="font-mono text-[10px] font-extrabold text-brand-600 dark:text-brand-400">
                        {dept.code}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={dept.status} size="sm" />
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {dept.description}
                </p>

                {/* Services Pills */}
                {dept.services && dept.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {dept.services.slice(0, 3).map((svc: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Head of Dept:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {dept.headDoctor || "Dr. Medical Board"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Location / Floor:</span>
                    <span className="font-semibold">{dept.floor}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Specialist Faculty:</span>
                    <span className="font-extrabold text-brand-600 dark:text-brand-400">
                      {dept.totalDoctors || 4} Doctors on duty
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <Link
                  href={`/doctors?department=${encodeURIComponent(dept.name)}`}
                  className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 dark:text-brand-400"
                >
                  <span>View Doctors</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/appointments?department=${encodeURIComponent(dept.name)}`}
                  className="rounded-xl bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  Book OPD
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Hospital Department"
        subtitle="Add a specialized clinical division"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Oncology & Chemotherapy"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Code *
              </label>
              <input
                type="text"
                required
                placeholder="ONCO"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Floor Location
              </label>
              <input
                type="text"
                placeholder="3rd Floor, Tower B"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Head of Department
            </label>
            <input
              type="text"
              placeholder="Dr. Full Name"
              value={formData.headDoctor}
              onChange={(e) => setFormData({ ...formData, headDoctor: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Key Services (comma separated)
            </label>
            <input
              type="text"
              placeholder="Chemotherapy, Daycare, Tumor Board"
              value={formData.services}
              onChange={(e) => setFormData({ ...formData, services: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Scope of clinical services provided..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
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
              {submitting ? "Creating..." : "Save Department"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
