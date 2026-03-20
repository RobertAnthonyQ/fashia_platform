import { getGeminiClient } from "./gemini";
import { createAdminClient } from "@/src/lib/supabase/admin";

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

export const ANGLE_OPTIONS: Record<string, { label: string; prompt: string }> = {
  front: {
    label: "Front",
    prompt: "directly from the front, facing the camera straight on",
  },
  back: {
    label: "Back",
    prompt: "from behind, showing the back of the model and the garment's back design",
  },
  left_side: {
    label: "Left Side",
    prompt: "from the left side profile, showing the model's left side",
  },
  right_side: {
    label: "Right Side",
    prompt: "from the right side profile, showing the model's right side",
  },
  three_quarter_left: {
    label: "3/4 Left",
    prompt: "from a three-quarter left angle, showing mostly the front with the left side visible",
  },
  three_quarter_right: {
    label: "3/4 Right",
    prompt: "from a three-quarter right angle, showing mostly the front with the right side visible",
  },
  high_angle: {
    label: "From Above",
    prompt: "from a high angle looking down at the model, bird's eye editorial perspective",
  },
  low_angle: {
    label: "From Below",
    prompt: "from a low angle looking up at the model, powerful and commanding perspective",
  },
};

/**
 * Takes the last generated photo and creates a variation from a different angle.
 * Only passes the source image — the AI decides the environment/background.
 */
export async function generateAngleVariation(
  sourceImageUrl: string,
  angle: string,
  imageModel: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const ai = getGeminiClient();

  const angleInfo = ANGLE_OPTIONS[angle];
  const anglePrompt = angleInfo?.prompt ?? `from a ${angle} angle`;

  const sourceData = await downloadImageAsBase64(sourceImageUrl);
  if (!sourceData) {
    throw new Error("Failed to download source image");
  }

  const contents = [
    {
      role: "user",
      parts: [
        {
          inlineData: { data: sourceData.base64, mimeType: sourceData.mimeType },
        },
        {
          text: `This is a professional fashion photograph. Generate a NEW photograph of the EXACT SAME person wearing the EXACT SAME outfit, but photographed ${anglePrompt}.

CRITICAL RULES:
- The person must be IDENTICAL — same face, same body, same skin tone
- The garment must be IDENTICAL — same clothing, same colors, same accessories, same footwear
- The pose should be natural for this camera angle
- YOU decide the background and environment — make it consistent with the original photo's style and mood, but generate what would naturally be visible from this new angle
- Maintain the same lighting style and color grading as the original
- Ultra-realistic, must look like a real DSLR photograph
- 8k resolution, RAW photo quality, realistic skin texture
- No AI artifacts, no text, no watermarks`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model: imageModel,
    config: { responseModalities: ["IMAGE", "TEXT"] },
    contents,
  });

  for await (const chunk of response) {
    if (!chunk.candidates?.[0]?.content?.parts) continue;
    for (const part of chunk.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data || "", "base64");
        const mimeType = part.inlineData.mimeType || "image/png";
        return { buffer, mimeType };
      }
    }
  }

  throw new Error("No image was generated");
}
