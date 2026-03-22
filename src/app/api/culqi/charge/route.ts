import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createChargeSchema } from "@/src/lib/validations/culqi";
import { createCharge } from "@/src/lib/culqi";
import { addCredits } from "@/src/lib/services/credits";
import {
  getPackageById,
  calcularPrecioSueltos,
} from "@/src/lib/config/credit-packages";

/**
 * @swagger
 * /api/culqi/charge:
 *   post:
 *     summary: Create a Culqi charge and add credits
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token_id, package_id]
 *             properties:
 *               token_id:
 *                 type: string
 *               package_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 10
 *     responses:
 *       200:
 *         description: Charge created and credits added
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       402:
 *         description: Payment failed
 *       500:
 *         description: Server error
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
    const parsed = createChargeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { token_id, package_id, quantity } = parsed.data;

    // Validate package & calculate amount
    const pkg = getPackageById(package_id);
    if (!pkg) {
      return NextResponse.json(
        { error: "Invalid package" },
        { status: 400 },
      );
    }

    let amountInCentimos: number;
    let creditsToAdd: number;

    if (package_id === "sueltos") {
      const qty = quantity ?? pkg.minQuantity ?? 10;
      const calc = calcularPrecioSueltos(qty);
      amountInCentimos = calc.priceInCentimos;
      creditsToAdd = qty;
    } else {
      amountInCentimos = pkg.priceInCentimos;
      creditsToAdd = pkg.credits;
    }

    // Get user profile for antifraud
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, country")
      .eq("id", user.id)
      .single();

    const nameParts = (profile?.full_name ?? "User").split(" ");
    const firstName = nameParts[0] ?? "User";
    const lastName = nameParts.slice(1).join(" ") || "N/A";

    // Create charge in Culqi
    const { data: charge, error: culqiError } = await createCharge({
      amount: amountInCentimos,
      currency_code: "PEN",
      email: user.email ?? "",
      source_id: token_id,
      description: `Fashia — ${pkg.name} (${creditsToAdd} créditos)`,
      antifraud_details: {
        first_name: firstName,
        last_name: lastName,
        address: "Av. Lima 123",
        address_city: "Lima",
        country_code: profile?.country ?? "PE",
        phone: "900000000",
      },
      metadata: {
        user_id: user.id,
        package_id,
        credits: String(creditsToAdd),
      },
    });

    if (culqiError) {
      console.error("[Culqi Charge ERROR]", JSON.stringify(culqiError, null, 2));
      console.error("[Culqi Charge ERROR] Request was:", {
        amount: amountInCentimos,
        currency_code: "PEN",
        email: user.email,
        source_id: token_id,
        package_id,
        creditsToAdd,
      });
      return NextResponse.json(
        {
          error: "Payment failed",
          message: culqiError.user_message,
          code: culqiError.code,
        },
        { status: 402 },
      );
    }

    // Add credits to user account
    const { error: creditError } = await addCredits(
      user.id,
      creditsToAdd,
      "purchase",
      `Compra ${pkg.name} — ${creditsToAdd} créditos (Cargo: ${charge?.id})`,
    );

    if (creditError) {
      // Charge succeeded but credits failed — log for manual reconciliation
      console.error(
        "[CRITICAL] Charge succeeded but credit addition failed",
        { chargeId: charge?.id, userId: user.id, credits: creditsToAdd },
      );
      return NextResponse.json(
        { error: "Credits could not be added. Contact support.", charge_id: charge?.id },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      credits: creditsToAdd,
      charge_id: charge?.id,
      message: `${creditsToAdd} créditos añadidos a tu cuenta`,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
