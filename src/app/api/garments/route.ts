import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { listGarments, createGarment } from "@/src/lib/services/garments";
import { uploadGarmentImage } from "@/src/lib/services/storage";

/**
 * @swagger
 * /api/garments:
 *   get:
 *     summary: List user's garments
 *     tags: [Garments]
 *     responses:
 *       200:
 *         description: List of garments
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

    const { data, error } = await listGarments(user.id);
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/garments:
 *   post:
 *     summary: Upload a new garment image
 *     tags: [Garments]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created garment
 *       400:
 *         description: Invalid file
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

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Validation error", details: "Image file is required" },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: "File size must be less than 10MB",
        },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: "Only .jpg, .jpeg, .png and .webp formats are supported",
        },
        { status: 400 },
      );
    }

    // Upload to storage
    const { path, error: uploadError } = await uploadGarmentImage(
      user.id,
      file,
    );
    if (uploadError || !path) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    // Build proxy URL (bypasses RLS on private buckets)
    const proxyUrl = `/api/storage/garments/${path}`;

    // Create garment record
    const { data, error } = await createGarment(user.id, proxyUrl);
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
