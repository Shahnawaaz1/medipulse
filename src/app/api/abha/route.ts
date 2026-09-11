import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AbhaCard } from "@/models/AbhaCard";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query: any = {};
    if (search) {
      query = {
        $or: [
          { abhaNumber: { $regex: search, $options: "i" } },
          { abhaAddress: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      };
    }

    const abhaCards = await AbhaCard.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: abhaCards });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Check if duplicate ABHA number or address
    const existing = await AbhaCard.findOne({
      $or: [{ abhaNumber: body.abhaNumber }, { abhaAddress: body.abhaAddress }],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "ABHA Number or ABHA Address already registered" },
        { status: 400 }
      );
    }

    const newAbha = await AbhaCard.create(body);
    return NextResponse.json(
      { success: true, message: "ABHA Card created successfully", data: newAbha },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
