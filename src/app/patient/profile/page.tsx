"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Save,
  KeyRound,
  Heart,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function PatientProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: "Male",
    dob: "1992-01-01",
    bloodGroup: "O+",
    address: "Plot 42, Green Park",
    city: "Delhi NCR",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      toast.success("Profile details updated successfully!");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    toast.success("Password updated successfully!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          My Account & Profile
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your personal information, contact address, and portal security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-teal-500 to-brand-600 text-white text-3xl font-black shadow-lg shadow-teal-500/20">
            {user?.name?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {user?.name || "Patient"}
            </h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-2 rounded-full bg-teal-50 px-3 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              {user?.patientId || "PAT-8001"}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-teal-500" />
              <span>Role: Patient Portal</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Phone className="h-4 w-4 text-teal-500" />
              <span>{user?.phone || "+91 9876543217"}</span>
            </div>
          </div>
        </div>

        {/* Edit Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Personal Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    value={patientData.city}
                    onChange={(e) => setPatientData({ ...patientData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={patientData.bloodGroup}
                    onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security / Password update */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-teal-600" />
              <span>Change Portal Password</span>
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-800 text-white px-5 py-2 text-xs font-bold hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
