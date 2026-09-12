import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import PurchaseOrder from "@/models/PurchaseOrder";
import Inventory from "@/models/Inventory";
import Medicine from "@/models/Medicine";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = {};
    if (status && status !== "All") query.status = status;

    const purchaseOrders = await PurchaseOrder.find(query).sort({ orderDate: -1 });

    const stats = {
      totalOrders: purchaseOrders.length,
      pendingRequests: purchaseOrders.filter((p) => p.status === "Requested").length,
      issuedPOs: purchaseOrders.filter((p) => p.status === "PO Issued").length,
      goodsReceived: purchaseOrders.filter((p) => p.status === "Goods Received").length,
      totalSpend: purchaseOrders
        .filter((p) => ["Goods Received", "Invoiced", "Paid"].includes(p.status))
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    };

    return NextResponse.json({ success: true, purchaseOrders, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const body = await req.json();

    if (!body.poNumber) {
      const count = await PurchaseOrder.countDocuments();
      body.poNumber = `PO-2026-${String(count + 1).padStart(3, "0")}`;
    }

    if (!body.requestedBy && user) {
      body.requestedBy = user.name;
    }

    const newPO = await PurchaseOrder.create(body);

    await logAudit(req, {
      action: "CREATE",
      module: "PROCUREMENT",
      recordId: newPO.poNumber,
      recordTitle: `Purchase Order Created: ${newPO.poNumber}`,
      details: `Created PO for ${newPO.supplierName}. Total amount: ₹${newPO.totalAmount}. Status: ${newPO.status}`,
    });

    return NextResponse.json({ success: true, purchaseOrder: newPO }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
