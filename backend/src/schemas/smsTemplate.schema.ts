import { z } from "zod";

export const smsTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Template name is required")
    .max(100, "Template name must be 100 characters or fewer"),
  message: z
    .string()
    .trim()
    .min(1, "Template message is required")
    .max(1600, "Template message must be 1600 characters or fewer"),
});
