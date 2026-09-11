import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { StandardRole, UserRole } from "@/types";
import { normalizeRole, hasPermission, Permission } from "./permissions";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_hospital_management_jwt_key_2026";

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: StandardRole | UserRole;
  employeeId?: string;
  patientId?: string;
  department?: string;
}

export function signToken(payload: TokenPayload): string {
  const normRole = normalizeRole(payload.role);
  return jwt.sign({ ...payload, role: normRole }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return {
      ...decoded,
      role: normalizeRole(decoded.role),
    };
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): TokenPayload | null {
  // Check Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  // Check cookies
  const cookieToken = req.cookies.get("hms_auth_token")?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

export function requireAuth(req: NextRequest): { user: TokenPayload | null; errorResponse: NextResponse | null } {
  const user = getUserFromRequest(req);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }
  return { user, errorResponse: null };
}

export function requireRole(
  req: NextRequest,
  ...allowedRoles: (StandardRole | UserRole)[]
): { user: TokenPayload | null; errorResponse: NextResponse | null } {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) {
    return { user: null, errorResponse };
  }

  const normUserRole = normalizeRole(user.role);
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

  // Super Admin can access all
  if (normUserRole === "SUPER_ADMIN") {
    return { user, errorResponse: null };
  }

  if (!normalizedAllowed.includes(normUserRole)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Access Denied: You do not have the required permissions for this resource.",
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

export function requirePermission(
  req: NextRequest,
  permission: Permission
): { user: TokenPayload | null; errorResponse: NextResponse | null } {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) {
    return { user: null, errorResponse };
  }

  if (!hasPermission(user.role, permission)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Access Denied: Missing '${permission}' permission.`,
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

export function getPatientScope(req: NextRequest): { isPatient: boolean; patientId?: string; patientEmail?: string } {
  const user = getUserFromRequest(req);
  if (!user) return { isPatient: false };

  const norm = normalizeRole(user.role);
  if (norm === "PATIENT") {
    return {
      isPatient: true,
      patientId: user.patientId,
      patientEmail: user.email,
    };
  }

  return { isPatient: false };
}
