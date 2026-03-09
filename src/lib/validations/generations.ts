import { z } from "zod";

const outputTypeEnum = z.enum(["image", "video"]);

export const generationConfigSchema = z.object({
  accessory_set: z.string().optional(),
  location: z.string().optional(),
  pose: z.string().optional(),
  lighting: z.string().optional(),
  framing: z.string().optional(),
  camera_angle: z.string().optional(),
});

export const createGenerationSchema = z.object({
  model_id: z.string().uuid(),
  garment_id: z.string().uuid(),
  config: generationConfigSchema.optional().default({}),
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
