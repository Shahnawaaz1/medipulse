import { StandardRole, UserRole } from "@/types";

export type Permission =
  | "ALL"
  | "MANAGE_STAFF"
  | "VIEW_STAFF"
  | "MANAGE_SETTINGS"
  | "VIEW_SETTINGS"
  | "MANAGE_DEPARTMENTS"
  | "VIEW_DEPARTMENTS"
  | "MANAGE_DOCTORS"
  | "VIEW_DOCTORS"
  | "VIEW_FINANCIAL_ANALYTICS"
  | "MANAGE_INVOICES"
  | "VIEW_INVOICES"
  | "MANAGE_PATIENTS"
  | "VIEW_PATIENTS"
  | "REGISTER_PATIENT"
  | "MANAGE_APPOINTMENTS"
  | "VIEW_APPOINTMENTS"
  | "MANAGE_OPD"
  | "VIEW_OPD"
  | "MANAGE_IPD"
  | "VIEW_IPD"
  | "MANAGE_BEDS"
  | "VIEW_BEDS"
  | "MANAGE_PRESCRIPTIONS"
  | "VIEW_PRESCRIPTIONS"
  | "MANAGE_PHARMACY"
  | "VIEW_PHARMACY"
  | "MANAGE_LAB"
  | "VIEW_LAB"
  | "MANAGE_RADIOLOGY"
  | "VIEW_RADIOLOGY"
  | "MANAGE_INVENTORY"
  | "VIEW_INVENTORY"
  | "MANAGE_EMERGENCY"
  | "VIEW_EMERGENCY"
  | "MANAGE_ICU"
  | "VIEW_ICU"
  | "MANAGE_OT"
  | "VIEW_OT"
  | "MANAGE_NURSING"
  | "VIEW_NURSING"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_PROCUREMENT"
  | "VIEW_PROCUREMENT"
  | "USE_AI_ASSISTANT"
  | "USE_TELECONSULTATION"
  | "USE_ABHA"
  | "ACCESS_PATIENT_PORTAL";

export function normalizeRole(role?: string | null): StandardRole {
  if (!role) return "PATIENT";
  const r = role.toUpperCase().trim();
  if (r === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (r === "ADMIN" || r === "HOSPITAL_ADMIN") return "ADMIN";
  if (r === "DOCTOR") return "DOCTOR";
  if (r === "NURSE") return "NURSE";
  if (r === "RECEPTIONIST") return "RECEPTIONIST";
  if (r === "PHARMACIST") return "PHARMACIST";
  if (r === "ACCOUNTANT") return "ACCOUNTANT";
  if (r === "LAB_TECHNICIAN") return "LAB_TECHNICIAN";
  if (r === "RADIOLOGY_TECHNICIAN") return "RADIOLOGY_TECHNICIAN";
  if (r === "STAFF") return "STAFF";
  if (r === "PATIENT") return "PATIENT";

  // Lowercase mappings
  const low = role.toLowerCase().trim();
  if (low === "super_admin") return "SUPER_ADMIN";
  if (low === "hospital_admin" || low === "admin") return "ADMIN";
  if (low === "doctor") return "DOCTOR";
  if (low === "nurse") return "NURSE";
  if (low === "receptionist") return "RECEPTIONIST";
  if (low === "pharmacist") return "PHARMACIST";
  if (low === "accountant") return "ACCOUNTANT";
  if (low === "lab_technician") return "LAB_TECHNICIAN";
  if (low === "radiology_technician") return "RADIOLOGY_TECHNICIAN";
  if (low === "staff") return "STAFF";
  if (low === "patient") return "PATIENT";

  return "PATIENT";
}

export const ROLE_LABELS: Record<StandardRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Hospital Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
  PHARMACIST: "Pharmacist",
  ACCOUNTANT: "Accountant",
  LAB_TECHNICIAN: "Lab Technician",
  RADIOLOGY_TECHNICIAN: "Radiology Technician",
  STAFF: "Hospital Staff",
  PATIENT: "Patient",
};

export const ROLE_PERMISSIONS: Record<StandardRole, Permission[]> = {
  SUPER_ADMIN: ["ALL"],
  ADMIN: ["ALL"],
  STAFF: [
    "VIEW_PATIENTS",
    "VIEW_APPOINTMENTS",
    "VIEW_OPD",
    "VIEW_IPD",
    "VIEW_BEDS",
    "VIEW_DEPARTMENTS",
    "VIEW_DOCTORS",
    "VIEW_EMERGENCY",
    "USE_AI_ASSISTANT",
  ],
  DOCTOR: [
    "VIEW_PATIENTS",
    "VIEW_APPOINTMENTS",
    "MANAGE_APPOINTMENTS",
    "VIEW_OPD",
    "MANAGE_OPD",
    "VIEW_IPD",
    "MANAGE_IPD",
    "VIEW_BEDS",
    "VIEW_DEPARTMENTS",
    "VIEW_DOCTORS",
    "VIEW_PRESCRIPTIONS",
    "MANAGE_PRESCRIPTIONS",
    "VIEW_LAB",
    "VIEW_RADIOLOGY",
    "VIEW_EMERGENCY",
    "MANAGE_EMERGENCY",
    "VIEW_ICU",
    "MANAGE_ICU",
    "VIEW_OT",
    "MANAGE_OT",
    "USE_AI_ASSISTANT",
    "USE_TELECONSULTATION",
    "USE_ABHA",
  ],
  NURSE: [
    "VIEW_PATIENTS",
    "VIEW_APPOINTMENTS",
    "VIEW_OPD",
    "VIEW_IPD",
    "MANAGE_IPD",
    "VIEW_BEDS",
    "MANAGE_BEDS",
    "VIEW_DEPARTMENTS",
    "VIEW_DOCTORS",
    "VIEW_PRESCRIPTIONS",
    "VIEW_LAB",
    "VIEW_RADIOLOGY",
    "VIEW_EMERGENCY",
    "MANAGE_EMERGENCY",
    "VIEW_ICU",
    "MANAGE_ICU",
    "VIEW_OT",
    "VIEW_NURSING",
    "MANAGE_NURSING",
    "USE_AI_ASSISTANT",
    "USE_ABHA",
  ],
  RECEPTIONIST: [
    "VIEW_PATIENTS",
    "REGISTER_PATIENT",
    "MANAGE_PATIENTS",
    "VIEW_APPOINTMENTS",
    "MANAGE_APPOINTMENTS",
    "VIEW_OPD",
    "MANAGE_OPD",
    "VIEW_BEDS",
    "VIEW_DEPARTMENTS",
    "VIEW_DOCTORS",
    "VIEW_EMERGENCY",
    "MANAGE_EMERGENCY",
    "USE_AI_ASSISTANT",
    "USE_ABHA",
  ],
  PHARMACIST: [
    "VIEW_PRESCRIPTIONS",
    "MANAGE_PRESCRIPTIONS",
    "VIEW_PHARMACY",
    "MANAGE_PHARMACY",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "VIEW_PROCUREMENT",
    "USE_AI_ASSISTANT",
  ],
  ACCOUNTANT: [
    "VIEW_INVOICES",
    "MANAGE_INVOICES",
    "VIEW_FINANCIAL_ANALYTICS",
    "VIEW_PATIENTS",
    "VIEW_PROCUREMENT",
    "MANAGE_PROCUREMENT",
    "USE_AI_ASSISTANT",
  ],
  LAB_TECHNICIAN: [
    "VIEW_LAB",
    "MANAGE_LAB",
    "VIEW_PATIENTS",
    "USE_AI_ASSISTANT",
  ],
  RADIOLOGY_TECHNICIAN: [
    "VIEW_RADIOLOGY",
    "MANAGE_RADIOLOGY",
    "VIEW_PATIENTS",
    "USE_AI_ASSISTANT",
  ],
  PATIENT: [
    "ACCESS_PATIENT_PORTAL",
    "USE_AI_ASSISTANT",
  ],
};

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  const norm = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[norm] || [];
  if (permissions.includes("ALL")) return true;
  return permissions.includes(permission);
}

export function isStaffRole(role: string | undefined | null): boolean {
  const norm = normalizeRole(role);
  return norm !== "PATIENT";
}

export function isPatientRole(role: string | undefined | null): boolean {
  const norm = normalizeRole(role);
  return norm === "PATIENT";
}

export function isAdminRole(role: string | undefined | null): boolean {
  const norm = normalizeRole(role);
  return norm === "SUPER_ADMIN" || norm === "ADMIN";
}

export function getDefaultDashboard(role?: string | null): string {
  if (!role) return "/login";
  const norm = normalizeRole(role);
  switch (norm) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/dashboard";
    case "DOCTOR":
      return "/doctor/dashboard";
    case "NURSE":
      return "/nurse/dashboard";
    case "RECEPTIONIST":
      return "/reception/dashboard";
    case "PHARMACIST":
      return "/pharmacy/dashboard";
    case "ACCOUNTANT":
      return "/accounts/dashboard";
    case "LAB_TECHNICIAN":
      return "/lab/dashboard";
    case "RADIOLOGY_TECHNICIAN":
      return "/radiology/dashboard";
    case "STAFF":
      return "/nurse/dashboard";
    case "PATIENT":
      return "/patient/dashboard";
    default:
      return "/login";
  }
}

// Route Access Control Configuration
export function canAccessRoute(role: string | undefined | null, path: string): boolean {
  if (!role) return false;
  const norm = normalizeRole(role);

  // Patient access rules - strictly isolated to patient portal and shared patient features
  if (norm === "PATIENT") {
    if (path === "/patient" || path.startsWith("/patient/")) return true;
    if (path === "/profile") return true;
    if (path === "/teleconsultation") return true;
    if (path === "/abha") return true;
    if (path.startsWith("/ai-assistant")) return true;
    // Allow viewing specific prescriptions, but not the prescriptions list
    if (path.startsWith("/prescriptions/") && path.split("/").length > 2) return true;
    return false;
  }

  // Hospital staff and Admins should NOT access /patient/* portal (they have ERP modules)
  if (path === "/patient" || path.startsWith("/patient/")) return false;

  // Super Admin and Admin can access all ERP routes
  if (norm === "SUPER_ADMIN" || norm === "ADMIN") {
    return true;
  }

  // AI Assistant is accessible to all authenticated staff
  if (path.startsWith("/ai-assistant")) return true;

  // Role specific allowed paths for hospital staff
  switch (norm) {
    case "STAFF":
      return (
        path === "/nurse/dashboard" ||
        path === "/profile" ||
        path.startsWith("/ipd") ||
        path.startsWith("/beds") ||
        path.startsWith("/patients") ||
        path.startsWith("/opd") ||
        path.startsWith("/appointments") ||
        path.startsWith("/emergency") ||
        path.startsWith("/departments")
      );
    case "DOCTOR":
      return (
        path === "/doctor/dashboard" ||
        path === "/profile" ||
        path.startsWith("/appointments") ||
        path.startsWith("/opd") ||
        path.startsWith("/patients") ||
        path.startsWith("/prescriptions") ||
        path.startsWith("/referrals") ||
        path.startsWith("/emergency") ||
        path.startsWith("/icu") ||
        path.startsWith("/ot") ||
        path.startsWith("/teleconsultation") ||
        path.startsWith("/laboratory") ||
        path.startsWith("/radiology") ||
        path.startsWith("/doctors") ||
        path.startsWith("/departments") ||
        path.startsWith("/beds") ||
        path.startsWith("/ipd")
      );

    case "NURSE":
      return (
        path === "/nurse/dashboard" ||
        path === "/profile" ||
        path.startsWith("/ipd") ||
        path.startsWith("/beds") ||
        path.startsWith("/patients") ||
        path.startsWith("/prescriptions") ||
        path.startsWith("/opd") ||
        path.startsWith("/emergency") ||
        path.startsWith("/icu") ||
        path.startsWith("/ot") ||
        path.startsWith("/appointments") ||
        path.startsWith("/departments") ||
        path.startsWith("/doctors") ||
        path.startsWith("/laboratory") ||
        path.startsWith("/radiology") ||
        path.startsWith("/abha")
      );

    case "RECEPTIONIST":
      return (
        path === "/reception/dashboard" ||
        path === "/profile" ||
        path.startsWith("/patients") ||
        path.startsWith("/appointments") ||
        path.startsWith("/opd") ||
        path.startsWith("/emergency") ||
        path.startsWith("/beds") ||
        path.startsWith("/doctors") ||
        path.startsWith("/departments") ||
        path.startsWith("/referrals") ||
        path.startsWith("/abha")
      );

    case "PHARMACIST":
      return (
        path === "/pharmacy/dashboard" ||
        path === "/profile" ||
        path.startsWith("/pharmacy") ||
        path.startsWith("/prescriptions") ||
        path.startsWith("/inventory")
      );

    case "ACCOUNTANT":
      return (
        path === "/accounts/dashboard" ||
        path === "/profile" ||
        path.startsWith("/billing") ||
        path.startsWith("/inventory") ||
        path.startsWith("/reports") ||
        path.startsWith("/patients")
      );

    case "LAB_TECHNICIAN":
      return (
        path === "/lab/dashboard" ||
        path === "/profile" ||
        path.startsWith("/laboratory") ||
        path.startsWith("/patients")
      );

    case "RADIOLOGY_TECHNICIAN":
      return (
        path === "/radiology/dashboard" ||
        path === "/profile" ||
        path.startsWith("/radiology") ||
        path.startsWith("/patients")
      );

    default:
      return false;
  }
}
