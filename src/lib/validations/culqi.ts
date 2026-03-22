import { z } from "zod";

export const createChargeSchema = z.object({
  token_id: z.string().min(1, "Token is required"),
  package_id: z.string().min(1, "Package is required"),
  quantity: z.number().int().min(10).optional(),
});

export type CreateChargeInput = z.infer<typeof createChargeSchema>;
