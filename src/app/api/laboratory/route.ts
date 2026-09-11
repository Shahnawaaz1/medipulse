import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import LabTest from "@/models/LabTest";
import LabOrder from "@/models/LabOrder";
import Notification from "@/models/Notification";
import Patient from "@/models/Patient";
import { getPatientScope } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "catalog" or "orders"

    if (type === "catalog") {
      const tests = await LabTest.find({ status: "Active" }).sort({ category: 1, name: 1 });
      return NextResponse.json({ success: true, tests });
    }

    const status = searchParams.get("status") || "";
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
        return NextResponse.json({
          success: true,
          orders: [],
          testsCatalog: [],
          stats: { totalOrders: 0, pending: 0, completed: 0 },
        });
      }
    }

    if (status) query.status = status;

    const orders = await LabOrder.find(query)
      .populate("patient doctor tests.test")
      .sort({ orderDate: -1, createdAt: -1 });

    const testsCatalog = await LabTest.find().sort({ name: 1 });

    return NextResponse.json({
      success: true,
      orders,
      testsCatalog,
      stats: {
        totalOrders: orders.length,
        pending: orders.filter((o) => o.status !== "Completed").length,
        completed: orders.filter((o) => o.status === "Completed").length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Check if adding a new Test Catalog item or creating a new Lab Order
    if (body.testCode && body.referenceRanges) {
      const newTest = await LabTest.create(body);
      return NextResponse.json({ success: true, test: newTest }, { status: 201 });
    }

    // Creating Lab Order
    if (!body.orderId) {
      const count = await LabOrder.countDocuments();
      body.orderId = `LBO-${3000 + count + 1}`;
    }
    if (!body.orderDate) {
      body.orderDate = new Date().toISOString().split("T")[0];
    }

    const order = await LabOrder.create(body);
    const populated = await LabOrder.findById(order._id).populate("patient doctor tests.test");

    const patientDoc = await Patient.findById(body.patient);
    await Notification.create({
      title: "New Lab Test Ordered",
      message: `Diagnostic test ordered for ${patientDoc ? patientDoc.name : "Patient"}.`,
      type: "info",
      link: "/laboratory",
      read: false,
    });

    return NextResponse.json({ success: true, order: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
