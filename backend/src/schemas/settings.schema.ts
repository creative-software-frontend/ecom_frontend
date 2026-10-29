import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a store name.")
    .max(100, "Store name must be 100 characters or fewer."),
  url: z
    .string()
    .trim()
    .min(1, "Enter a website URL.")
    .max(200, "URL must be 200 characters or fewer."),
  tagline: z
    .string()
    .trim()
    .min(1, "Enter a tagline.")
    .max(200, "Tagline must be 200 characters or fewer."),
  currency: z
    .string()
    .trim()
    .min(1, "Enter a currency code.")
    .max(10, "Currency code must be 10 characters or fewer."),
  currency_symbol: z
    .string()
    .trim()
    .min(1, "Enter a currency symbol.")
    .max(10, "Currency symbol must be 10 characters or fewer."),
  language: z
    .string()
    .trim()
    .min(1, "Enter a language code.")
    .max(10, "Language code must be 10 characters or fewer."),
  contact: z.object({
    phone: z
      .string()
      .trim()
      .min(1, "Enter a contact phone number.")
      .max(30, "Phone number must be 30 characters or fewer."),
    whatsapp: z
      .string()
      .trim()
      .min(1, "Enter a WhatsApp number.")
      .max(30, "WhatsApp number must be 30 characters or fewer."),
  }),
  delivery: z.object({
    method: z
      .string()
      .trim()
      .min(1, "Enter a delivery method.")
      .max(100, "Delivery method must be 100 characters or fewer."),
    note: z
      .string()
      .trim()
      .max(300, "Delivery note must be 300 characters or fewer."),
    free_delivery: z.boolean(),
    delivery_charge: z.coerce
      .number()
      .min(0, "Delivery charge cannot be negative."),
  }),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

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

    if (!(field in errors)) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

