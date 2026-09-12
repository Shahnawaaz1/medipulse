import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Patient from "@/models/Patient";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { getDefaultDashboard } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      gender = "Other",
      dob = "1995-01-01",
      bloodGroup = "O+",
      address = "New Delhi",
      city = "Delhi NCR",
    } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: "Full Name, Email, Phone number, and Password are required." },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Calculate age from DOB
    let age = 30;
    try {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear)) {
        age = Math.max(1, currentYear - birthYear);
      }
    } catch {
      age = 30;
    }

    // Generate unique Patient ID
    const count = await Patient.countDocuments();
    const patientId = `PAT-${8000 + count + 1}`;

    // Create Patient Profile
    const newPatient = await Patient.create({
      patientId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      gender: ["Male", "Female", "Other"].includes(gender) ? gender : "Other",
      dob,
      age,
      bloodGroup: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bloodGroup)
        ? bloodGroup
        : "O+",
      address: address.trim() || "Local City",
      city: city.trim() || "Delhi NCR",
      emergencyContact: {
        name: name.trim(),
        relationship: "Self",
        phone: phone.trim(),
      },
      status: "Active",
    });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User Account - strictly force role to PATIENT
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "PATIENT",
      phone: phone.trim(),
      patientId: newPatient.patientId,
      status: "active",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });

    // Sign JWT token
    const token = signToken({
      userId: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: "PATIENT",
      patientId: newPatient.patientId,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Patient account registered successfully!",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: "PATIENT",
          patientId: newPatient.patientId,
          avatar: newUser.avatar,
        },
        patient: newPatient,
        defaultDashboard: getDefaultDashboard("PATIENT"),
        token,
      },
      { status: 201 }
    );

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
    console.error("Patient Registration API error:", error);
    return NextResponse.json(
      { error: error.message || "Patient registration failed. Please try again." },
      { status: 500 }
    );
  }
}
