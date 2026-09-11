"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Droplet,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (genderFilter) params.append("gender", genderFilter);
      if (bloodGroupFilter) params.append("bloodGroup", bloodGroupFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/patients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [genderFilter, bloodGroupFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleDeactivate = async () => {
    if (!selectedPatient) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/patients/${selectedPatient._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Patient ${selectedPatient.name} marked as discharged`);
        setDeleteDialogOpen(false);
        fetchPatients();
      }
    } catch {
      toast.error("Failed to deactivate patient");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Patient Records Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive patient directory, medical histories, demographics, and clinical status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/patients/new"
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Patient</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID (e.g. PAT-8001), phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Blood Groups</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inpatient">Inpatient (Admitted)</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Discharged">Discharged</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Patient Table */}
      {loading ? (
        <LoadingSpinner label="Loading patient directory..." />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description="Try modifying your search filter or register a new patient."
          actionText="Register Patient"
          onAction={() => window.location.assign("/patients/new")}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Gender & Age</th>
                  <th className="px-5 py-3.5">Contact / Phone</th>
                  <th className="px-5 py-3.5">Blood Group</th>
                  <th className="px-5 py-3.5">Emergency Contact</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {patients.map((pat) => (
                  <tr
                    key={pat._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/patients/${pat._id}`}
                        className="font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400 flex items-center gap-2"
                      >
                        <span className="h-8 w-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0 dark:bg-brand-950 dark:text-brand-300">
                          {pat.name.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-bold leading-tight">{pat.name}</p>
                          <p className="text-[11px] text-slate-400">{pat.patientId}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {pat.gender}
                      </p>
                      <p className="text-[11px] text-slate-400">{pat.age} yrs ({pat.dob})</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {pat.phone}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {pat.email || pat.city}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md dark:bg-rose-950/40 dark:text-rose-400">
                        <Droplet className="h-3 w-3" />
                        {pat.bloodGroup}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {pat.emergencyContact?.name || "N/A"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {pat.emergencyContact?.relationship} • {pat.emergencyContact?.phone}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={pat.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/patients/${pat._id}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                          title="View Full Profile & Timeline"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedPatient(pat);
                            setDeleteDialogOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Discharge / Deactivate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeactivate}
        title="Discharge / Deactivate Patient"
        message={`Are you sure you want to mark patient ${selectedPatient?.name} (${selectedPatient?.patientId}) as discharged?`}
        confirmText="Confirm Discharge"
        isLoading={deleting}
      />
    </div>
  );
}
