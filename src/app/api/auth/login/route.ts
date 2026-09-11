import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, password, roleQuickSwitch } = await req.json();

    // If quick switch is requested (for demo testing convenience)
    if (roleQuickSwitch) {
      const user = await User.findOne({ role: roleQuickSwitch });
      if (!user) {
        return NextResponse.json(
          { error: `No user found with role ${roleQuickSwitch}` },
          { status: 404 }
        );
      }

      const token = signToken({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
        },
        token,
      });

      response.cookies.set("hms_auth_token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      },
      token,
    });

    response.cookies.set("hms_auth_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
