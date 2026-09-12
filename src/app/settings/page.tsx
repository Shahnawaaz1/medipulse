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
  MessageSquare,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
  ExternalLink,
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

      {/* WhatsApp Business Notification Integration Section */}
      <WhatsAppSettingsSection />

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

function WhatsAppSettingsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testPhone, setTestPhone] = useState("+91 9876543210");
  const [testName, setTestName] = useState("Hospital Administrator");
  const [testNote, setTestNote] = useState("Hospital WhatsApp integration operational verification.");
  const [sendingTest, setSendingTest] = useState(false);
  const [runningReminders, setRunningReminders] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/whatsapp");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) {
      toast.error("Please provide a recipient phone number");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientPhone: testPhone,
          recipientName: testName,
          messageText: testNote,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        if (result.demoMode) {
          toast.info("WhatsApp Demo Mode: Notification logged safely on server (no live SMS credit charged).");
        } else {
          toast.success("WhatsApp Notification dispatched successfully to Meta Cloud API!");
        }
        loadStatus();
      } else {
        toast.error(result.error || "Failed to dispatch test notification");
      }
    } catch (err: any) {
      toast.error("Network error dispatching test message");
    } finally {
      setSendingTest(false);
    }
  };

  const handleTriggerReminders = async () => {
    setRunningReminders(true);
    try {
      const res = await fetch("/api/notifications/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoursAhead: 24 }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "24h Appointment reminder batch completed!");
        loadStatus();
      } else {
        toast.error(result.error || "Reminder scan failed");
      }
    } catch {
      toast.error("Failed to run reminder scan");
    } finally {
      setRunningReminders(false);
    }
  };

  const isConnected = data?.status?.configured;
  const isDemo = data?.status?.demoMode;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900 space-y-6">
      {/* Header & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                WhatsApp Business API Notification Integration
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Meta Cloud API v18.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated patient appointment alerts, billing receipts, diagnostic lab notifications & discharge updates.
            </p>
          </div>
        </div>

        <div>
          {loading ? (
            <span className="text-xs text-slate-400">Checking status...</span>
          ) : isConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected (Live Meta API)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              WhatsApp Demo Mode Active
            </span>
          )}
        </div>
      </div>

      {/* Integration Overview & Privacy Safeguards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span>HIPAA & Privacy Safe</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Sensitive lab findings and diagnosis details are never transmitted over WhatsApp; patients receive secure portal links.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
            <Smartphone className="h-3.5 w-3.5 text-brand-500" />
            <span>Non-Blocking Dispatch</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Hospital workflows (admissions, billing, booking) operate uninterrupted; message failures log quietly without blocking transactions.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span>Scheduled Reminders</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Automated 24-hour & 2-hour pre-appointment reminders reduce no-shows.
          </p>
        </div>
      </div>

      {/* Production Environment Variables Guidance */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Meta WhatsApp Cloud API Configuration (.env)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {isConnected ? "Credentials Verified" : "Demo Mode Fallback Active"}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          To connect your official Meta WhatsApp Business account in production, provide these environment variables in your hosting provider (e.g. Vercel):
        </p>
        <div className="bg-slate-900 text-slate-200 rounded-lg p-3 font-mono text-[11px] space-y-1 overflow-x-auto">
          <div><span className="text-emerald-400">WHATSAPP_API_URL</span>=&quot;https://graph.facebook.com/v18.0&quot;</div>
          <div><span className="text-emerald-400">WHATSAPP_ACCESS_TOKEN</span>=&quot;EAA... (Meta System User Permanent Token)&quot;</div>
          <div><span className="text-emerald-400">WHATSAPP_PHONE_NUMBER_ID</span>=&quot;109283746592018&quot;</div>
          <div><span className="text-emerald-400">WHATSAPP_VERIFY_TOKEN</span>=&quot;medipulse_webhook_secret&quot;</div>
        </div>
      </div>

      {/* Interactive Tools: Test Message Dispatch + 24h Reminder Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Test Dispatch Form */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-emerald-600" />
              <span>Live Test Notification Dispatch</span>
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
              Admin Tool
            </span>
          </div>

          <form onSubmit={handleSendTest} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Recipient Phone Number (with Country Code)
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+91 9876543210 or +1 4155552671"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Custom Test Note
                </label>
                <input
                  type="text"
                  value={testNote}
                  onChange={(e) => setTestNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {isDemo ? "Will simulate & log in Demo Mode" : "Will dispatch via Meta Cloud API"}
              </span>
              <button
                type="submit"
                disabled={sendingTest}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{sendingTest ? "Dispatching..." : "Send Test Notification"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Scheduled Reminders & Controls */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                <span>Appointment Reminder Automation</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
                Cron / Batch Job
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Scans all confirmed upcoming patient appointments within the next 24 hours and dispatches personalized WhatsApp reminders with doctor and clinic details.
            </p>
          </div>

          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-900 dark:text-indigo-300">Cron Endpoint:</span>
              <code className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-mono">
                POST /api/notifications/reminders
              </code>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleTriggerReminders}
              disabled={runningReminders}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${runningReminders ? "animate-spin" : ""}`} />
              <span>{runningReminders ? "Processing Reminders..." : "Run 24h Reminder Scan"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Delivery Audit Logs Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Recent WhatsApp Notification Delivery Logs
          </h3>
          <button
            type="button"
            onClick={loadStatus}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Timestamp</th>
                <th className="px-3 py-2.5 font-semibold">Event</th>
                <th className="px-3 py-2.5 font-semibold">Recipient</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Message Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      {log.recipientPhone || "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {log.status === "Sent" ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Sent (API)
                        </span>
                      ) : log.status === "Demo" ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Demo Logged
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate text-[11px]">
                      {log.messageSnippet || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    No notification logs recorded yet. Dispatch a test message above to generate your first audit log.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

