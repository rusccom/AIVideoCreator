import { z } from "zod";

export const checkoutSchema = z.object({
  priceId: z.string().min(3)
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
