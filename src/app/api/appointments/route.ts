import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";
import Notification from "@/models/Notification";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";
    const doctorId = searchParams.get("doctor") || "";
    const status = searchParams.get("status") || "";
    const patientId = searchParams.get("patient") || "";

    const query: any = {};
    if (date) query.appointmentDate = date;
    if (doctorId) query.doctor = doctorId;
    if (status) query.status = status;
    if (patientId) query.patient = patientId;

    const appointments = await Appointment.find(query)
      .populate("patient")
      .populate("doctor")
      .sort({ appointmentDate: -1, timeSlot: 1 });

    return NextResponse.json({ success: true, appointments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Check for double booking with same doctor, date and time slot
    const existing = await Appointment.findOne({
      doctor: body.doctor,
      appointmentDate: body.appointmentDate,
      timeSlot: body.timeSlot,
      status: { $nin: ["Cancelled", "No Show"] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This time slot is already booked for the selected doctor. Please choose a different slot." },
        { status: 409 }
      );
    }

    if (!body.appointmentId) {
      const count = await Appointment.countDocuments();
      body.appointmentId = `APT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
    }

    const newAppointment = await Appointment.create(body);
    const populated = await Appointment.findById(newAppointment._id).populate("patient doctor");

    // Create system notification
    const patientDoc = await Patient.findById(body.patient);
    const doctorDoc = await Doctor.findById(body.doctor);
    await Notification.create({
      title: "New Appointment Booked",
      message: `${patientDoc ? patientDoc.name : "Patient"} booked with ${doctorDoc ? doctorDoc.name : "Doctor"} on ${body.appointmentDate} (${body.timeSlot}).`,
      type: "info",
      link: "/appointments",
      read: false,
    });

    return NextResponse.json({ success: true, appointment: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
