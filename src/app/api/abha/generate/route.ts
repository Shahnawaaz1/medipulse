import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AbhaCard } from "@/models/AbhaCard";
import { Patient } from "@/models/Patient";

// Generate OTP for Aadhaar or Mobile verification
export async function POST(request: Request) {
  try {
    const { identifierType, identifierValue } = await request.json();

    if (!identifierValue) {
      return NextResponse.json(
        { success: false, error: "Identification number is required" },
        { status: 400 }
      );
    }

    // In production ABDM gateway, this calls ABDM sandbox API: /v1/registration/aadhaar/generateOtp
    // We return a real simulated transaction ID and OTP
    const txnId = "TXN-ABDM-" + Math.floor(100000 + Math.random() * 900000);
    const mockOtp = "789123"; // Test OTP for immediate testing

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to registered mobile number ending with ***${identifierValue.slice(-4)}`,
      txnId,
      demoOtp: mockOtp, // Provided for 1-click test fill
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
