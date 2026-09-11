import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Doctor } from "@/models/Doctor";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "doctor@hospital.com";

    const user = await User.findOne({ email }).select("-password");
    const doctor = await Doctor.findOne({ email });

    return NextResponse.json({
      success: true,
      data: {
        user,
        doctor,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, ...updateFields } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        name: updateFields.name,
        phone: updateFields.phone,
        department: updateFields.department,
        digitalSignature: updateFields.digitalSignature,
        mciRegistrationNumber: updateFields.mciNumber || updateFields.mciRegistrationNumber,
        qualification: updateFields.qualification,
        bio: updateFields.bio,
      },
      { new: true }
    );

    // If doctor, also update Doctor collection
    const updatedDoctor = await Doctor.findOneAndUpdate(
      { email },
      {
        name: updateFields.name,
        phone: updateFields.phone,
        department: updateFields.department,
        specialization: updateFields.specialization,
        qualification: updateFields.qualification,
        consultationFee: updateFields.consultationFee,
        emergencyFee: updateFields.emergencyFee,
        teleconsultationFee: updateFields.teleconsultationFee,
        roomNumber: updateFields.roomNumber,
        mciNumber: updateFields.mciNumber,
        digitalSignature: updateFields.digitalSignature,
        bio: updateFields.bio,
        slotDurationMinutes: updateFields.slotDurationMinutes,
        availableDays: updateFields.availableDays,
        workingHours: updateFields.workingHours,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Profile and practice settings updated successfully",
      data: {
        user: updatedUser,
        doctor: updatedDoctor,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
