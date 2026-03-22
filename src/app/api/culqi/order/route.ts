import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createOrder } from "@/src/lib/culqi";
import {
  getPackageById,
  calcularPrecioSueltos,
} from "@/src/lib/config/credit-packages";

/**
 * @swagger
 * /api/culqi/order:
 *   post:
 *     summary: Create a Culqi order for QR payment (Yape/Plin)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [package_id]
 *             properties:
 *               package_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 10
 *     responses:
 *       200:
 *         description: Order created with QR URL
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
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
    const { package_id, quantity } = body;

    if (!package_id || typeof package_id !== "string") {
      return NextResponse.json(
        { error: "package_id is required" },
        { status: 400 },
      );
    }

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

    // QR range: S/6 - S/500 (600 - 50000 centimos)
    if (amountInCentimos < 600) {
      return NextResponse.json(
        { error: "El monto mínimo para pago QR es S/ 6.00" },
        { status: 400 },
      );
    }
    if (amountInCentimos > 50000) {
      return NextResponse.json(
        { error: "El monto máximo para pago QR es S/ 500.00" },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const nameParts = (profile?.full_name ?? "User").split(" ");
    const firstName = nameParts[0] ?? "User";
    const lastName = nameParts.slice(1).join(" ") || "N/A";

    // Expiration: 30 minutes from now
    const expirationDate = Math.floor(Date.now() / 1000) + 30 * 60;

    const { data: order, error: culqiError } = await createOrder({
      amount: amountInCentimos,
      currency_code: "PEN",
      description: `Fashia — ${pkg.name} (${creditsToAdd} créditos)`,
      order_number: `ORD-${Date.now()}-${user.id.slice(0, 8)}`,
      client_details: {
        first_name: firstName,
        last_name: lastName,
        email: user.email ?? "",
        phone_number: "900000000",
      },
      expiration_date: expirationDate,
      metadata: {
        user_id: user.id,
        package_id,
        credits: String(creditsToAdd),
      },
    });

    if (culqiError) {
      console.error("[Order] Culqi error:", culqiError);
      return NextResponse.json(
        {
          error: "Error al crear la orden de pago",
          message: culqiError.user_message ?? culqiError.merchant_message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      order_id: order!.id,
      qr: order!.qr,
      url: order!.url,
      state: order!.state,
      expires_at: expirationDate,
    });
  } catch (err) {
    console.error("[Order] Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 },
    );
  }
}
