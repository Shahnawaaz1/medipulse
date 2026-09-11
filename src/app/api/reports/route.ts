import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import Invoice from "@/models/Invoice";
import Doctor from "@/models/Doctor";
import Bed from "@/models/Bed";
import Medicine from "@/models/Medicine";
import LabOrder from "@/models/LabOrder";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "financial"; // financial, appointments, patients, doctors, pharmacy, beds

    const today = new Date().toISOString().split("T")[0];

    if (type === "financial") {
      const invoices = await Invoice.find().populate("patient").sort({ invoiceDate: -1 });
      const monthlyRevenue = [
        { month: "Jan", revenue: 45000, collections: 42000, dues: 3000 },
        { month: "Feb", revenue: 52000, collections: 48000, dues: 4000 },
        { month: "Mar", revenue: 61000, collections: 58000, dues: 3000 },
        { month: "Apr", revenue: 58000, collections: 55000, dues: 3000 },
        { month: "May", revenue: 67000, collections: 63000, dues: 4000 },
        { month: "Jun", revenue: 74000, collections: 70000, dues: 4000 },
      ];

      return NextResponse.json({
        success: true,
        type: "financial",
        data: {
          invoices,
          monthlyRevenue,
          totals: {
            totalBilled: invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0),
            totalCollected: invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0),
            totalOutstanding: invoices.reduce((acc, i) => acc + (i.balanceAmount || 0), 0),
          },
        },
      });
    }

    if (type === "appointments") {
      const appointments = await Appointment.find()
        .populate("patient doctor")
        .sort({ appointmentDate: -1 });

      const statusBreakdown = [
        { status: "Completed", count: appointments.filter((a) => a.status === "Completed").length },
        { status: "Scheduled", count: appointments.filter((a) => a.status === "Scheduled").length },
        { status: "Confirmed", count: appointments.filter((a) => a.status === "Confirmed").length },
        { status: "In Consultation", count: appointments.filter((a) => a.status === "In Consultation").length },
        { status: "Cancelled", count: appointments.filter((a) => a.status === "Cancelled").length },
      ];

      return NextResponse.json({
        success: true,
        type: "appointments",
        data: {
          appointments,
          statusBreakdown,
          total: appointments.length,
        },
      });
    }

    if (type === "patients") {
      const patients = await Patient.find().sort({ createdAt: -1 });
      const bloodGroupMap: Record<string, number> = {};
      const genderMap: Record<string, number> = { Male: 0, Female: 0, Other: 0 };

      patients.forEach((p) => {
        bloodGroupMap[p.bloodGroup] = (bloodGroupMap[p.bloodGroup] || 0) + 1;
        if (p.gender) genderMap[p.gender] = (genderMap[p.gender] || 0) + 1;
      });

      return NextResponse.json({
        success: true,
        type: "patients",
        data: {
          patients,
          bloodGroupDistribution: Object.entries(bloodGroupMap).map(([k, v]) => ({ bloodGroup: k, count: v })),
          genderDistribution: Object.entries(genderMap).map(([k, v]) => ({ gender: k, count: v })),
          total: patients.length,
        },
      });
    }

    if (type === "pharmacy") {
      const medicines = await Medicine.find().sort({ stockQuantity: 1 });
      return NextResponse.json({
        success: true,
        type: "pharmacy",
        data: {
          medicines,
          totalStockValue: medicines.reduce((acc, m) => acc + (m.stockQuantity * m.sellingPrice), 0),
          lowStockItems: medicines.filter((m) => m.stockQuantity <= m.minThreshold),
        },
      });
    }

    if (type === "beds") {
      const beds = await Bed.find().sort({ ward: 1 });
      return NextResponse.json({
        success: true,
        type: "beds",
        data: {
          beds,
          total: beds.length,
          available: beds.filter((b) => b.status === "Available").length,
          occupied: beds.filter((b) => b.status === "Occupied").length,
          maintenance: beds.filter((b) => b.status === "Maintenance").length,
        },
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
