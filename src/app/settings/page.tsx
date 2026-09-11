"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Save,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    hospitalName: "MediPulse Hospital & Medical Institute",
    tagline: "World-Class Compassionate Healthcare & Research",
    email: "info@medipulsehospital.com",
    phone: "+1 (800) 456-7890",
    emergencyHotline: "+1 (800) 911-0000",
    address: "742 Healthcare Avenue, Medical District",
    city: "Metropolis",
    state: "NY",
    zipCode: "10001",
    taxId: "TX-MED-883921",
    currencySymbol: "$",
    timezone: "America/New_York",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.settings) setSettings(json.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Hospital profile and system settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSeed = async () => {
    try {
      setResetting(true);
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        toast.success("Database restored to clean demo state!");
        setIsResetDialogOpen(false);
        window.location.reload();
      }
    } catch {
      toast.error("Failed to restore demo database");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading hospital settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hospital Profile & System Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Institutional branding, tax credentials, emergency hotlines, and database management
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Hospital Identity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 pb-2 dark:border-slate-800">
            Institution & Branding
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Hospital / Medical Center Name *</label>
              <input
                type="text"
                required
                value={settings.hospitalName || ""}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={settings.tagline || ""}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Tax ID / Hospital Registration # *</label>
              <input
                type="text"
                required
                value={settings.taxId || ""}
                onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Billing Currency Symbol</label>
              <input
                type="text"
                value={settings.currencySymbol || "$"}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 pb-2 dark:border-slate-800">
            Contact Channels & Physical Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Primary Helpdesk Phone *</label>
              <input
                type="text"
                required
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">24/7 Emergency Hotline *</label>
              <input
                type="text"
                required
                value={settings.emergencyHotline || ""}
                onChange={(e) =>
                  setSettings({ ...settings, emergencyHotline: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-bold text-rose-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                value={settings.email || ""}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Street Address</label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">City</label>
              <input
                type="text"
                value={settings.city || ""}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">State & Zip Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="NY"
                  value={settings.state || ""}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="10001"
                  value={settings.zipCode || ""}
                  onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Profile..." : "Save Hospital Profile"}</span>
          </button>
        </div>
      </form>

      {/* PWA & Mobile App Info Card */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-6 shadow-sm dark:border-teal-900/60 dark:bg-teal-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-teal-800 dark:text-teal-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Progressive Web Application (PWA)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Installable on Windows, macOS, Android, and iOS devices for full standalone hospital operations.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:bg-teal-900/80 dark:text-teal-300">
            PWA Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-medium text-slate-400">Display Mode</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Standalone App</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-medium text-slate-400">Service Worker</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Active & Encrypted</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-medium text-slate-400">Security & Isolation</span>
            <p className="font-bold text-teal-600 dark:text-teal-400 mt-0.5">Zero Private Data Caching</p>
          </div>
        </div>
      </div>

      {/* Demo Data Reset Danger Zone */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20 space-y-3">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <RefreshCw className="h-5 w-5" />
          <h3 className="text-sm font-bold">Reset Demo Hospital Database</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Restore the entire hospital system with pristine realistic mock records (patients, doctors, appointments, beds, medicines, lab investigations, and invoices).
        </p>
        <button
          type="button"
          onClick={() => setIsResetDialogOpen(true)}
          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
        >
          Reset & Populate Demo Data
        </button>
      </div>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetSeed}
        title="Reset Hospital Database"
        message="Are you sure you want to reset all records and reload fresh hospital demo data? Current test changes will be replaced."
        confirmText="Confirm Reset"
        isLoading={resetting}
      />
    </div>
  );
}
