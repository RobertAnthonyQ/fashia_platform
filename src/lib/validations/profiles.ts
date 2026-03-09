import { z } from "zod";
import type { Json } from "@/src/types/database";

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  country: z.string().min(1).max(100).optional(),
  company_name: z.string().min(1).max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateProfileInput = Omit<
  z.infer<typeof updateProfileSchema>,
  "metadata"
> & {
  metadata?: Json;
};
