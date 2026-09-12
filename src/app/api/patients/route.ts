import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Patient from "@/models/Patient";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getUserFromRequest, getPatientScope } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const gender = searchParams.get("gender") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const status = searchParams.get("status") || "";

    const patientScope = getPatientScope(req);
    const query: any = {};

    // Patient Data Isolation: A patient can ONLY fetch their own patient record
    if (patientScope.isPatient) {
      if (patientScope.patientId) {
        query.patientId = patientScope.patientId;
      } else if (patientScope.patientEmail) {
        query.email = patientScope.patientEmail.toLowerCase();
      } else {
        return NextResponse.json({ success: true, patients: [] });
      }
    } else {
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { patientId: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      if (gender) query.gender = gender;
      if (bloodGroup) query.bloodGroup = bloodGroup;
      if (status) query.status = status;
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Auto-generate patient ID if missing
    if (!body.patientId) {
      const count = await Patient.countDocuments();
      body.patientId = `PAT-${8000 + count + 1}`;
    }

    const newPatient = await Patient.create(body);

    // If registered by staff and has email, ensure User portal account exists
    if (body.email && body.createPortalAccount) {
      const existing = await User.findOne({ email: body.email.toLowerCase() });
      if (!existing) {
        const hashedPassword = await bcrypt.hash("Patient@123", 10);
        await User.create({
          name: body.name,
          email: body.email.toLowerCase(),
          password: hashedPassword,
          role: "PATIENT",
          phone: body.phone,
          patientId: newPatient.patientId,
          status: "active",
        });
      }
    }

    return NextResponse.json({ success: true, patient: newPatient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
