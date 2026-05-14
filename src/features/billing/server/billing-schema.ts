import { z } from "zod";
import { topUpPackageKeys } from "../data/top-up-packages";

export const checkoutSchema = z.object({
  packageKey: z.enum(topUpPackageKeys)
});
