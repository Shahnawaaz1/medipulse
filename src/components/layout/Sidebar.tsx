"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Clock,
  Stethoscope,
  Building2,
  Bed,
  Hotel,
  Pill,
  FileText,
  FlaskConical,
  ScanLine,
  Receipt,
  UserCog,
  Package,
  BarChart3,
  Settings,
  Sparkles,
  QrCode,
  Video,
  ShieldCheck,
  UserCheck,
  Globe,
  X,
  HeartPulse,
  Share2,
  FileSpreadsheet,
  CreditCard,
  FolderHeart,
  Siren,
  Activity,
  Scissors,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { canAccessRoute, getDefaultDashboard, ROLE_LABELS } from "@/lib/permissions";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const allHospitalNavigationGroups: NavGroup[] = [
  {
    title: "MAIN & OVERVIEW",
    items: [
      { name: "Hospital ERP Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Public Website (Outer)", href: "/", icon: Globe, badge: "Live Site" },
    ],
  },
  {
    title: "CRITICAL CARE & SURGERY",
    items: [
      {
        name: "Emergency & Casualty",
        href: "/emergency",
        icon: Siren,
        badge: "24x7 Triage",
        badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
      },
      {
        name: "ICU Management Live",
        href: "/icu",
        icon: Activity,
        badge: "Telemetry",
        badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      },
      {
        name: "Operation Theatre (OT)",
        href: "/ot",
        icon: Scissors,
        badge: "Schedules",
        badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
      },
    ],
  },
  {
    title: "AI & SMART HEALTHCARE",
    items: [
      {
        name: "🧠 AI Assistant",
        href: "/ai-assistant",
        icon: Sparkles,
        badge: "AI 2.0",
        badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      },
      {
        name: "ABDM & ABHA Health Card",
        href: "/abha",
        icon: QrCode,
        badge: "M3 Certified",
        badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      },
      {
        name: "Teleconsultation Clinic",
        href: "/teleconsultation",
        icon: Video,
        badge: "Video Call",
        badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      },
    ],
  },
  {
    title: "PATIENT MANAGEMENT",
    items: [
      { name: "Patients 360 List", href: "/patients", icon: Users },
      {
        name: "Patient Referrals",
        href: "/referrals",
        icon: Share2,
        badge: "Network",
        badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
      },
      { name: "Register Patient", href: "/patients/new", icon: UserPlus },
    ],
  },
  {
    title: "APPOINTMENTS & OPD",
    items: [
      { name: "Appointments Desk", href: "/appointments", icon: Calendar },
      { name: "OPD Queue Live", href: "/opd", icon: Stethoscope, badge: "Active" },
      { name: "Doctor Schedules", href: "/appointments/schedule", icon: Clock },
    ],
  },
  {
    title: "INPATIENT & BEDS",
    items: [
      { name: "IPD Admissions & Discharge", href: "/ipd", icon: Hotel },
      { name: "Bed Matrix Live", href: "/beds", icon: Bed },
    ],
  },
  {
    title: "DEPARTMENTS & DOCTORS",
    items: [
      { name: "16+ Departments", href: "/departments", icon: Building2, badge: "16 Wings" },
      { name: "Doctor Directory", href: "/doctors", icon: Stethoscope },
      { name: "Staff Management", href: "/staff", icon: UserCog },
      { name: "My Profile & Practice", href: "/profile", icon: UserCheck },
    ],
  },
  {
    title: "PHARMACY & RX",
    items: [
      { name: "Prescriptions", href: "/prescriptions", icon: FileText },
      { name: "Pharmacy & Medicines", href: "/pharmacy", icon: Pill },
    ],
  },
  {
    title: "DIAGNOSTICS & IMAGING",
    items: [
      { name: "Pathology Lab", href: "/laboratory", icon: FlaskConical },
      { name: "Radiology & Imaging", href: "/radiology", icon: ScanLine },
    ],
  },
  {
    title: "BILLING & TPA CLAIMS",
    items: [
      { name: "Invoices & TPA Claims", href: "/billing", icon: Receipt },
      { name: "Financial Analytics", href: "/reports?type=financial", icon: BarChart3 },
    ],
  },
  {
    title: "OPERATIONS & SYSTEM",
    items: [
      { name: "Inventory & Procurement", href: "/inventory", icon: Package },
      { name: "Hospital Reports", href: "/reports", icon: BarChart3 },
      {
        name: "Security Audit Logs",
        href: "/audit-logs",
        icon: ShieldAlert,
        badge: "Admin",
        badgeColor: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      },
      { name: "Hospital Settings", href: "/settings", icon: Settings },
    ],
  },
];

const patientNavigationGroups: NavGroup[] = [
  {
    title: "PATIENT PORTAL",
    items: [
      { name: "My Health Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
      { name: "My Appointments & Booking", href: "/patient/appointments", icon: Calendar },
      { name: "My Prescriptions", href: "/patient/prescriptions", icon: FileText },
      { name: "My Lab & Radiology Reports", href: "/patient/reports", icon: FlaskConical },
      { name: "My Medical Records", href: "/patient/records", icon: FolderHeart },
      { name: "My Bills & Invoices", href: "/patient/invoices", icon: CreditCard },
      { name: "My Profile & Details", href: "/patient/profile", icon: UserCheck },
    ],
  },
  {
    title: "CONNECTED SERVICES",
    items: [
      {
        name: "🧠 AI Health Assistant",
        href: "/ai-assistant",
        icon: Sparkles,
        badge: "AI 2.0",
        badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      },
      {
        name: "ABHA Health Card (ABDM)",
        href: "/abha",
        icon: QrCode,
        badge: "Govt ID",
        badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      },
      {
        name: "Doctor Teleconsultation",
        href: "/teleconsultation",
        icon: Video,
        badge: "Live Call",
        badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      },
      { name: "Public Hospital Website", href: "/", icon: Globe },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, isPatient, isAdmin } = useAuth();

  // Pick navigation structure based on role
  let navGroupsToRender: NavGroup[] = [];

  if (isPatient) {
    navGroupsToRender = patientNavigationGroups;
  } else if (isAdmin) {
    navGroupsToRender = allHospitalNavigationGroups;
  } else {
    // Filter hospital groups for specific staff role
    navGroupsToRender = allHospitalNavigationGroups
      .map((group) => {
        const filteredItems = group.items.filter((item) => {
          if (item.href === "/") return true;
          return canAccessRoute(role, item.href);
        });
        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0);

    // Prepend role dashboard if not present in main list
    const roleDashboardUrl = getDefaultDashboard(role);
    if (roleDashboardUrl && roleDashboardUrl !== "/dashboard") {
      const roleName = ROLE_LABELS[role] || "Staff";
      const dashboardItem: NavItem = {
        name: `${roleName} Dashboard`,
        href: roleDashboardUrl,
        icon: LayoutDashboard,
        badge: "Active Role",
        badgeColor: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
      };

      navGroupsToRender = [
        {
          title: "ROLE WORKSPACE",
          items: [dashboardItem],
        },
        ...navGroupsToRender,
      ];
    }
  }

  const brandLink = isPatient ? "/patient/dashboard" : getDefaultDashboard(role);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
          <Link href={brandLink} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-md shadow-brand-500/20">
              <HeartPulse className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Medi<span className="text-brand-600 dark:text-brand-400">Pulse</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {isPatient ? "Patient Portal" : "Hospital System"}
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role identification banner */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-900 dark:text-white">
              {ROLE_LABELS[role] || "User"}:
            </span>
            <span className="truncate">{user?.name || "Dr. Alexander Wright"}</span>
          </div>
        </div>

        {/* Navigation scrollable items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 custom-scrollbar">
          {navGroupsToRender.map((group, groupIdx) => (
            <div key={groupIdx}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="mt-1.5 space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/patient/dashboard" &&
                      item.href !== "/" &&
                      !item.href.includes("?") &&
                      pathname.startsWith(item.href));

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      onClick={() => {
                        if (typeof window !== "undefined" && window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150",
                        isActive
                          ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950/60 dark:text-brand-300 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive
                              ? "text-brand-600 dark:text-brand-400"
                              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          )}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            item.badgeColor ||
                            "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Support Info */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="rounded-xl bg-gradient-to-br from-brand-500/10 to-teal-500/10 p-3 text-center border border-brand-500/20">
            <p className="text-xs font-bold text-brand-900 dark:text-brand-200">
              Emergency Hotline 24x7
            </p>
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
              +91 1800-911-0000
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
