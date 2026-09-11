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
  KeyRound,
  Edit2,
  CheckCircle2,
  XCircle,
  Power,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { UserRole } from "@/types";
import { ROLE_LABELS, normalizeRole } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";

const roleList: { label: string; value: UserRole }[] = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Hospital Admin", value: "ADMIN" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Nurse", value: "NURSE" },
  { label: "Receptionist", value: "RECEPTIONIST" },
  { label: "Pharmacist", value: "PHARMACIST" },
  { label: "Accountant", value: "ACCOUNTANT" },
  { label: "Lab Technician", value: "LAB_TECHNICIAN" },
  { label: "Radiology Technician", value: "RADIOLOGY_TECHNICIAN" },
];

export default function StaffPage() {
  const { user, isAdmin } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "DOCTOR",
    department: "Cardiology",
    designation: "Consultant",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: 85000,
    status: "Active",
    employeeId: "",
    password: "password123",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    role: "DOCTOR",
    department: "",
    designation: "",
    salary: 50000,
    status: "Active",
  });

  const [newPassword, setNewPassword] = useState("");

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/staff?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStaffList(json.staff || []);
      }
    } catch {
      toast.error("Failed to load staff list");
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
        toast.success(`Staff account for ${formData.name} created!`);
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "DOCTOR",
          department: "Cardiology",
          designation: "Consultant",
          joiningDate: new Date().toISOString().split("T")[0],
          salary: 85000,
          status: "Active",
          employeeId: "",
          password: "password123",
        });
        fetchStaff();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add staff");
      }
    } catch {
      toast.error("An error occurred while creating staff account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/staff/${selectedStaff._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        toast.success("Staff details updated successfully");
        setIsEditModalOpen(false);
        fetchStaff();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update staff");
      }
    } catch {
      toast.error("Error updating staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !newPassword) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/staff/${selectedStaff._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success(`Password reset for ${selectedStaff.name}!`);
        setIsPasswordModalOpen(false);
        setNewPassword("");
      } else {
        toast.error("Failed to reset password");
      }
    } catch {
      toast.error("Error resetting password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: any) => {
    const nextStatus = staff.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/staff/${staff._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Staff account marked ${nextStatus}`);
        fetchStaff();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const openEditModal = (staff: any) => {
    setSelectedStaff(staff);
    setEditFormData({
      name: staff.name,
      phone: staff.phone,
      role: normalizeRole(staff.role),
      department: staff.department,
      designation: staff.designation,
      salary: staff.salary,
      status: staff.status,
    });
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (staff: any) => {
    setSelectedStaff(staff);
    setNewPassword("password123");
    setIsPasswordModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Staff & User RBAC Management</span>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              Admin Only
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create staff accounts, assign granular role permissions, manage employee credentials, and activate/deactivate access.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Staff Account</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchStaff()}
            placeholder="Search staff by name, email, Employee ID..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Staff Roles</option>
            {roleList.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={UserCog}
              title="No Staff Accounts Found"
              description="Click the button above to provision a new staff member account with assigned RBAC roles."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Staff Member</th>
                  <th className="px-5 py-3.5 font-bold">Employee ID</th>
                  <th className="px-5 py-3.5 font-bold">Assigned Role</th>
                  <th className="px-5 py-3.5 font-bold">Department</th>
                  <th className="px-5 py-3.5 font-bold">Designation</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffList.map((staff) => {
                  const norm = normalizeRole(staff.role);
                  return (
                    <tr
                      key={staff._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold dark:bg-brand-950 dark:text-brand-300 shrink-0">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {staff.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{staff.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        {staff.staffId}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-brand-700 dark:text-brand-300">
                          {ROLE_LABELS[norm] || staff.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {staff.department}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {staff.designation}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={staff.status || "Active"} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(staff)}
                            title="Edit Staff Details & Role"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openPasswordModal(staff)}
                            title="Reset Staff Password"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400 transition-colors"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            title={staff.status === "Active" ? "Deactivate Account" : "Activate Account"}
                            className={`rounded-lg p-1.5 transition-colors ${
                              staff.status === "Active"
                                ? "text-emerald-600 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                                : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950"
                            }`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Arthur Conan"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="arthur@hospital.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID (Optional)
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Role (RBAC) *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {roleList.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Cardiology / Nursing / Pharmacy"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation Title
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Senior Specialist / Head Nurse"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="password123"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? "Creating Account..." : "Provision Staff Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Staff Account — ${selectedStaff?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Role
              </label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {roleList.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={editFormData.department}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, department: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={editFormData.designation}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, designation: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Reset Password — ${selectedStaff?.name}`}
      >
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set a new temporary or permanent password for staff login account ({selectedStaff?.email}).
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
