import { getGeminiClient } from "./gemini";
import { createAdminClient } from "@/src/lib/supabase/admin";

export interface SuggestionItem {
  label: string;
  detail: string;
}

export interface ArtDirectorSuggestions {
  prenda_principal: string;
  target: string;
  incluye_calzado: boolean;
  calzado: SuggestionItem[];
  accesorios: SuggestionItem[];
  complementos: SuggestionItem[];
  locacion: SuggestionItem[];
  pose: SuggestionItem[];
  iluminacion: SuggestionItem[];
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
 * Adapts suggestions based on model gender.
 */
export async function analyzeGarment(
  garmentImageUrl: string,
  modelGender?: string,
): Promise<ArtDirectorSuggestions> {
  const ai = getGeminiClient();

  const genderContext = modelGender
    ? `La modelo que vestira esta prenda es: ${modelGender}. Adapta TODAS las sugerencias (accesorios, calzado, complementos, poses) para que sean apropiadas y con estilo para una modelo ${modelGender}.`
    : "Infiere el genero probable del usuario de la prenda y adapta las sugerencias.";

  const prompt = `# ROL
Eres el Director de Arte Senior de 'Fashia', una agencia de fotografia de moda comercial. Analiza la prenda y sugiere direccion creativa.

# CONTEXTO
${genderContext}

# TAREA
1. Analiza la prenda visualmente (tipo, colores, patrones, textura, estilo).
2. Determina si el calzado seria visible/relevante para este tipo de prenda. Ejemplo: un gorro, bufanda o prenda solo de torso superior NO necesita calzado. Outfits completos, pantalones, faldas, vestidos o shorts SI necesitan calzado.
3. Sugiere items INDIVIDUALES (no conjuntos agrupados) para cada categoria.
4. Para locacion, pose e iluminacion: proporciona un "label" CORTO y un "detail" completo.

# REGLAS IMPORTANTES
- Cada "label" debe ser CORTO: 2-4 palabras EN ESPANOL que resuman la opcion visualmente
- Cada "detail" debe ser una descripcion COMPLETA EN INGLES, optimizada como prompt para generacion de imagenes con IA
- Sugiere 3-5 items por categoria
- Los accesorios deben ser items INDIVIDUALES, no conjuntos agrupados
- Adapta el estilo al genero de la modelo (accesorios masculinos para hombres, femeninos para mujeres, apropiados para la edad en ninos)
- Si "incluye_calzado" es false, retorna un array vacio para "calzado"
- "prenda_principal" debe estar en ESPANOL

# JSON REQUERIDO (responde SOLO con JSON valido, sin markdown):
{
  "prenda_principal": "[Una oracion en espanol: tipo de prenda, colores, patrones, textura]",
  "target": "[mujer_adulta | hombre_adulto | nina | nino | unisex]",
  "incluye_calzado": true/false,
  "calzado": [
    { "label": "[2-3 palabras en espanol]", "detail": "[Full footwear description in English with color, style, material]" }
  ],
  "accesorios": [
    { "label": "[2-3 palabras en espanol]", "detail": "[Full accessory description in English]" }
  ],
  "complementos": [
    { "label": "[2-3 palabras en espanol]", "detail": "[Full complementary item description in English: socks, belts, hats, etc.]" }
  ],
  "locacion": [
    { "label": "[2-3 palabras en espanol]", "detail": "[Complete location description in English for image generation]" }
  ],
  "pose": [
    { "label": "[2-3 palabras en espanol]", "detail": "[Complete pose description in English for image generation]" }
  ],
  "iluminacion": [
    { "label": "[2-3 palabras en espanol]", "detail": "[Complete technical lighting setup description in English]" }
  ]
}`;

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
  parts.push({ text: prompt });

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
