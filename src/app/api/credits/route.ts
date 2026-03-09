import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { getBalance } from "@/src/lib/services/credits";

/**
 * @swagger
 * /api/credits:
 *   get:
 *     summary: Get current credit balance
 *     tags: [Credits]
 *     responses:
 *       200:
 *         description: Credit balance
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await getBalance(user.id);
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ credits: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
