import { z } from "zod";

export const toggleFavoriteSchema = z.object({
  is_favorite: z.boolean(),
});

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
