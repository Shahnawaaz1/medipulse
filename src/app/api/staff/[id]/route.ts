import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Staff from "@/models/Staff";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { normalizeRole } from "@/lib/permissions";
import { requireRole } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: currentUser, errorResponse } = requireRole(req, "SUPER_ADMIN", "ADMIN");
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { id } = params;
    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff record not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: currentUser, errorResponse } = requireRole(req, "SUPER_ADMIN", "ADMIN");
    if (errorResponse) return errorResponse;

    await connectToDatabase();

    const { id } = params;
    const body = await req.json();
    const {
      name,
      phone,
      role,
      department,
      designation,
      salary,
      status,
      password,
    } = body;

    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (name) staff.name = name;
    if (phone) staff.phone = phone;
    if (department) staff.department = department;
    if (designation) staff.designation = designation;
    if (salary !== undefined) staff.salary = Number(salary);
    if (status) staff.status = status;

    let standardRole = staff.role;
    if (role) {
      standardRole = normalizeRole(role);
      staff.role = standardRole;
    }

    await staff.save();

    // Sync corresponding User account
    const user = await User.findOne({
      $or: [{ email: staff.email.toLowerCase() }, { employeeId: staff.staffId }],
    });

    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (department) user.department = department;
      if (role) user.role = standardRole;
      if (status) {
        user.status =
          status.toLowerCase() === "active" ? "active" : "inactive";
      }
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
      staff,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: currentUser, errorResponse } = requireRole(req, "SUPER_ADMIN", "ADMIN");
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { id } = params;
    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Set staff and user status to Inactive/Terminated
    staff.status = "Terminated";
    await staff.save();

    const user = await User.findOne({
      $or: [{ email: staff.email.toLowerCase() }, { employeeId: staff.staffId }],
    });
    if (user) {
      user.status = "inactive";
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Staff account deactivated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
