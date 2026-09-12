import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import PurchaseOrder from "@/models/PurchaseOrder";
import Inventory from "@/models/Inventory";
import Medicine from "@/models/Medicine";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const { id } = params;

    let po = await PurchaseOrder.findById(id);
    if (!po) {
      po = await PurchaseOrder.findOne({ poNumber: id });
    }

    if (!po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const body = await req.json();

    const existingPO = await PurchaseOrder.findById(params.id);
    if (!existingPO) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    // If changing to "Goods Received", auto-update inventory stock!
    if (body.status === "Goods Received" && existingPO.status !== "Goods Received") {
      body.goodsReceivedDate = new Date();
      for (const item of existingPO.items) {
        // Try matching Inventory item by itemCode or name
        const inv = await Inventory.findOne({
          $or: [{ itemCode: item.itemCode }, { name: { $regex: new RegExp(`^${item.name}$`, "i") } }],
        });

        if (inv) {
          inv.quantity += item.quantity;
          inv.status = inv.quantity > inv.minThreshold ? "In Stock" : "Low Stock";
          inv.lastRestocked = new Date();
          await inv.save();
        }

        // Also check if it's a pharmacy medicine
        const med = await Medicine.findOne({
          name: { $regex: new RegExp(`^${item.name}$`, "i") },
        });
        if (med) {
          med.stockQuantity += item.quantity;
          med.status = med.stockQuantity > med.minThreshold ? "In Stock" : "Low Stock";
          await med.save();
        }
      }
    }

    const updated = await PurchaseOrder.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    await logAudit(req, {
      action: "UPDATE",
      module: "PROCUREMENT",
      recordId: updated?.poNumber,
      recordTitle: `PO Updated: ${updated?.poNumber}`,
      details: `Updated purchase order status to ${updated?.status}. Payment: ${updated?.paymentStatus}`,
    });

    return NextResponse.json({ success: true, purchaseOrder: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
