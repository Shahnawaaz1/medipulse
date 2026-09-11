import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Invoice from "@/models/Invoice";
import HospitalSetting from "@/models/HospitalSetting";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const invoice = await Invoice.findById(params.id).populate("patient doctor");
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const hospitalSetting = (await HospitalSetting.findOne()) || {
      hospitalName: "MediPulse Hospital",
      tagline: "World-Class Healthcare",
      phone: "+1 800-456-7890",
      taxId: "TX-MED-883921",
    };

    return NextResponse.json({ success: true, invoice, hospitalSetting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const existing = await Invoice.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Recalculate balance and payment status if paidAmount is updated
    if (body.paidAmount !== undefined) {
      const total = body.totalAmount !== undefined ? body.totalAmount : existing.totalAmount;
      body.balanceAmount = Math.max(0, total - body.paidAmount);
      if (body.balanceAmount === 0 && total > 0) {
        body.paymentStatus = "Paid";
      } else if (body.paidAmount > 0) {
        body.paymentStatus = "Partially Paid";
      } else {
        body.paymentStatus = "Pending";
      }
    }

    const updated = await Invoice.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate("patient doctor");

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    await Invoice.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Invoice removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
