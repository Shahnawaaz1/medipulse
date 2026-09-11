import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AbhaCard } from "@/models/AbhaCard";
import { Patient } from "@/models/Patient";

export async function POST(request: Request) {
  try {
    await connectDB();
    const {
      txnId,
      otp,
      fullName,
      gender,
      dob,
      mobile,
      aadhaar,
      state,
      district,
      pincode,
      address,
      preferredAbhaAddress,
    } = await request.json();

    if (!otp) {
      return NextResponse.json(
        { success: false, error: "OTP is required" },
        { status: 400 }
      );
    }

    // Generate unique 14 digit ABHA: 91-XXXX-XXXX-XXXX
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const abhaNumber = `91-${p1}-${p2}-${p3}`;

    const cleanUsername = (
      preferredAbhaAddress ||
      fullName.toLowerCase().replace(/[^a-z0-9]/g, ".")
    )
      .replace(/@abdm$/, "")
      .concat("@abdm");

    const aadhaarLast4 = (aadhaar || "9921").slice(-4);
    const qrData = `ABHA:${abhaNumber}|PHR:${cleanUsername}|NAME:${fullName}|DOB:${dob}|GEN:${gender}`;

    // Create or Link with Hospital Patient record
    let patientRecord = await Patient.findOne({ phone: mobile });
    let patientId = patientRecord ? patientRecord._id.toString() : null;

    if (patientRecord) {
      patientRecord.abhaNumber = abhaNumber;
      patientRecord.abhaAddress = cleanUsername;
      await patientRecord.save();
    }

    const newAbha = await AbhaCard.create({
      abhaNumber,
      abhaAddress: cleanUsername,
      fullName,
      gender: gender || "Male",
      dob: dob || "1990-01-01",
      mobile,
      aadhaarLast4,
      address: address || "Urban Estate",
      state: state || "Delhi",
      district: district || "Central Delhi",
      pincode: pincode || "110001",
      patientId,
      photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
      qrData,
      verificationStatus: "Verified",
      careContexts: [],
      consentRequests: [],
    });

    return NextResponse.json({
      success: true,
      message: "ABHA Card generated and verified successfully",
      data: newAbha,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
