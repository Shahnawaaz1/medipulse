import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";
import Notification from "@/models/Notification";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import { getPatientScope, getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";
    const doctorId = searchParams.get("doctor") || "";
    const status = searchParams.get("status") || "";
    const patientId = searchParams.get("patient") || "";

    const query: any = {};
    const patientScope = getPatientScope(req);

    // Patient Data Isolation
    if (patientScope.isPatient) {
      let patientDoc = null;
      if (patientScope.patientId) {
        patientDoc = await Patient.findOne({ patientId: patientScope.patientId });
      }
      if (!patientDoc && patientScope.patientEmail) {
        patientDoc = await Patient.findOne({ email: patientScope.patientEmail.toLowerCase() });
      }

      if (patientDoc) {
        query.patient = patientDoc._id;
      } else {
        return NextResponse.json({ success: true, appointments: [] });
      }
    } else {
      if (patientId) {
        if (mongoose.Types.ObjectId.isValid(patientId)) {
          query.patient = patientId;
        } else {
          const p = await Patient.findOne({ patientId });
          if (p) query.patient = p._id;
        }
      }
    }

    if (date) query.appointmentDate = date;
    if (doctorId) {
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        query.doctor = doctorId;
      } else {
        const d = await Doctor.findOne({ doctorId });
        if (d) query.doctor = d._id;
      }
    }
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate("patient")
      .populate("doctor")
      .sort({ appointmentDate: -1, timeSlot: 1 });

    return NextResponse.json({ success: true, appointments, data: appointments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // 1. Resolve Patient
    let patientDoc = null;
    const rawPatient = body.patient || body.patientId || body.patient_id;

    if (rawPatient) {
      if (mongoose.Types.ObjectId.isValid(rawPatient)) {
        patientDoc = await Patient.findById(rawPatient);
      }
      if (!patientDoc) {
        patientDoc = await Patient.findOne({
          $or: [
            { patientId: rawPatient },
            { email: String(rawPatient).toLowerCase() },
            { phone: String(rawPatient) },
          ],
        });
      }
    }

    // If patient still not found, check logged-in patient session
    if (!patientDoc) {
      const patientScope = getPatientScope(req);
      if (patientScope.isPatient) {
        if (patientScope.patientId) {
          patientDoc = await Patient.findOne({ patientId: patientScope.patientId });
        }
        if (!patientDoc && patientScope.patientEmail) {
          patientDoc = await Patient.findOne({ email: patientScope.patientEmail.toLowerCase() });
        }
      }
    }

    // If still not found, check if a general patient exists or if patientName was given
    if (!patientDoc) {
      if (body.patientName && body.patientPhone) {
        const count = await Patient.countDocuments();
        const autoPatientId = `PAT-${8000 + count + 1}`;
        patientDoc = await Patient.create({
          patientId: autoPatientId,
          name: body.patientName,
          phone: body.patientPhone,
          gender: body.gender || "Other",
          dob: body.dob || "1995-01-01",
          age: Number(body.age) || 30,
          bloodGroup: body.bloodGroup || "O+",
          address: body.address || "New Delhi",
          city: body.city || "Delhi NCR",
          emergencyContact: {
            name: body.patientName,
            relationship: "Self",
            phone: body.patientPhone,
          },
          status: "Active",
        });
      } else {
        // Fall back to first patient in database if in dev/demo mode
        patientDoc = await Patient.findOne();
      }
    }

    if (!patientDoc) {
      return NextResponse.json(
        { error: "Patient record is required. Please select or register a valid patient." },
        { status: 400 }
      );
    }

    // 2. Resolve Doctor
    let doctorDoc = null;
    const rawDoctor = body.doctor || body.doctorId || body.doctor_id;

    if (rawDoctor) {
      if (mongoose.Types.ObjectId.isValid(rawDoctor)) {
        doctorDoc = await Doctor.findById(rawDoctor);
      }
      if (!doctorDoc) {
        doctorDoc = await Doctor.findOne({
          $or: [
            { doctorId: rawDoctor },
            { email: String(rawDoctor).toLowerCase() },
          ],
        });
      }
    }

    // Fall back to first available doctor if not specified
    if (!doctorDoc) {
      doctorDoc = await Doctor.findOne({ status: "Active" }) || await Doctor.findOne();
    }

    if (!doctorDoc) {
      return NextResponse.json(
        { error: "Doctor is required. Please select an available doctor." },
        { status: 400 }
      );
    }

    // 3. Resolve Department
    const department =
      (body.department || body.departmentName || doctorDoc.department || "General Medicine").trim();

    // 4. Resolve Reason
    const reason = (
      body.reason ||
      body.reasonForVisit ||
      body.appointmentReason ||
      body.symptoms ||
      body.complaint ||
      body.notes ||
      "General Medical Consultation"
    ).trim();

    // 5. Resolve Appointment Date & Time Slot
    const appointmentDate = body.appointmentDate || body.date || new Date().toISOString().split("T")[0];
    const timeSlot = body.timeSlot || body.slot || body.time || "09:00 AM - 09:30 AM";
    const type = body.type || "General";
    const status = body.status || "Scheduled";

    // 6. Check for double booking
    const existing = await Appointment.findOne({
      doctor: doctorDoc._id,
      appointmentDate,
      timeSlot,
      status: { $nin: ["Cancelled", "No Show"] },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `This time slot (${timeSlot}) is already booked for ${doctorDoc.name} on ${appointmentDate}. Please choose a different slot.`,
        },
        { status: 409 }
      );
    }

    // 7. Auto-generate appointment ID
    let appointmentId = body.appointmentId;
    if (!appointmentId) {
      const count = await Appointment.countDocuments();
      appointmentId = `APT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    }

    // 8. Create Appointment
    const newAppointment = await Appointment.create({
      appointmentId,
      patient: patientDoc._id,
      doctor: doctorDoc._id,
      department,
      appointmentDate,
      timeSlot,
      type,
      status,
      reason,
      vitals: body.vitals || {},
      clinicalNotes: body.clinicalNotes || "",
    });

    const populated = await Appointment.findById(newAppointment._id)
      .populate("patient")
      .populate("doctor");

    // 9. Create System Notification
    try {
      await Notification.create({
        title: "New Appointment Booked",
        message: `${patientDoc.name} booked with ${doctorDoc.name} on ${appointmentDate} (${timeSlot}) for ${department}.`,
        type: "info",
        link: "/appointments",
        read: false,
      });
    } catch {
      // ignore notification error
    }

    return NextResponse.json(
      {
        success: true,
        message: "Appointment created successfully!",
        appointment: populated,
        data: populated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Appointment creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create appointment" },
      { status: 400 }
    );
  }
}
