import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HealthPackage } from "@/models/HealthPackage";

export async function GET() {
  try {
    await connectDB();
    const packages = await HealthPackage.find({ status: "Active" }).sort({
      popular: -1,
      price: 1,
    });
    return NextResponse.json({ success: true, data: packages });
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
    const newPkg = await HealthPackage.create(body);
    return NextResponse.json(
      { success: true, message: "Package created", data: newPkg },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
