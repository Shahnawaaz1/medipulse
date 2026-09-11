import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import Invoice from "@/models/Invoice";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const regex = { $regex: q.trim(), $options: "i" };

    const [patients, doctors, appointments, invoices] = await Promise.all([
      Patient.find({
        $or: [{ name: regex }, { patientId: regex }, { phone: regex }, { email: regex }],
      })
        .limit(5)
        .select("patientId name phone email bloodGroup"),
      Doctor.find({
        $or: [{ name: regex }, { doctorId: regex }, { specialization: regex }, { department: regex }],
      })
        .limit(5)
        .select("doctorId name specialization department photo"),
      Appointment.find({
        $or: [{ appointmentId: regex }, { reason: regex }, { department: regex }],
      })
        .populate("patient", "name")
        .populate("doctor", "name")
        .limit(5)
        .select("appointmentId appointmentDate timeSlot status reason"),
      Invoice.find({
        $or: [{ invoiceNumber: regex }],
      })
        .populate("patient", "name")
        .limit(5)
        .select("invoiceNumber totalAmount paymentStatus invoiceDate"),
    ]);

    const results = [
      ...patients.map((p) => ({
        type: "Patient",
        title: p.name,
        subtitle: `${p.patientId} • ${p.phone} • Blood: ${p.bloodGroup}`,
        url: `/patients/${p._id}`,
      })),
      ...doctors.map((d) => ({
        type: "Doctor",
        title: d.name,
        subtitle: `${d.specialization} • ${d.department}`,
        url: `/doctors`,
      })),
      ...appointments.map((a: any) => ({
        type: "Appointment",
        title: `${a.appointmentId} - ${a.patient?.name || "Patient"}`,
        subtitle: `${a.appointmentDate} (${a.timeSlot}) • ${a.status}`,
        url: `/appointments`,
      })),
      ...invoices.map((i: any) => ({
        type: "Invoice",
        title: `${i.invoiceNumber} - $${i.totalAmount}`,
        subtitle: `Patient: ${i.patient?.name || "N/A"} • Status: ${i.paymentStatus}`,
        url: `/billing`,
      })),
    ];

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
