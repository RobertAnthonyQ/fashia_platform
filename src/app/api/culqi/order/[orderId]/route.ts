import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { getOrder } from "@/src/lib/culqi";

/**
 * @swagger
 * /api/culqi/order/{orderId}:
 *   get:
 *     summary: Check status of a Culqi order
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status
 *       401:
 *         description: Unauthorized
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const { data: order, error: culqiError } = await getOrder(orderId);

    if (culqiError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    // Verify this order belongs to the authenticated user
    if (order.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      order_id: order.id,
      state: order.state,
      amount: order.amount,
      credits: parseInt(order.metadata?.credits ?? "0", 10),
    });
  } catch (err) {
    console.error("[Order Status] Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 },
    );
  }
}
