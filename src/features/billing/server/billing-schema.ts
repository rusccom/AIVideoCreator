import { z } from "zod";

export const checkoutSchema = z.object({
  packageKey: z.string().min(1).max(60)
});
