import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import HospitalSetting from "@/models/HospitalSetting";

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await HospitalSetting.findOne();
    if (!settings) {
      settings = await HospitalSetting.create({
        hospitalName: "MediPulse Hospital & Medical Institute",
        tagline: "World-Class Compassionate Healthcare & Research",
        email: "info@medipulsehospital.com",
        phone: "+1 (800) 456-7890",
        emergencyHotline: "+1 (800) 911-0000",
        address: "742 Healthcare Avenue, Medical District",
        city: "Metropolis",
        state: "NY",
        zipCode: "10001",
        taxId: "TX-MED-883921",
        currencySymbol: "$",
        timezone: "America/New_York",
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const settings = await HospitalSetting.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
