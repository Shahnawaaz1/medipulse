import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import TeleconsultationSession from "@/models/TeleconsultationSession";
import Patient from "@/models/Patient";
import Prescription from "@/models/Prescription";
import LabOrder from "@/models/LabOrder";
import RadiologyOrder from "@/models/RadiologyOrder";
import Admission from "@/models/Admission";
import Appointment from "@/models/Appointment";
import Notification from "@/models/Notification";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    let session = null;

    if (id.length === 24) {
      session = await TeleconsultationSession.findById(id)
        .populate("patient")
        .populate("doctor")
        .populate("appointment")
        .populate("prescription");
    }

    if (!session) {
      session = await TeleconsultationSession.findOne({
        $or: [{ sessionId: id }, { roomId: id }],
      })
        .populate("patient")
        .populate("doctor")
        .populate("appointment")
        .populate("prescription");
    }

    // Check if id is an appointmentId or appointment _id
    if (!session) {
      let aptDoc = null;
      if (id.startsWith("APT-")) {
        aptDoc = await Appointment.findOne({ appointmentId: id })
          .populate("patient")
          .populate("doctor");
      } else if (id.length === 24) {
        aptDoc = await Appointment.findById(id)
          .populate("patient")
          .populate("doctor");
      }

      if (aptDoc) {
        session = await TeleconsultationSession.findOne({ appointment: aptDoc._id })
          .populate("patient")
          .populate("doctor")
          .populate("appointment")
          .populate("prescription");

        if (!session && (aptDoc.consultationType === "Virtual Teleconsultation" || aptDoc.type === "Teleconsultation")) {
          const sessionCount = await TeleconsultationSession.countDocuments();
          const secureSessionId = `TEL-${new Date().getFullYear()}-${String(sessionCount + 101).padStart(4, "0")}`;

          session = await TeleconsultationSession.create({
            sessionId: secureSessionId,
            roomId: secureSessionId,
            appointment: aptDoc._id,
            patient: aptDoc.patient?._id || aptDoc.patient,
            doctor: aptDoc.doctor?._id || aptDoc.doctor,
            scheduledDate: aptDoc.appointmentDate,
            scheduledTime: aptDoc.timeSlot,
            sessionStatus: "Scheduled",
            connectionStatus: "Idle",
            chatMessages: [],
          });

          aptDoc.teleconsultationSession = session._id;
          await aptDoc.save();

          session = await TeleconsultationSession.findById(session._id)
            .populate("patient")
            .populate("doctor")
            .populate("appointment")
            .populate("prescription");
        }
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: "Teleconsultation session not found for the specified reference" },
        { status: 404 }
      );
    }

    // Fetch patient's previous clinical history
    let clinicalHistory: any = {
      previousPrescriptions: [],
      previousLabOrders: [],
      previousRadiologyOrders: [],
      previousAdmissions: [],
      previousAppointments: [],
    };

    if (session.patient?._id) {
      const patientId = session.patient._id;
      const [prescriptions, labs, rads, admissions, appts] =
        await Promise.all([
          Prescription.find({ patient: patientId })
            .populate("doctor", "name specialization")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
          LabOrder.find({ patient: patientId })
            .sort({ orderDate: -1 })
            .limit(5)
            .lean(),
          RadiologyOrder.find({ patient: patientId })
            .sort({ orderDate: -1 })
            .limit(5)
            .lean(),
          Admission.find({ patient: patientId })
            .populate("doctor", "name")
            .populate("bed")
            .sort({ admissionDate: -1 })
            .limit(3)
            .lean(),
          Appointment.find({ patient: patientId })
            .populate("doctor", "name specialization")
            .sort({ appointmentDate: -1 })
            .limit(5)
            .lean(),
        ]);

      clinicalHistory = {
        previousPrescriptions: prescriptions,
        previousLabOrders: labs,
        previousRadiologyOrders: rads,
        previousAdmissions: admissions,
        previousAppointments: appts,
      };
    }

    return NextResponse.json({
      success: true,
      session,
      clinicalHistory,
    });
  } catch (error: any) {
    console.error("Teleconsultation GET by ID error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    let session = await TeleconsultationSession.findById(id);
    if (!session) {
      session = await TeleconsultationSession.findOne({
        $or: [{ sessionId: id }, { roomId: id }],
      });
    }

    if (!session) {
      return NextResponse.json(
        { error: "Teleconsultation session not found" },
        { status: 404 }
      );
    }

    // 1. Update session status & duration
    if (body.sessionStatus) {
      session.sessionStatus = body.sessionStatus;
      if (body.sessionStatus === "In Consultation" && !session.actualStartTime) {
        session.actualStartTime = new Date();
      }
      if (body.sessionStatus === "Completed") {
        session.actualEndTime = new Date();
        if (session.actualStartTime) {
          session.durationSeconds = Math.round(
            (session.actualEndTime.getTime() -
              new Date(session.actualStartTime).getTime()) /
              1000
          );
        }
      }
    }

    if (body.connectionStatus) {
      session.connectionStatus = body.connectionStatus;
    }

    if (body.durationSeconds !== undefined) {
      session.durationSeconds = body.durationSeconds;
    }

    // 2. Update Doctor Notes
    if (body.doctorNotes) {
      session.doctorNotes = {
        ...session.doctorNotes,
        ...body.doctorNotes,
      };
    }

    // 3. Append New Chat Message
    if (body.newChatMessage) {
      session.chatMessages.push({
        id: body.newChatMessage.id || `msg-${Date.now()}`,
        sender: body.newChatMessage.sender,
        senderRole: body.newChatMessage.senderRole,
        text: body.newChatMessage.text,
        timestamp: new Date(),
      });
    }

    // 4. Issue & Electronically Authorize E-Prescription
    if (body.issuePrescription) {
      const rxData = body.issuePrescription;
      const count = await Prescription.countDocuments();
      const prescriptionId = `RX-${new Date().getFullYear()}-${String(
        count + 1
      ).padStart(4, "0")}`;

      const createdPrescription = await Prescription.create({
        prescriptionId,
        patient: session.patient,
        doctor: session.doctor,
        appointmentId: session.roomId,
        date: new Date().toISOString().split("T")[0],
        diagnosis:
          session.doctorNotes?.diagnosis ||
          rxData.diagnosis ||
          "Virtual Teleconsultation Evaluation",
        clinicalNotes:
          session.doctorNotes?.treatmentPlan ||
          rxData.clinicalNotes ||
          "Take prescribed medications as directed.",
        chiefComplaint: session.doctorNotes?.chiefComplaint || "",
        medicines: rxData.medicines || [],
        labAdvice: rxData.labAdvice || [],
        followUpDate: rxData.followUpDate || "",
        isDigitallySigned: true,
        signedBy: rxData.signedBy || "Attending Physician",
        signedAt: new Date(),
        signatureMetadata: {
          doctorMciNumber: rxData.mciNumber || "MCI-VERIFIED",
          consultationId: session.sessionId,
          authorizationType: "Electronically Authorized Clinical Prescription",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
        status: "Active",
      });

      session.prescription = createdPrescription._id;
      session.prescriptionSummary = {
        prescriptionId,
        medicines: rxData.medicines || [],
        labAdvice: rxData.labAdvice || [],
        followUpDate: rxData.followUpDate || "",
        isDigitallySigned: true,
        signedBy: rxData.signedBy || "Attending Physician",
        signedAt: new Date(),
        signatureMetadata: {
          doctorMciNumber: rxData.mciNumber || "MCI-VERIFIED",
          consultationId: session.sessionId,
        },
      };
      session.isSigned = true;
      session.signedByDoctorName = rxData.signedBy;
      session.signedAt = new Date();

      // Trigger notification for patient
      try {
        await Notification.create({
          title: "New E-Prescription Issued",
          message: `Dr. ${rxData.signedBy || "Doctor"} issued an electronically authorized prescription for your consultation.`,
          type: "success",
          link: "/patient/prescriptions",
          read: false,
        });
      } catch (e) {}

      // Log Audit
      await logAudit(req, {
        action: "CREATE",
        module: "PHARMACY",
        recordId: prescriptionId,
        recordTitle: `E-Prescription ${prescriptionId}`,
        details: `Doctor issued & electronically authorized e-prescription ${prescriptionId} during teleconsultation ${session.sessionId}`,
      });
    }

    if (body.followUpDate) {
      session.followUpDate = body.followUpDate;
    }

    await session.save();

    const updated = await TeleconsultationSession.findById(session._id)
      .populate("patient")
      .populate("doctor")
      .populate("appointment")
      .populate("prescription");

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    console.error("Teleconsultation PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
