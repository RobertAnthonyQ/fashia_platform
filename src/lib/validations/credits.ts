import { z } from "zod";

export const purchaseCreditsSchema = z.object({
  amount: z.number().int().min(1),
  payment_method: z.string().min(1),
});

export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;
