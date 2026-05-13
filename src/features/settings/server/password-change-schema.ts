import { z } from "zod";

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(200),
  newPassword: z.string().min(8).max(200),
  confirmPassword: z.string().min(8).max(200)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
});

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
