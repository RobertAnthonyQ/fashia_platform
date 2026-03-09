import { z } from "zod";

const genderEnum = z.enum(["male", "female", "non_binary"]);

export const createFashionModelSchema = z.object({
  name: z.string().min(1).max(255),
  gender: genderEnum,
  country: z.string().min(1).max(100).optional(),
  age: z.number().int().min(16).max(80).optional(),
  style: z.string().min(1).max(255).optional(),
  ref_face_url: z.string().url().optional(),
});

export const updateFashionModelSchema = createFashionModelSchema.partial();

export type CreateFashionModelInput = z.infer<typeof createFashionModelSchema>;
export type UpdateFashionModelInput = z.infer<typeof updateFashionModelSchema>;
