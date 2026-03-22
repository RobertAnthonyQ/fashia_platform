import { getGeminiClient } from "./gemini";

interface GenerateFaceInput {
  fullDescription: string;
  name: string;
  gender: string;
}

function buildGenderSkinDetails(gender: string): string {
  if (gender === "male") {
    return `
- Skin: visible individual pores especially on nose, cheeks and forehead — male skin has LARGER, more visible pores than female skin. Natural skin texture with deeper expression lines around mouth and forehead. Fine vellus hair visible on cheeks plus coarser facial hair follicles visible even if clean-shaven (blue-grey shadow under skin on jaw, chin, upper lip). Natural skin imperfections — tiny moles, subtle sun damage spots, minor acne scars or enlarged pores on cheeks, possible ingrown hair marks near jawline. Realistic subsurface scattering showing warm tones. Slightly oilier T-zone texture. Possible small scar somewhere on face (eyebrow, chin, or cheek)
- Jawline: clearly defined with visible bone structure, natural shadows under jaw, visible tendons when jaw is relaxed
- Eyebrows: thicker, bushier brows with some unruly hairs, natural asymmetry between left and right brow, individual coarse hairs with natural growth direction
- Adam's apple: slightly visible at neck/chin boundary
- Facial hair texture: even if clean-shaven, individual follicle dots must be visible on chin, upper lip, and jaw area — this is critical for male realism`;
  }

  if (gender === "female") {
    return `
- Skin: visible individual pores on nose and inner cheeks (finer texture than male skin). Natural skin texture with subtle micro-wrinkles around eyes (crow's feet beginning) and faint smile lines from nose to mouth corners. Fine vellus hair (peach fuzz) visible on cheeks, upper lip, and jawline catching the light — this is CRITICAL for realism, all real women have visible peach fuzz. Natural skin imperfections — tiny beauty marks or moles (1-3 on face), subtle freckles (even faint ones from sun exposure), possible minor hormonal blemish or two, slightly uneven skin tone between cheeks and forehead. Realistic subsurface scattering showing warm pink tones under thin skin (nose tip, eyelids, ear edges). Natural under-eye area with faint blue-purple vein visibility through thin skin
- Eyebrows: natural feminine brow shape but with individual hairs visible, slight asymmetry between brows, some baby hairs at the inner corners, natural arch
- Lips: naturally pigmented with slight color difference between upper and lower lip, fine vertical lip lines, natural moisture`;
  }

  // Non-binary
  return `
- Skin: visible pores across face with natural density variation. Skin texture with realistic micro-wrinkles and expression lines appropriate for age. Fine vellus hair visible on cheeks and jawline. Natural skin imperfections — moles, subtle freckles, minor blemishes, slightly uneven skin tone. Subsurface scattering with warm undertones visible through thin skin areas
- Eyebrows: natural shape with individual hairs visible, slight asymmetry, natural growth pattern
- Features: natural and authentic, avoiding overly gendered characteristics`;
}

/**
 * Generates a face portrait image using Gemini 2.5 Flash Image model.
 * Returns a Buffer of the generated image (PNG/JPEG).
 */
export async function generateFaceImage(
  input: GenerateFaceInput,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const ai = getGeminiClient();

  const genderLabel =
    input.gender === "male"
      ? "male"
      : input.gender === "female"
        ? "female"
        : "androgynous";

  const skinDetails = buildGenderSkinDetails(input.gender);

  const prompt = `Ultra-realistic close-up face reference photograph for a fashion model identity card. Shot on Canon EOS R5 with 105mm macro f/2.8 lens. This is a FACE-ONLY reference photo used to maintain facial identity consistency across multiple photoshoots.

Subject: ${input.name}, ${genderLabel} fashion model.
Physical appearance: ${input.fullDescription}

FRAMING — FACE ONLY:
- Tight crop: from forehead hairline to chin, ear to ear
- Face fills 90% of the frame — this is a face reference, not a portrait
- Perfectly frontal angle, symmetrical face position
- Neutral expression with mouth closed, relaxed jaw — like a passport photo but beautiful
- Eyes looking straight into the lens

ULTRA-REALISTIC FACE DETAIL — every facial feature must be hyper-detailed:
${skinDetails}
- Eyes: ultra-detailed iris with visible radial fibers, crypts and collarette ring. Natural catchlight from a ring light reflected in both eyes. Individual eyelashes of varying lengths and thickness, some crossing over each other. Subtle red micro-veins in the sclera corners. Natural moisture reflection on the eyeball surface. Visible waterline and tear duct detail. IMPORTANT: slight natural asymmetry between left and right eye — no human has perfectly symmetrical eyes
- Lips: fine vertical lip lines (lip wrinkles), natural moisture sheen, realistic color gradient from center to edges, visible cupid's bow definition, slight natural asymmetry between left and right lip corner. Subtle dry skin flakes at lip edges for realism
- Nose: visible pore texture especially on nose tip and sides, natural sebaceous filaments (tiny dark dots), subtle shadow in nostrils, realistic nose bridge highlight, possible slight crookedness or asymmetry — very few real noses are perfectly straight
- Ears (partially visible): fine cartilage detail, natural skin tone variation (slightly redder than face), visible fine hair
- Hairline: natural irregular hairline with baby hairs, individual strands visible at the forehead edge, realistic hair density transition, possible slight widow's peak or uneven hairline

NATURAL IMPERFECTIONS — CRITICAL FOR REALISM:
- The face MUST have 3-5 visible natural imperfections such as: small moles, beauty marks, faint acne scars, enlarged pores in some areas, subtle discoloration or hyperpigmentation, a tiny scar, visible blood vessels near nose or under eyes, slight dark circles, uneven lip color, minor sun spots
- LEFT-RIGHT ASYMMETRY: one eye slightly smaller, one eyebrow slightly higher, one nostril slightly different, one ear slightly higher — real faces are NEVER perfectly symmetrical
- SKIN TEXTURE VARIATION: forehead has different texture than cheeks, T-zone has slightly different sheen, perioral area has different texture than forehead

LIGHTING — clean and even for reference:
- Flat beauty lighting: large ring light or butterfly lighting setup directly in front
- Even illumination across entire face — minimal shadows to show all facial features clearly
- Subtle fill light eliminating under-chin and under-nose shadows
- No dramatic shadows, no moody lighting — this is a reference photo

TECHNICAL:
- Pure white background (#FFFFFF)
- Zero makeup or very minimal no-makeup makeup look — must look like natural bare skin
- Hair pulled back or naturally framing the face but not covering any facial features
- Sharp focus across entire face plane — f/8 deep focus, no bokeh
- ISO 100, zero noise, maximum detail
- Color-accurate white balance, neutral color grading

CRITICAL: This must be INDISTINGUISHABLE from a real photograph of a real human face. Do NOT generate illustration, 3D render, AI-looking smooth skin, plastic-looking eyes, or any stylized look. The face MUST have natural human asymmetry and imperfections. AI-generated faces are typically TOO PERFECT — deliberately add subtle flaws. No text, watermarks, or logos.`;

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-image",
    config: {
      responseModalities: ["IMAGE", "TEXT"],
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  for await (const chunk of response) {
    if (!chunk.candidates?.[0]?.content?.parts) continue;

    const part = chunk.candidates[0].content.parts[0];
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data || "", "base64");
      const mimeType = part.inlineData.mimeType || "image/png";
      return { buffer, mimeType };
    }
  }

  throw new Error("No image was generated by the AI model");
}
