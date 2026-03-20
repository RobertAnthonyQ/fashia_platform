import { getGeminiClient } from "./gemini";

export interface ModelProfile {
  height_cm: number;
  weight_kg: number;
  bust_cm: number;
  waist_cm: number;
  hips_cm: number;
  skin_tone: string;
  hair_color: string;
  hair_length: string;
  hair_texture: string;
  eye_color: string;
  face_shape: string;
  body_type: string;
  ethnicity_appearance: string;
  distinguishing_features: string;
  full_description: string;
}

interface GenerateProfileInput {
  name: string;
  gender: string;
  age?: number;
  country?: string;
  style?: string;
}

export async function generateModelProfile(
  input: GenerateProfileInput,
): Promise<ModelProfile> {
  const ai = getGeminiClient();

  const prompt = `You are a fashion industry expert. Generate realistic physical characteristics for a fashion model with the following details:

Name: ${input.name}
Gender: ${input.gender}
${input.age ? `Age: ${input.age}` : ""}
${input.country ? `Country/Origin: ${input.country}` : ""}
${input.style ? `Style: ${input.style}` : ""}

Generate a complete physical profile as a JSON object. The measurements should be realistic for a fashion model of this gender and background. The "full_description" should be a detailed paragraph (3-4 sentences) describing the model's complete appearance, suitable for generating a portrait photo with AI.

Return ONLY valid JSON (no markdown, no code blocks) with exactly these keys:
{
  "height_cm": <number 155-195>,
  "weight_kg": <number 45-95>,
  "bust_cm": <number 75-115>,
  "waist_cm": <number 55-90>,
  "hips_cm": <number 80-120>,
  "skin_tone": "<e.g. fair porcelain, warm olive, deep brown, light caramel>",
  "hair_color": "<e.g. jet black, platinum blonde, chestnut brown>",
  "hair_length": "<short, medium, long>",
  "hair_texture": "<straight, wavy, curly, coily>",
  "eye_color": "<e.g. dark brown, hazel, green, blue>",
  "face_shape": "<oval, round, square, heart, diamond, oblong>",
  "body_type": "<slim, athletic, slim athletic, curvy, hourglass>",
  "ethnicity_appearance": "<visual ethnic appearance>",
  "distinguishing_features": "<unique features, e.g. high cheekbones, dimples, beauty mark>",
  "full_description": "<detailed 3-4 sentence physical description for AI image generation>"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text?.trim() ?? "";

  // Clean potential markdown code blocks
  const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

  const parsed = JSON.parse(cleaned) as ModelProfile;
  return parsed;
}
