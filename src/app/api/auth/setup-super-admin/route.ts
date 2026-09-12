import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Staff from "@/models/Staff";
import HospitalSetting from "@/models/HospitalSetting";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();
    const existingSuperAdmin = await User.findOne({
      role: { $in: ["SUPER_ADMIN", "super_admin"] },
    });

    return NextResponse.json({
      setupAvailable: !existingSuperAdmin,
      hasSuperAdmin: !!existingSuperAdmin,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Security Gate: Ensure no Super Admin already exists
    const existingSuperAdmin = await User.findOne({
      role: { $in: ["SUPER_ADMIN", "super_admin"] },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        {
          error:
            "Initial setup is locked. A Super Admin account is already configured for this hospital.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      hospitalName,
      name,
      email,
      employeeId,
      phone,
      password,
      confirmPassword,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Super Admin Name, Official Email, and Password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match. Please verify your entry." },
        { status: 400 }
      );
    }

    // Check if email or employeeId is already taken by another account
    const cleanEmail = email.toLowerCase().trim();
    const cleanEmpId = (employeeId || "STF-ADMIN-01").trim();

    const emailInUse = await User.findOne({ email: cleanEmail });
    if (emailInUse) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const empIdInUse = await Staff.findOne({ staffId: cleanEmpId });
    if (empIdInUse) {
      return NextResponse.json(
        { error: "This Employee ID is already registered." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Super Admin User Account
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      employeeId: cleanEmpId,
      phone: phone?.trim() || "+1 555-0100",
      department: "Administration",
      status: "active",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
    });

    // Create matching Staff record for administrative directory
    await Staff.create({
      staffId: cleanEmpId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || "+1 555-0100",
      role: "SUPER_ADMIN",
      department: "Administration",
      designation: "Hospital Superintendent & Super Admin",
      joiningDate: new Date().toISOString().split("T")[0],
      salary: 250000,
      status: "Active",
    });

    // Update Hospital Name if provided
    if (hospitalName && hospitalName.trim()) {
      await HospitalSetting.findOneAndUpdate(
        {},
        { hospitalName: hospitalName.trim() },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Super Admin account created successfully. You can now sign in.",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: "SUPER_ADMIN",
          employeeId: cleanEmpId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Super Admin setup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Super Admin account." },
      { status: 500 }
    );
  }
}
