import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { getDefaultDashboard, normalizeRole } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, identifier, password, roleQuickSwitch } = body;

    // Optional demo helper switch
    if (roleQuickSwitch) {
      const normRole = normalizeRole(roleQuickSwitch);
      const user = await User.findOne({
        $or: [
          { role: normRole },
          { role: normRole.toLowerCase() },
          { role: roleQuickSwitch },
        ],
      });

      if (!user) {
        return NextResponse.json(
          { error: `No user found with role ${roleQuickSwitch}` },
          { status: 404 }
        );
      }

      if (user.status && user.status.toLowerCase() !== "active") {
        return NextResponse.json(
          { error: "Your account is currently inactive. Please contact the hospital administrator." },
          { status: 403 }
        );
      }

      const standardRole = normalizeRole(user.role);
      const token = signToken({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: standardRole,
        employeeId: user.employeeId,
        patientId: user.patientId,
        department: user.department,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: standardRole,
          employeeId: user.employeeId,
          patientId: user.patientId,
          department: user.department,
          avatar: user.avatar,
        },
        defaultDashboard: getDefaultDashboard(standardRole),
        token,
      });

      response.cookies.set("hms_auth_token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    const loginId = (identifier || email || "").trim();

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "Login identifier (Email, Employee ID, or Phone) and password are required" },
        { status: 400 }
      );
    }

    // Search user by email, employee ID, or phone
    const user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase() },
        { employeeId: { $regex: new RegExp(`^${loginId}$`, "i") } },
        { phone: loginId },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email/ID and password." },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status && user.status.toLowerCase() !== "active") {
      return NextResponse.json(
        {
          error:
            "Your account is currently inactive or suspended. Please contact the hospital administrator.",
        },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email/ID and password." },
        { status: 401 }
      );
    }

    const standardRole = normalizeRole(user.role);
    const token = signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: standardRole,
      employeeId: user.employeeId,
      patientId: user.patientId,
      department: user.department,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: standardRole,
        employeeId: user.employeeId,
        patientId: user.patientId,
        department: user.department,
        avatar: user.avatar,
      },
      defaultDashboard: getDefaultDashboard(standardRole),
      token,
    });

    response.cookies.set("hms_auth_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
