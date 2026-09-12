import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import { normalizeRole } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      const response = NextResponse.json(
        { authenticated: false, user: null, error: "Authentication required. Please sign in." },
        { status: 401 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
    }

    await connectToDatabase();

    // Look up by userId, with fallback to email or employeeId
    let user = null;
    if (payload.userId) {
      try {
        user = await User.findById(payload.userId).select("-password");
      } catch {
        user = null;
      }
    }

    if (!user && (payload.email || payload.employeeId)) {
      const fallbackQuery: any = {};
      const conditions: any[] = [];
      if (payload.email) conditions.push({ email: payload.email.toLowerCase() });
      if (payload.employeeId) conditions.push({ employeeId: payload.employeeId });
      if (conditions.length > 0) {
        fallbackQuery.$or = conditions;
        user = await User.findOne(fallbackQuery).select("-password");
      }
    }

    if (!user) {
      const response = NextResponse.json(
        { authenticated: false, user: null, error: "User session expired or not found. Please sign in." },
        { status: 401 }
      );
      response.cookies.set("hms_auth_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
    }

    // Check account status
    if (user.status && user.status.toLowerCase() !== "active") {
      const response = NextResponse.json(
        {
          authenticated: false,
          user: null,
          error: "Account is inactive or suspended. Please contact administrator.",
        },
        { status: 403 }
      );
      response.cookies.set("hms_auth_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
    }

    const standardRole = normalizeRole(user.role);

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: standardRole,
        employeeId: user.employeeId || "",
        patientId: user.patientId || "",
        department: user.department || "",
        avatar: user.avatar || "",
        phone: user.phone || "",
        status: user.status || "active",
      },
    });

    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } catch (error: any) {
    console.error("Auth /me error:", error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
