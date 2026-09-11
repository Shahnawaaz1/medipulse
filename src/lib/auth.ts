import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_hospital_management_jwt_key_2026";

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
