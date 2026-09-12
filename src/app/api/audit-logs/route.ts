import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, "SUPER_ADMIN", "ADMIN");
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get("module");
    const action = searchParams.get("action");
    const userFilter = searchParams.get("user");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: any = {};
    if (moduleName && moduleName !== "All") query.module = moduleName;
    if (action && action !== "All") query.action = action;
    if (userFilter && userFilter !== "All") query.userName = { $regex: userFilter, $options: "i" };
    if (search) {
      query.$or = [
        { details: { $regex: search, $options: "i" } },
        { recordId: { $regex: search, $options: "i" } },
        { recordTitle: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
