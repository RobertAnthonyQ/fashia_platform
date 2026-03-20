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
          text: `This is a photograph of ${input.modelName}, a ${input.modelGender} fashion model. Study this face carefully. Memorize every facial feature: the exact shape of the eyes, nose, mouth, jawline, cheekbones, eyebrows, skin tone, and any unique features. You will need to reproduce THIS EXACT PERSON in the next image you generate.`,
        },
      ],
    });

    contents.push({
      role: "model",
      parts: [
        {
          text: `I have carefully studied the face of ${input.modelName}. I can see all their distinctive facial features including their specific eye shape, nose structure, lip shape, jawline contour, skin tone, and unique characteristics. I will reproduce this exact person's face in the generated image.`,
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

  const prompt = `Now generate a fashion photograph. USE THE FACE REFERENCE IMAGE${faceData ? "S I PROVIDED" : ""} — the person in the generated photo MUST have the IDENTICAL face as the reference. Copy the face pixel by pixel: same eyes, same nose, same mouth, same jawline, same skin color, same everything.

Physical description of the model: ${input.modelDescription}

GENERATE THIS IMAGE:
Ultra-realistic high-end fashion editorial photography, shot on medium format digital camera. ${input.modelName} (USE THE REFERENCE FACE IMAGE AS THE MODEL'S FACE) is ${input.pose}, wearing ${input.garmentDescription} (WEARING THE EXACT GARMENT FROM THE REFERENCE IMAGE), styled with ${input.accessorySet}. Set in ${input.location}. Expert fashion photographer framing and composition. Professional focal length 85mm at f/2.0, ${input.lighting}. Highly detailed, 8k resolution, RAW photo.

FACE IDENTITY — ABSOLUTE #1 PRIORITY — NON-NEGOTIABLE:
- YOU MUST USE THE REFERENCE FACE IMAGE to generate the model's face
- The face in the output image must be a COPY of the reference face — not inspired by, not similar to, but THE SAME face
- Match EXACTLY: eye shape, eye color, iris pattern, nose bridge width, nose tip shape, nostril shape, lip thickness, lip shape, cupid's bow, jawline angle, chin shape, cheekbone height, eyebrow arch, eyebrow thickness, forehead size, ear shape, skin tone, skin texture, facial hair (if any), moles, freckles, beauty marks
- The face must be clearly visible, front-facing or three-quarter angle, well-lit
- If you cannot match the face exactly, get as close as humanly possible — the face reference is the MOST IMPORTANT input

GARMENT ACCURACY:
- The clothing must exactly match the reference garment image — same design, colors, fabric, pattern, details
- Natural fabric draping with realistic wrinkles and folds at movement points
- The model must be fully dressed including footwear from the accessory set

PHOTOREALISM:
- Must be indistinguishable from a real DSLR photograph
- Realistic skin: visible pores, natural texture, subtle imperfections, subsurface scattering
- Natural body proportions, correct hand anatomy
- Professional color grading, rich dynamic range
- Sharp focus on subject, natural background bokeh
- No AI artifacts, no extra fingers, no impossible anatomy
- No text, watermarks, logos, or borders`;

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
