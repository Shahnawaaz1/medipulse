import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      // Default to Super Admin for seamless development experience if no token present
      await connectToDatabase();
      const admin = await User.findOne({ role: "super_admin" });
      if (admin) {
        return NextResponse.json({
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            department: admin.department,
            avatar: admin.avatar,
          },
        });
      }
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
