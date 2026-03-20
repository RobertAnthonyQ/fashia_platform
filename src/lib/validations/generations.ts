import { z } from "zod";

const outputTypeEnum = z.enum(["image", "video"]);

export const generationConfigSchema = z.object({
  accessory_set: z.string().optional(),
  location: z.string().optional(),
  pose: z.string().optional(),
  lighting: z.string().optional(),
  garment_description: z.string().optional(),
  image_model: z
    .enum(["gemini-3-pro-image-preview", "gemini-2.5-flash-image"])
    .optional()
    .default("gemini-2.5-flash-image"),
});

export const createGenerationSchema = z.object({
  model_id: z.string().uuid(),
  garment_id: z.string().uuid(),
  config: generationConfigSchema.optional(),
  output_type: outputTypeEnum.optional().default("image"),
});

export const generationFiltersSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  garment_id: z.string().uuid().optional(),
  model_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type GenerationConfig = z.infer<typeof generationConfigSchema>;
export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
export type GenerationFilters = z.infer<typeof generationFiltersSchema>;
