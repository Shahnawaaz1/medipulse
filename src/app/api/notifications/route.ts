import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    await connectToDatabase();
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ read: false });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (body.markAllRead) {
      await Notification.updateMany({}, { read: true });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (body.id) {
      await Notification.findByIdAndUpdate(body.id, { read: true });
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
