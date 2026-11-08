import { z } from "zod";

// Only password-related schema remains.
// Store settings schema lives in storeSettings.v2.ts.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function formatSettingsValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    if (!(field in errors)) errors[field] = issue.message;
  }
  return errors;
}
