import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { purchaseCreditsSchema } from "@/src/lib/validations/credits";
import { addCredits } from "@/src/lib/services/credits";

/**
 * @swagger
 * /api/credits/purchase:
 *   post:
 *     summary: Purchase credits (Stripe placeholder)
 *     tags: [Credits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, payment_method]
 *             properties:
 *               amount:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credits purchased
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = purchaseCreditsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO: Integrate Stripe payment processing here
    // For now, this is a placeholder that directly adds credits

    const { error } = await addCredits(
      user.id,
      parsed.data.amount,
      "purchase",
      `Purchased ${parsed.data.amount} credits`,
    );

    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      amount: parsed.data.amount,
      message: `${parsed.data.amount} credits added to your account`,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
