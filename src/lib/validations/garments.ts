import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const createGarmentSchema = z.object({
  image: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be less than 10MB",
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported",
    ),
});

export const createGarmentFromUrlSchema = z.object({
  image_url: z.string().url(),
  description: z.string().max(1000).optional(),
});

export type CreateGarmentInput = z.infer<typeof createGarmentSchema>;
export type CreateGarmentFromUrlInput = z.infer<
  typeof createGarmentFromUrlSchema
>;
