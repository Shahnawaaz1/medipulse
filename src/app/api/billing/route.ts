import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Invoice from "@/models/Invoice";
import Notification from "@/models/Notification";
import Patient from "@/models/Patient";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const query: any = {};
    if (status) query.paymentStatus = status;

    const invoices = await Invoice.find(query)
      .populate("patient doctor")
      .sort({ invoiceDate: -1, createdAt: -1 });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount || 0;
      totalCollected += inv.paidAmount || 0;
      totalPending += inv.balanceAmount || 0;
    });

    return NextResponse.json({
      success: true,
      invoices,
      summary: {
        totalBilled,
        totalCollected,
        totalPending,
        count: invoices.length,
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

    if (!body.invoiceNumber) {
      const count = await Invoice.countDocuments();
      body.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 101).padStart(4, "0")}`;
    }
    if (!body.invoiceDate) {
      body.invoiceDate = new Date().toISOString().split("T")[0];
    }
    if (!body.dueDate) {
      body.dueDate = body.invoiceDate;
    }

    // Auto-calculate subtotal, totalAmount, balance
    let calculatedSubtotal = 0;
    if (Array.isArray(body.items)) {
      body.items.forEach((item: any) => {
        item.total = (item.quantity || 1) * (item.unitPrice || 0);
        calculatedSubtotal += item.total;
      });
    }
    body.subtotal = body.subtotal !== undefined ? body.subtotal : calculatedSubtotal;
    const discount = body.discount || 0;
    const tax = body.tax || 0;
    body.totalAmount = Math.max(0, body.subtotal - discount + tax);
    const paid = body.paidAmount || 0;
    body.balanceAmount = Math.max(0, body.totalAmount - paid);

    if (body.balanceAmount === 0 && body.totalAmount > 0) {
      body.paymentStatus = "Paid";
    } else if (paid > 0 && body.balanceAmount > 0) {
      body.paymentStatus = "Partially Paid";
    } else {
      body.paymentStatus = "Pending";
    }

    const invoice = await Invoice.create(body);
    const populated = await Invoice.findById(invoice._id).populate("patient doctor");

    const patientDoc = await Patient.findById(body.patient);
    if (body.paymentStatus === "Paid") {
      await Notification.create({
        title: "Invoice Paid",
        message: `Payment of $${body.paidAmount} received for invoice ${body.invoiceNumber} (${patientDoc ? patientDoc.name : "Patient"}).`,
        type: "success",
        link: "/billing",
        read: false,
      });
    }

    return NextResponse.json({ success: true, invoice: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
