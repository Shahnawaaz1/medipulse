import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import TeleconsultationSession from "@/models/TeleconsultationSession";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import Notification from "@/models/Notification";
import { logAudit } from "@/lib/audit";

import { getUserFromRequest, getPatientScope } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("room") || searchParams.get("session");
    const appointmentQuery = searchParams.get("appointment") || searchParams.get("appointmentId");
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const query: any = {};
    if (roomId) query.roomId = roomId;
    if (status && status !== "All") query.sessionStatus = status;

    // Resolve appointment query
    if (appointmentQuery) {
      let aptDoc = null;
      if (appointmentQuery.startsWith("APT-")) {
        aptDoc = await Appointment.findOne({ appointmentId: appointmentQuery });
      } else if (appointmentQuery.length === 24) {
        aptDoc = await Appointment.findById(appointmentQuery);
      }
      if (aptDoc) {
        query.appointment = aptDoc._id;
      }
    }

    const patientScope = getPatientScope(req);
    const user = getUserFromRequest(req);

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
      }
    } else if (user && (user.role === "DOCTOR" || (user as any).role === "doctor")) {
      // Doctor Data Isolation
      if (!doctorId) {
        const docRecord = await Doctor.findOne({
          $or: [
            { email: user.email?.toLowerCase() },
            { name: new RegExp(user.name, "i") },
          ],
        });
        if (docRecord) {
          query.doctor = docRecord._id;
        }
      }
    }

    if (doctorId) query.doctor = doctorId;
    if (patientId && !patientScope.isPatient) query.patient = patientId;

    const sessions = await TeleconsultationSession.find(query)
      .populate("patient", "patientId name age gender phone bloodGroup allergies medicalHistory")
      .populate("doctor", "doctorId name specialization department qualification mciNumber photo consultationFee")
      .populate("appointment")
      .populate("prescription")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error("Teleconsultation GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      roomId,
      appointmentId,
      patientId,
      doctorId,
      role = "Doctor",
      participantName,
    } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Check if active session already exists for this room
    let session = await TeleconsultationSession.findOne({
      roomId,
      sessionStatus: { $ne: "Completed" },
    })
      .populate("patient")
      .populate("doctor")
      .populate("appointment");

    if (session) {
      // Update participant joined state if applicable
      if (role === "Doctor" && session.sessionStatus === "Waiting Room") {
        session.sessionStatus = "Doctor Joined";
        await session.save();
      } else if (role === "Patient" && session.sessionStatus === "Waiting Room") {
        session.sessionStatus = "Patient Joined";
        await session.save();
      } else if (
        (role === "Doctor" && session.sessionStatus === "Patient Joined") ||
        (role === "Patient" && session.sessionStatus === "Doctor Joined")
      ) {
        session.sessionStatus = "In Consultation";
        if (!session.actualStartTime) {
          session.actualStartTime = new Date();
        }
        await session.save();
      }
      return NextResponse.json({ success: true, session });
    }

    // Resolve patient
    let patientObj: any = null;
    if (patientId) {
      patientObj = await Patient.findById(patientId);
      if (!patientObj) {
        patientObj = await Patient.findOne({ patientId });
      }
    }
    if (!patientObj) {
      // Default to first patient
      patientObj = await Patient.findOne().sort({ createdAt: 1 });
    }

    // Resolve doctor
    let doctorObj: any = null;
    if (doctorId) {
      doctorObj = await Doctor.findById(doctorId);
      if (!doctorObj) {
        doctorObj = await Doctor.findOne({ doctorId });
      }
    }
    if (!doctorObj) {
      doctorObj = await Doctor.findOne().sort({ createdAt: 1 });
    }

    // Resolve appointment if provided
    let apptObj: any = null;
    if (appointmentId) {
      apptObj = await Appointment.findById(appointmentId);
      if (!apptObj) {
        apptObj = await Appointment.findOne({ appointmentId });
      }
    }

    const count = await TeleconsultationSession.countDocuments();
    const sessionId = `TELE-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(4, "0")}`;

    const newSession = await TeleconsultationSession.create({
      sessionId,
      roomId,
      appointment: apptObj ? apptObj._id : undefined,
      patient: patientObj ? patientObj._id : undefined,
      doctor: doctorObj ? doctorObj._id : undefined,
      scheduledDate: apptObj?.appointmentDate || new Date().toISOString().split("T")[0],
      scheduledTime: apptObj?.timeSlot || "Live On-Demand",
      sessionStatus: role === "Doctor" ? "Doctor Joined" : "Waiting Room",
      connectionStatus: "Connected",
      doctorNotes: {
        chiefComplaint: apptObj?.reason || "Virtual Teleconsultation",
        symptoms: apptObj?.reason || "",
      },
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          sender: "System",
          senderRole: "System",
          text: `Encrypted teleconsultation room initialized (${roomId}). End-to-end HIPAA compliant session active.`,
          timestamp: new Date(),
        },
      ],
    });

    const populated = await TeleconsultationSession.findById(newSession._id)
      .populate("patient")
      .populate("doctor")
      .populate("appointment");

    // Notification
    try {
      await Notification.create({
        title: "Teleconsultation Room Ready",
        message: `${role} (${participantName || "User"}) initiated teleconsultation session ${sessionId}`,
        type: "info",
        link: `/teleconsultation?room=${roomId}`,
        read: false,
      });
    } catch (e) {
      // non-blocking
    }

    // Audit log
    await logAudit(req, {
      action: "CREATE",
      module: "PATIENT",
      recordId: sessionId,
      recordTitle: `Teleconsultation ${sessionId}`,
      details: `Initialized teleconsultation room ${roomId} for patient ${patientObj?.name || "Patient"} with Dr. ${doctorObj?.name || "Doctor"}`,
    });

    return NextResponse.json({ success: true, session: populated }, { status: 201 });
  } catch (error: any) {
    console.error("Teleconsultation POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
