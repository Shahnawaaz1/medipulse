"use client";

import React, { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  Shield,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { UserRole } from "@/types";

const roleList: { label: string; value: UserRole }[] = [
  { label: "Super Admin", value: "super_admin" },
  { label: "Hospital Admin", value: "hospital_admin" },
  { label: "Doctor", value: "doctor" },
  { label: "Nurse", value: "nurse" },
  { label: "Pharmacist", value: "pharmacist" },
  { label: "Lab Technician", value: "lab_technician" },
  { label: "Accountant", value: "accountant" },
  { label: "Receptionist", value: "receptionist" },
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "nurse",
    department: "Inpatient Ward",
    designation: "Senior Staff Nurse",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: 65000,
    status: "Active",
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/staff?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStaffList(json.staff || []);
      }
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Staff member ${formData.name} added!`);
        setIsAddModalOpen(false);
        fetchStaff();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add staff");
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
            Hospital Staff & Human Resources
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Staff directory across all hospital divisions, roles, credentials, and payroll designations
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="">All Hospital Roles</option>
          {roleList.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <span className="text-xs font-semibold text-slate-400">
          {staffList.length} Active Staff Members
        </span>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <LoadingSpinner label="Loading staff directory..." />
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff members found"
          description="Add employees, nurses, pharmacists, and technologists to the system."
          actionText="Add Staff Member"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((staff) => (
            <div
              key={staff._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold text-sm dark:bg-brand-950 dark:text-brand-300">
                      {staff.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {staff.name}
                      </h3>
                      <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {staff.designation}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={staff.status} size="sm" />
                </div>

                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-bold capitalize">{staff.role.replace("_", " ")}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold">{staff.department}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-medium">{staff.phone}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Joining Date:</span>
                    <span>{formatDate(staff.joiningDate)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-slate-400">{staff.staffId}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(staff.salary)}/yr
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        subtitle="Register new hospital staff across administrative and clinical divisions"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Johnson"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">System Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white capitalize"
              >
                {roleList.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Department *</label>
              <input
                type="text"
                required
                placeholder="e.g. Intensive Care Unit"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Job Designation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Head Nurse, Senior Accountant"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+1 555-4011"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="staff@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Joining Date *</label>
              <input
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Annual Salary ($) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
            >
              {submitting ? "Adding..." : "Save Staff Member"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
