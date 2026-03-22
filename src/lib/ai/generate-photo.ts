import { getGeminiClient } from "./gemini";
import { createAdminClient } from "@/src/lib/supabase/admin";

export interface GeneratePhotoInput {
  modelName: string;
  modelGender: string;
  modelDescription: string;
  refFaceUrl: string | null;

  garmentImageUrl: string | null;
  garmentDescription: string;

  accessorySet: string;
  location: string;
  pose: string;
  lighting: string;
  customPrompt?: string;

  imageModel: "gemini-3-pro-image-preview" | "gemini-2.5-flash-image";
}

async function downloadImageAsBase64(
  url: string,
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    if (url.startsWith("/api/storage/")) {
      const storagePath = url.replace("/api/storage/", "");
      const [bucket, ...rest] = storagePath.split("/");
      const filePath = rest.join("/");
      const admin = createAdminClient();
      const { data, error } = await admin.storage.from(bucket).download(filePath);
      if (error || !data) return null;
      const buffer = Buffer.from(await data.arrayBuffer());
      return { base64: buffer.toString("base64"), mimeType: data.type || "image/png" };
    }

    if (url.startsWith("http")) {
      const urlPath = new URL(url).pathname;
      const match = urlPath.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
      if (match) {
        const [, bucket, filePath] = match;
        const admin = createAdminClient();
        const { data, error } = await admin.storage.from(bucket).download(filePath);
        if (error || !data) return null;
        const buffer = Buffer.from(await data.arrayBuffer());
        return { base64: buffer.toString("base64"), mimeType: data.type || "image/png" };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generates the final fashion photo.
 *
 * KEY STRATEGY for face consistency:
 * - Face reference goes FIRST (before any text) so the model anchors on it
 * - Multi-turn conversation: first turn establishes the face identity,
 *   second turn requests the fashion photo using that identity
 * - Extremely explicit face matching instructions
 */
export async function generateFashionPhoto(
  input: GeneratePhotoInput,
): Promise<{ buffer: Buffer; mimeType: string; prompt: string }> {
  const ai = getGeminiClient();

  // Download images first
  let faceData: { base64: string; mimeType: string } | null = null;
  let garmentData: { base64: string; mimeType: string } | null = null;

  console.log("[generate-photo] refFaceUrl:", input.refFaceUrl);
  if (input.refFaceUrl) {
    faceData = await downloadImageAsBase64(input.refFaceUrl);
    if (faceData) {
      console.log("[generate-photo] Face image loaded OK, size:", faceData.base64.length, "mime:", faceData.mimeType);
    } else {
      console.error("[generate-photo] FAILED to download face image from:", input.refFaceUrl);
    }
  }

  console.log("[generate-photo] garmentImageUrl:", input.garmentImageUrl);
  if (input.garmentImageUrl) {
    garmentData = await downloadImageAsBase64(input.garmentImageUrl);
    if (garmentData) {
      console.log("[generate-photo] Garment image loaded OK, size:", garmentData.base64.length);
    } else {
      console.error("[generate-photo] FAILED to download garment image");
    }
  }

  // Build multi-turn conversation for better face anchoring
  const contents: Array<{
    role: string;
    parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;
  }> = [];

  // === TURN 1: Establish the person's identity with face reference ===
  if (faceData) {
    contents.push({
      role: "user",
      parts: [
        {
          inlineData: { data: faceData.base64, mimeType: faceData.mimeType },
        },
        {
          text: `This is a real photograph of ${input.modelName}, a ${input.modelGender} fashion model. Study this face as a photographer would — memorize every real human detail: the exact shape of the eyes, nose, mouth, jawline, cheekbones, eyebrows, skin tone, pores, skin texture, any moles or marks, and every unique imperfection. You will reproduce THIS EXACT PERSON with all their real human characteristics in the next image.`,
        },
      ],
    });

    contents.push({
      role: "model",
      parts: [
        {
          text: `I have carefully studied the real photograph of ${input.modelName}. I can see every detail: their specific eye shape, nose structure, lip shape, jawline contour, skin tone, visible pores, skin texture variations, and all unique imperfections. I will reproduce this exact real person with all their human characteristics — no smoothing, no idealizing.`,
        },
      ],
    });
  }

  // === TURN 2: Provide garment + face again for reinforcement ===
  const turn2Parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  // Pass face reference AGAIN in turn 2 so the model has it fresh
  if (faceData) {
    turn2Parts.push({
      text: "Here is the face reference photo again. The generated image MUST show THIS EXACT person:",
    });
    turn2Parts.push({
      inlineData: { data: faceData.base64, mimeType: faceData.mimeType },
    });
  }

  if (garmentData) {
    turn2Parts.push({
      text: "And here is the garment reference. The model must wear THIS EXACT garment:",
    });
    turn2Parts.push({
      inlineData: { data: garmentData.base64, mimeType: garmentData.mimeType },
    });
  }

  const prompt = `Generate a real photograph — NOT an illustration, NOT a render, NOT AI art. This must look like it was taken by a professional fashion photographer on set with a real camera and a real person.

USE THE FACE REFERENCE IMAGE${faceData ? "S I PROVIDED" : ""} — the person in the generated photo MUST have the IDENTICAL face as the reference.

Physical description of the model: ${input.modelDescription}

SCENE DESCRIPTION:
${input.modelName} is ${input.pose}, wearing ${input.garmentDescription} (MATCH THE EXACT GARMENT FROM THE REFERENCE IMAGE), styled with ${input.accessorySet}. The scene is set in ${input.location}. ${input.lighting}.

IMAGE FORMAT — MANDATORY:
- Aspect ratio: 4:5 portrait (1080x1350 pixels) — this is the Instagram standard format
- The image MUST be vertical/portrait orientation, taller than wide
- Frame the full body or 3/4 body within this vertical format

CAMERA & LENS — shoot as if using real equipment:
- Camera: Hasselblad X2D 100C or Canon EOS R5, medium format sensor
- Lens: 50mm f/4 (NOT 85mm f/1.4 — we want DEEP depth of field, the background must be SHARP and fully detailed, NOT blurry)
- Aperture: f/8 to f/11 — everything in focus, foreground to background
- ISO 100, shutter speed 1/250s
- The background and environment must be COMPLETELY SHARP and IN FOCUS with full detail — NO bokeh, NO blur, NO soft background
- Color science: natural Hasselblad color rendering, no orange-teal grading, no Instagram filters

FACE IDENTITY — #1 PRIORITY:
- Copy the reference face exactly: same eye shape, eye color, nose bridge, nose tip, nostril shape, lip thickness, lip shape, jawline angle, chin shape, cheekbone height, eyebrow arch, skin tone, skin texture, facial hair if any, moles, freckles, beauty marks
- The face must be clearly visible and well-lit
- Do NOT beautify, smooth, or idealize the face — keep it exactly as the reference

SKIN & BODY — real human imperfections are MANDATORY:
- Visible pores on nose, cheeks, and forehead — not smoothed out
- Subtle under-eye texture, fine lines appropriate to age
- Visible arm hair, leg hair, or peach fuzz where natural
- Slight color variation in skin: redness on knuckles, darker elbows/knees, veins visible on hands and wrists
- Skin must show subsurface scattering where backlit — translucent ear tips, light through thin skin
- Natural nail texture with subtle ridges
- Lips with natural dryness lines, not plastic-looking
- Teeth (if smiling) with natural slight color variation, not perfectly white
- NO airbrushed skin, NO porcelain doll effect, NO waxy appearance

GARMENT & FABRIC — real textile behavior:
- The garment must EXACTLY match the reference image: same design, colors, fabric weave, pattern, stitching, labels, hardware
- Fabric must behave physically correct: gravity pulls it down, tension where the body stretches it, compression wrinkles at joints (elbows, waist, knees)
- Visible micro-texture of the fabric weave (cotton threads, denim twill, knit loops)
- Subtle lint, fiber texture, or fabric pilling where appropriate for the material type
- Seams, hems, and stitching must be visible at close inspection
- If footwear is specified in the accessory set, the model must wear it. If no footwear is specified, frame the shot so feet are not prominent

ENVIRONMENT & BACKGROUND — sharp and detailed:
- The location must be rendered with the SAME level of detail as the model — it is NOT a backdrop, it is a real place
- Every surface must have texture: concrete grain, wood grain, brick mortar, grass blades, asphalt cracks
- Environmental light interaction: real shadows on the ground, light bouncing off walls, reflections in puddles or glass
- Ambient objects must be realistic: dust particles in light beams, weathering on surfaces, natural imperfections in architecture
- The ground the model stands on must show realistic contact: shoe impression, weight distribution shadow

WHAT TO ABSOLUTELY AVOID:
- No smooth/plastic/waxy skin — this is the #1 sign of AI photos
- No background blur or bokeh — the background must be as sharp as the subject
- No symmetrical perfection in face or body — real humans are slightly asymmetric
- No floating or weightless appearance — the model must look grounded with real gravity
- No oversaturated or HDR look — keep colors natural and film-like
- No extra fingers, merged fingers, or deformed hands
- No text, watermarks, logos, or borders in the image
- No glowing skin, lens flare halos, or artificial light blooms
- No uncanny valley expressions — the expression must feel natural and candid`;

  turn2Parts.push({ text: prompt });

  contents.push({
    role: "user",
    parts: turn2Parts,
  });

  const imageParts = contents.reduce(
    (acc, c) => acc + c.parts.filter((p) => "inlineData" in p).length,
    0,
  );
  console.log(`[generate-photo] Sending ${contents.length} turns to Gemini (${imageParts} images, model: ${input.imageModel})`);

  const response = await ai.models.generateContentStream({
    model: input.imageModel,
    config: {
      responseModalities: ["IMAGE", "TEXT"],
    },
    contents,
  });

  for await (const chunk of response) {
    if (!chunk.candidates?.[0]?.content?.parts) continue;
    for (const part of chunk.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data || "", "base64");
        const mimeType = part.inlineData.mimeType || "image/png";
        return { buffer, mimeType, prompt };
      }
    }
  }

  throw new Error("No image was generated by the AI model");
}
