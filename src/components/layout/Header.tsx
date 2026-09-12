"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import {
  Bell,
  Search,
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  Shield,
  CheckCircle,
  RefreshCw,
  UserCheck,
  Settings,
  Sparkles,
  Bot,
} from "lucide-react";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { QuickActionModal } from "./QuickActionModal";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, normalizeRole } from "@/lib/permissions";
import Link from "next/link";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/common/ThemeToggle";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const roleOptions: { label: string; value: UserRole }[] = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Nurse", value: "NURSE" },
  { label: "Receptionist", value: "RECEPTIONIST" },
  { label: "Pharmacist", value: "PHARMACIST" },
  { label: "Accountant", value: "ACCOUNTANT" },
  { label: "Lab Technician", value: "LAB_TECHNICIAN" },
  { label: "Radiology Tech", value: "RADIOLOGY_TECHNICIAN" },
  { label: "Patient", value: "PATIENT" },
];

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, role, switchRole, logout, isAdmin, isPatient } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    await switchRole(newRole);
    toast.success(`Active role: ${ROLE_LABELS[normalizeRole(newRole)] || newRole}`);
  };

  const handleSeedReset = async () => {
    try {
      toast.loading("Resetting and seeding demo hospital records...");
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        toast.dismiss();
        toast.success("Demo hospital database refreshed with fresh records!");
        window.location.reload();
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to reset database");
    }
  };

  const profileHref = isPatient ? "/patient/profile" : "/profile";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search Trigger Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-700 w-48 sm:w-72"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1 text-left truncate">Search patients, doctors...</span>
            <kbd className="hidden rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-block dark:bg-slate-700 dark:text-slate-300">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Assistant Navigation Button */}
          <Link
            href="/ai-assistant"
            prefetch={true}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:brightness-110 transition-all group"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
            <span className="hidden xs:inline">🧠 AI Assistant</span>
            <span className="xs:hidden">AI</span>
          </Link>

          {/* Quick Action Button for staff */}
          {!isPatient && (
            <button
              onClick={() => setQuickActionOpen(true)}
              className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-brand-700 hover:to-teal-700 transition-all sm:flex"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Quick Action</span>
            </button>
          )}

          {/* Re-seed demo database button (Dev/Admin) */}
          {isAdmin && (
            <button
              onClick={handleSeedReset}
              title="Reset Demo Data"
              className="hidden items-center gap-1 rounded-xl border border-slate-200 p-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 md:flex dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-[11px]">Reset Data</span>
            </button>
          )}

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Hospital Notifications
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      No notifications available
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={cn(
                          "rounded-xl p-2.5 text-xs transition-colors",
                          notif.read
                            ? "bg-slate-50/50 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400"
                            : "bg-brand-50/60 text-slate-900 border border-brand-100 dark:bg-brand-950/40 dark:text-white dark:border-brand-900/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80"
                }
                alt={user?.name || "User"}
                className="h-8 w-8 rounded-xl object-cover ring-2 ring-brand-500/20"
              />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                  {user?.name || (role === "SUPER_ADMIN" ? "Hospital Administrator" : ROLE_LABELS[role] || "Staff Member")}
                </p>
                <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                  {ROLE_LABELS[role] || role}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {ROLE_LABELS[role] || role}
                  </span>
                </div>
                <div className="pt-1">
                  <Link
                    href={profileHref}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      <span>Hospital Settings</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickActionModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />
    </>
  );
}
export default Header;
