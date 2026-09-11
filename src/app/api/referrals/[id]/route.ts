import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Referral } from "@/models/Referral";
import "@/models/Patient";
import "@/models/Doctor";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    let referral = await Referral.findById(id)
      .populate("patient")
      .populate("referringDoctor");

    if (!referral) {
      referral = await Referral.findOne({ referralId: id })
        .populate("patient")
        .populate("referringDoctor");
    }

    if (!referral) {
      return NextResponse.json(
        { success: false, error: "Referral record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: referral });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    const updated = await Referral.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient")
      .populate("referringDoctor");

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Referral updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    const updated = await Referral.findByIdAndUpdate(
      id,
      { status: "Cancelled" },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Referral cancelled successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
