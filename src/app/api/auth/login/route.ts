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
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");

      return response;
    }

    const loginId = (identifier || email || "").trim();

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "Official Email or Employee ID and password are required." },
        { status: 400 }
      );
    }

    // Escape regex special characters
    const escapedId = loginId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let query: any;
    if (loginId.includes("@")) {
      query = { email: loginId.toLowerCase() };
    } else {
      query = {
        $or: [
          { employeeId: { $regex: new RegExp(`^${escapedId}$`, "i") } },
          { phone: loginId },
          { email: loginId.toLowerCase() },
        ],
      };
    }

    // Search user
    let user = await User.findOne(query);

    // If not found and identifier is not an email, check Staff/Doctor collections or known demo IDs
    if (!user && !loginId.includes("@")) {
      const Staff = (await import("@/models/Staff")).default;
      const Doctor = (await import("@/models/Doctor")).default;
      
      const staffDoc = await Staff.findOne({
        staffId: { $regex: new RegExp(`^${escapedId}$`, "i") },
      });
      const doctorDoc = !staffDoc ? await Doctor.findOne({
        doctorId: { $regex: new RegExp(`^${escapedId}$`, "i") },
      }) : null;

      let foundEmail = staffDoc?.email || doctorDoc?.email;

      // Demo mapping fallback for legacy unseeded IDs
      if (!foundEmail) {
        const demoMap: Record<string, string> = {
          "stf-admin-01": "admin@hospital.com",
          "doc-2026-001": "doctor@hospital.com",
          "doc-1001": "doctor@hospital.com",
          "doc-101": "doctor@hospital.com",
          "stf-102": "receptionist@hospital.com",
          "stf-103": "nurse@hospital.com",
          "stf-104": "pharmacist@hospital.com",
          "stf-105": "lab@hospital.com",
          "stf-106": "billing@hospital.com",
          "stf-107": "radiology@hospital.com",
          "pat-8001": "patient@hospital.com",
        };
        foundEmail = demoMap[loginId.toLowerCase()];
      }

      if (foundEmail) {
        user = await User.findOne({ email: foundEmail.toLowerCase() });
        if (user && !user.employeeId) {
          user.employeeId = loginId.toUpperCase();
          await user.save();
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your official email / Employee ID and password." },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status && user.status.toLowerCase() !== "active") {
      return NextResponse.json(
        {
          error:
            "Your staff account is currently inactive or suspended. Please contact the hospital administrator.",
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
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
