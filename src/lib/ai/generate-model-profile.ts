import { getGeminiClient } from "./gemini";

export interface ModelProfileFemale {
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

export interface ModelProfileMale {
  height_cm: number;
  weight_kg: number;
  chest_cm: number;
  waist_cm: number;
  shoulder_width_cm: number;
  skin_tone: string;
  hair_color: string;
  hair_length: string;
  hair_texture: string;
  facial_hair: string;
  eye_color: string;
  face_shape: string;
  body_type: string;
  ethnicity_appearance: string;
  distinguishing_features: string;
  full_description: string;
}

export type ModelProfile = ModelProfileFemale | ModelProfileMale;

interface GenerateProfileInput {
  name: string;
  gender: string;
  age?: number;
  country?: string;
  style?: string;
}

function buildFemalePrompt(input: GenerateProfileInput): string {
  return `You are a fashion industry expert specializing in female fashion models. Generate realistic physical characteristics for a FEMALE fashion model.

Name: ${input.name}
Gender: Female
${input.age ? `Age: ${input.age}` : ""}
${input.country ? `Country/Origin: ${input.country}` : ""}
${input.style ? `Style: ${input.style}` : ""}

Generate a complete physical profile. Measurements must be realistic for a professional female fashion model of this background. Consider regional beauty standards and typical body proportions for women from this origin.

The "full_description" must be a detailed paragraph (4-5 sentences) describing the model's complete physical appearance INCLUDING natural facial imperfections (such as: a beauty mark on her left cheek, subtle freckles across her nose bridge, a tiny mole near her eyebrow, faint smile lines, slightly asymmetric eyebrows, a small scar, natural under-eye creases). These imperfections make the model look REAL and human. Also describe her skin texture, any sun spots or subtle blemishes.

Return ONLY valid JSON (no markdown, no code blocks) with exactly these keys:
{
  "height_cm": <number 160-185>,
  "weight_kg": <number 48-70>,
  "bust_cm": <number 78-100>,
  "waist_cm": <number 58-72>,
  "hips_cm": <number 85-105>,
  "skin_tone": "<specific shade, e.g. fair porcelain with pink undertones, warm olive with golden undertones, deep brown with cool undertones, light caramel with warm yellow undertones>",
  "hair_color": "<specific shade, e.g. jet black, dark chestnut brown with natural highlights, platinum blonde, honey brown, auburn red>",
  "hair_length": "<short, medium, long, very long>",
  "hair_texture": "<straight, wavy, curly, coily, kinky>",
  "eye_color": "<specific shade, e.g. dark espresso brown, amber hazel with green flecks, steel blue, light grey-green>",
  "face_shape": "<oval, round, square, heart, diamond, oblong>",
  "body_type": "<slim, athletic, slim athletic, curvy, hourglass, pear, petite>",
  "ethnicity_appearance": "<detailed visual ethnic appearance, e.g. Southeast Asian, Northern European, West African, Mixed Latina-European>",
  "distinguishing_features": "<2-3 unique features that make her recognizable, e.g. high cheekbones with natural dimples, beauty mark above upper lip, slightly upturned nose with freckles>",
  "full_description": "<detailed 4-5 sentence physical description for AI portrait generation — MUST include specific natural imperfections like moles, freckles, slight asymmetry, fine lines, skin texture details>"
}`;
}

function buildMalePrompt(input: GenerateProfileInput): string {
  return `You are a fashion industry expert specializing in male fashion models. Generate realistic physical characteristics for a MALE fashion model.

Name: ${input.name}
Gender: Male
${input.age ? `Age: ${input.age}` : ""}
${input.country ? `Country/Origin: ${input.country}` : ""}
${input.style ? `Style: ${input.style}` : ""}

Generate a complete physical profile. Measurements must be realistic for a professional male fashion model of this background. Consider regional features and typical body proportions for men from this origin.

The "full_description" must be a detailed paragraph (4-5 sentences) describing the model's complete physical appearance INCLUDING natural facial imperfections (such as: a small scar on his jawline, visible pores on his nose, subtle crow's feet, a mole on his neck, slightly crooked nose, stubble shadow even when clean-shaven, natural sun damage or freckling, visible Adam's apple). These imperfections make the model look REAL and human. Also describe his jawline definition, brow ridge, and skin texture.

Return ONLY valid JSON (no markdown, no code blocks) with exactly these keys:
{
  "height_cm": <number 175-198>,
  "weight_kg": <number 65-95>,
  "chest_cm": <number 90-115>,
  "waist_cm": <number 72-88>,
  "shoulder_width_cm": <number 44-54>,
  "skin_tone": "<specific shade, e.g. fair with warm undertones, medium tan olive, deep mahogany brown, light bronze>",
  "hair_color": "<specific shade, e.g. dark brown, sandy blonde, jet black, salt-and-pepper grey>",
  "hair_length": "<buzz cut, short, medium, long, shaved>",
  "hair_texture": "<straight, wavy, curly, coily, kinky>",
  "facial_hair": "<clean-shaven, light stubble, heavy stubble, short beard, full beard, mustache, none — note that clean-shaven men still show a shadow>",
  "eye_color": "<specific shade, e.g. dark brown, warm amber, grey-blue, deep green>",
  "face_shape": "<oval, round, square, rectangular, diamond, oblong, triangular>",
  "body_type": "<lean, athletic, muscular lean, slim, broad>",
  "ethnicity_appearance": "<detailed visual ethnic appearance, e.g. East Asian, Southern European, West African, Mixed Middle-Eastern>",
  "distinguishing_features": "<2-3 unique features that make him recognizable, e.g. strong jawline with visible cleft chin, thick eyebrows, prominent cheekbones with light acne scars>",
  "full_description": "<detailed 4-5 sentence physical description for AI portrait generation — MUST include specific natural imperfections like visible pores, stubble texture, slight facial asymmetry, skin texture details, any scars or marks>"
}`;
}

function buildNonBinaryPrompt(input: GenerateProfileInput): string {
  return `You are a fashion industry expert specializing in diverse fashion models. Generate realistic physical characteristics for a NON-BINARY fashion model.

Name: ${input.name}
Gender: Non-binary
${input.age ? `Age: ${input.age}` : ""}
${input.country ? `Country/Origin: ${input.country}` : ""}
${input.style ? `Style: ${input.style}` : ""}

Generate a complete physical profile. Measurements must be realistic. The model can have an androgynous appearance or lean more masculine or feminine — vary it naturally. Consider regional features.

The "full_description" must be a detailed paragraph (4-5 sentences) describing the model's complete physical appearance INCLUDING natural facial imperfections (moles, freckles, slight asymmetry, subtle scars, skin texture, natural fine lines). These imperfections make the model look REAL and human.

Return ONLY valid JSON (no markdown, no code blocks) with exactly these keys:
{
  "height_cm": <number 160-195>,
  "weight_kg": <number 50-85>,
  "bust_cm": <number 78-110>,
  "waist_cm": <number 60-85>,
  "hips_cm": <number 82-110>,
  "skin_tone": "<specific shade with undertone>",
  "hair_color": "<specific shade>",
  "hair_length": "<buzz cut, short, medium, long, very long, shaved>",
  "hair_texture": "<straight, wavy, curly, coily, kinky>",
  "eye_color": "<specific shade>",
  "face_shape": "<oval, round, square, heart, diamond, oblong>",
  "body_type": "<slim, athletic, androgynous lean, curvy, broad>",
  "ethnicity_appearance": "<detailed visual ethnic appearance>",
  "distinguishing_features": "<2-3 unique features>",
  "full_description": "<detailed 4-5 sentence physical description for AI portrait generation — MUST include specific natural imperfections>"
}`;
}

export async function generateModelProfile(
  input: GenerateProfileInput,
): Promise<ModelProfile> {
  const ai = getGeminiClient();

  let prompt: string;
  if (input.gender === "male") {
    prompt = buildMalePrompt(input);
  } else if (input.gender === "female") {
    prompt = buildFemalePrompt(input);
  } else {
    prompt = buildNonBinaryPrompt(input);
  }

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
