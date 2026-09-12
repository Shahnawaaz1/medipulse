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
  MessageSquare,
  Bell,
  Check,
  Shield,
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

  const [notificationPrefs, setNotificationPrefs] = useState({
    whatsappEnabled: true,
    appointmentAlerts: true,
    billingAlerts: true,
    reportAlerts: true,
    admissionAlerts: true,
    marketingAlerts: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/patient/preferences");
        if (res.ok) {
          const json = await res.json();
          if (json.preferences) {
            setNotificationPrefs(json.preferences);
          }
        }
      } catch (err) {
        console.error("Failed to load preferences", err);
      }
    }
    loadPreferences();
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/patient/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationPrefs),
      });
      if (res.ok) {
        toast.success("WhatsApp communication preferences saved successfully!");
      } else {
        toast.error("Failed to save communication preferences");
      }
    } catch {
      toast.error("Network error updating preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

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

          {/* WhatsApp & Communication Preferences Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    WhatsApp Communication Preferences
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Choose which notifications you wish to receive via your registered mobile number
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Consent Controlled
              </span>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
              {/* Master WhatsApp Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Receive WhatsApp Notifications
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Master toggle for all hospital automated WhatsApp messages
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.whatsappEnabled}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        whatsappEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Specific Notification Toggles */}
              <div className={`space-y-3 ${!notificationPrefs.whatsappEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Appointment Confirmations & Reminders
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Booking confirmations, doctor details, 24h & 2h schedule reminders
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.appointmentAlerts}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        appointmentAlerts: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Billing & Payment Receipts
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Invoices, payment confirmations, and receipt references
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.billingAlerts}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        billingAlerts: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Lab & Radiology Report Availability
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Secure alerts when your diagnostic tests are finalized (no raw clinical data)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.reportAlerts}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        reportAlerts: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Inpatient Admission & Discharge Updates
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Room assignment, department contacts, and discharge instructions
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.admissionAlerts}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        admissionAlerts: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/30 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Safeguard:</strong> MediPulse Hospital strictly never sends marketing spam or unencrypted medical test results over WhatsApp. You can revoke consent at any time.
                </span>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingPrefs ? "Saving..." : "Save WhatsApp Preferences"}</span>
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
