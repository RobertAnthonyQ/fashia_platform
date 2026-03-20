import { getGeminiClient } from "./gemini";
import { createAdminClient } from "@/src/lib/supabase/admin";

export interface ArtDirectorSuggestions {
  prenda_principal: string;
  conjuntos_accesorios_recomendados: string[];
  lugares_recomendados: string[];
  poses_recomendadas: string[];
  iluminacion_recomendada: string[];
}

/**
 * Downloads an image from a proxy or Supabase URL and returns base64.
 */
async function downloadImageAsBase64(
  url: string,
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    if (url.startsWith("/api/storage/")) {
      const storagePath = url.replace("/api/storage/", "");
      const [bucket, ...rest] = storagePath.split("/");
      const filePath = rest.join("/");

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(bucket)
        .download(filePath);

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
 * Art Director AI: analyzes garment image and suggests creative direction.
 * Uses gemini-3-flash-preview for fast text analysis.
 */
export async function analyzeGarment(
  garmentImageUrl: string,
): Promise<ArtDirectorSuggestions> {
  const ai = getGeminiClient();

  const prompt = `# ROLE AND CONTEXT
You are the Senior Art Director and Lead Fashion Stylist for 'Fashia', a high-end commercial fashion agency. Your goal is to analyze the garment provided in the image and conceptualize its best visual presentation.

# TASK
Visually analyze the garment. Extract its real visual characteristics. Then, suggest complementary creative direction.

# CRITICAL RULES
1. ACCESSORIES MUST BE COMPLETE SETS: Never suggest just one item. Always suggest a COMPLETE complementary outfit set (e.g., "White chunky sneakers, white ankle socks, silver watch, and aviator sunglasses"). ALWAYS INCLUDE FOOTWEAR so the model is not barefoot.
2. LIGHTING: Suggest professional lighting setups. The FIRST option MUST be the absolute best, most flattering lighting for this specific fabric and style.
3. Respond SOLELY and EXCLUSIVELY with a valid JSON object. DO NOT use \`\`\`json formatting.

# REQUIRED JSON STRUCTURE:
{
  "prenda_principal": "[Detailed single-sentence description: garment type, colors, patterns, visible texture]",
  "conjuntos_accesorios_recomendados": [
    "[COMPLETE SET 1: footwear + accessories + complementary bottom/top if needed]",
    "[COMPLETE SET 2: footwear + accessories...]",
    "[COMPLETE SET 3: footwear + accessories...]"
  ],
  "lugares_recomendados": [
    "[Specific physical location 1]",
    "[Specific physical location 2]",
    "[Specific physical location 3]"
  ],
  "poses_recomendadas": [
    "[Body pose description 1]",
    "[Body pose description 2]",
    "[Body pose description 3]"
  ],
  "iluminacion_recomendada": [
    "[THE ABSOLUTE BEST technical lighting setup for this garment]",
    "[Alternative lighting setup 2]",
    "[Alternative lighting setup 3]"
  ]
}`;

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
  parts.push({ text: prompt });

  // Add garment image
  const imageData = await downloadImageAsBase64(garmentImageUrl);
  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.base64,
        mimeType: imageData.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts }],
  });

  const text = response.text?.trim() ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

  return JSON.parse(cleaned) as ArtDirectorSuggestions;
}
