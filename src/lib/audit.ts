import { NextRequest } from "next/server";
import connectToDatabase from "./db";
import AuditLog from "@/models/AuditLog";
import { getUserFromRequest } from "./auth";
import { AuditAction, AuditModule } from "@/types";

export interface LogAuditOptions {
  action: AuditAction | string;
  module: AuditModule | string;
  recordId?: string;
  recordTitle?: string;
  details: string;
  diffSummary?: string;
  status?: "SUCCESS" | "WARNING" | "FAILED";
  customUser?: {
    userId?: string;
    userName: string;
    userRole: string;
  };
}

export async function logAudit(req: NextRequest | null, options: LogAuditOptions) {
  try {
    await connectToDatabase();

    let userName = options.customUser?.userName || "System";
    let userRole = options.customUser?.userRole || "SYSTEM";
    let userId = options.customUser?.userId;

    let ipAddress = "127.0.0.1";
    let userAgent = "Unknown";

    if (req) {
      const user = getUserFromRequest(req);
      if (user) {
        userName = user.name || userName;
        userRole = user.role || userRole;
        userId = user.userId || userId;
      }

      ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      userAgent = req.headers.get("user-agent") || "Web Client";
    }

    await AuditLog.create({
      userId,
      userName,
      userRole,
      action: options.action,
      module: options.module,
      recordId: options.recordId,
      recordTitle: options.recordTitle,
      details: options.details,
      diffSummary: options.diffSummary,
      ipAddress,
      userAgent,
      status: options.status || "SUCCESS",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
