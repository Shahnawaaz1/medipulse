import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import { normalizeRole } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select("-password");
    if (!user) {
      return NextResponse.json({ authenticated: false, error: "User not found" }, { status: 404 });
    }

    // Check account status
    if (user.status && user.status.toLowerCase() !== "active") {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Account is inactive or suspended. Please contact administrator.",
        },
        { status: 403 }
      );
    }

    const standardRole = normalizeRole(user.role);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: standardRole,
        employeeId: user.employeeId,
        patientId: user.patientId,
        department: user.department,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
