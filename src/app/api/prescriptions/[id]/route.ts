import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Prescription from "@/models/Prescription";
import HospitalSetting from "@/models/HospitalSetting";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const prescription = await Prescription.findById(params.id).populate("patient doctor");
    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    const hospitalSetting = (await HospitalSetting.findOne()) || {
      hospitalName: "MediPulse Hospital",
      tagline: "World-Class Healthcare",
      phone: "+1 800-456-7890",
      address: "742 Healthcare Avenue",
    };

    return NextResponse.json({ success: true, prescription, hospitalSetting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const updated = await Prescription.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor");

    return NextResponse.json({ success: true, prescription: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    await Prescription.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Prescription deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
