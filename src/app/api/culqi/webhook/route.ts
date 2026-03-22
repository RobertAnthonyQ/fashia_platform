import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { addCredits } from "@/src/lib/services/credits";
import { getCharge } from "@/src/lib/culqi";
import type { CulqiWebhookEvent } from "@/src/types/culqi";

/**
 * @swagger
 * /api/culqi/webhook:
 *   post:
 *     summary: Handle Culqi webhook events
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
export async function POST(req: Request) {
  // Webhooks must ALWAYS return 200 to avoid Culqi retries
  try {
    const body = (await req.json()) as CulqiWebhookEvent;
    const { type, data } = body;

    if (type === "charge.creation.succeeded" && data) {
      const chargeId = data.id;

      // Verify charge with Culqi API to prevent spoofed webhooks
      const { data: verifiedCharge, error: verifyError } =
        await getCharge(chargeId);

      if (verifyError || !verifiedCharge?.paid) {
        console.error("[Webhook] Charge verification failed", {
          chargeId,
          error: verifyError,
        });
        return NextResponse.json({ received: true });
      }

      const userId = verifiedCharge.metadata?.user_id;
      const credits = parseInt(verifiedCharge.metadata?.credits ?? "0", 10);

      if (!userId || credits <= 0) {
        console.error("[Webhook] Missing metadata", {
          chargeId,
          userId,
          credits,
        });
        return NextResponse.json({ received: true });
      }

      // Check if already processed (idempotency)
      const supabase = await createClient();
      const { data: existing } = await supabase
        .from("credit_ledger")
        .select("id")
        .ilike("description", `%${chargeId}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        // Already processed — skip
        return NextResponse.json({ received: true });
      }

      // Backup credit addition (in case the charge route failed)
      await addCredits(
        userId,
        credits,
        "purchase",
        `[Webhook] Compra confirmada — ${credits} créditos (Cargo: ${chargeId})`,
      );
    }

    if (type === "charge.creation.failed" && data) {
      console.warn("[Webhook] Charge failed", {
        chargeId: data.id,
        userId: data.metadata?.user_id,
      });
    }

    if (type === "order.status.changed" && data) {
      const orderId = data.id;
      const status = data.state ?? data.status;
      const metadata = data.metadata as Record<string, string> | null;

      if (status === "paid") {
        console.log(`[Webhook] ✅ QR order paid: ${orderId}`);

        const userId = metadata?.user_id;
        const credits = parseInt(metadata?.credits ?? "0", 10);

        if (!userId || credits <= 0) {
          console.error("[Webhook] Missing order metadata", { orderId, userId, credits });
          return NextResponse.json({ received: true });
        }

        // Idempotency check
        const supabase = await createClient();
        const { data: existing } = await supabase
          .from("credit_ledger")
          .select("id")
          .ilike("description", `%${orderId}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          return NextResponse.json({ received: true });
        }

        await addCredits(
          userId,
          credits,
          "purchase",
          `[QR] Compra confirmada — ${credits} créditos (Orden: ${orderId})`,
        );
      } else if (status === "expired") {
        console.log(`[Webhook] ⏰ QR order expired: ${orderId}`);
      }
    }
  } catch (err) {
    console.error("[Webhook] Processing error", err);
  }

  // Always respond 200
  return NextResponse.json({ received: true });
}
