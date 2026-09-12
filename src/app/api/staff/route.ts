import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Staff from "@/models/Staff";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { normalizeRole } from "@/lib/permissions";
import { getUserFromRequest, requireRole, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "";
    const department = searchParams.get("department") || "";
    const search = searchParams.get("search") || "";

    const query: any = {};
    if (role) {
      const norm = normalizeRole(role);
      query.$or = [{ role: norm }, { role: norm.toLowerCase() }, { role }];
    }
    if (department) query.department = department;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { staffId: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { department: { $regex: escaped, $options: "i" } },
        { designation: { $regex: escaped, $options: "i" } },
      ];
    }

    const staffList = await Staff.find(query).sort({ createdAt: -1, name: 1 });
    return NextResponse.json({ success: true, staff: staffList });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Unable to load staff records. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: currentUser, errorResponse } = requireRole(req, "SUPER_ADMIN", "ADMIN");
    if (errorResponse) return errorResponse;

    await connectToDatabase();

    const body = await req.json();
    const {
      name,
      email,
      phone,
      role = "NURSE",
      department = "General Medicine",
      designation = "Staff",
      salary = 50000,
      status = "Active",
      password = "password123",
      employeeId,
      joiningDate = new Date().toISOString().split("T")[0],
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required" },
        { status: 400 }
      );
    }

    const standardRole = normalizeRole(role);
    if (standardRole === "PATIENT") {
      return NextResponse.json(
        { error: "Cannot create a patient from the Staff Management console." },
        { status: 400 }
      );
    }

    // Auto-generate employee/staff ID if not provided
    let staffId = employeeId ? employeeId.trim() : "";
    if (!staffId) {
      const count = await Staff.countDocuments();
      staffId = `STF-${100 + count + 1}`;
    }

    // Check if staff email or staff ID exists
    const existingStaff = await Staff.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { staffId }],
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: `Staff member with email '${email}' or ID '${staffId}' already exists.` },
        { status: 409 }
      );
    }

    // Create Staff Document
    const staff = await Staff.create({
      staffId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role: standardRole,
      department: department.trim(),
      designation: designation.trim(),
      joiningDate,
      salary: Number(salary) || 50000,
      status: status === "Active" || status === "active" ? "Active" : "Inactive",
    });

    // Create or Link User Auth Account
    const hashedPassword = await bcrypt.hash(password || "password123", 10);
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      existingUser.role = standardRole;
      existingUser.employeeId = staffId;
      existingUser.department = department;
      existingUser.status = status.toLowerCase() === "active" ? "active" : "inactive";
      await existingUser.save();
    } else {
      await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: standardRole,
        employeeId: staffId,
        department: department.trim(),
        phone: phone.trim(),
        status: status.toLowerCase() === "active" ? "active" : "inactive",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Staff account for ${name} (${standardRole}) created successfully.`,
        staff,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Staff creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create staff" }, { status: 400 });
  }
}
