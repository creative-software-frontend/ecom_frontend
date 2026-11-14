import { z } from "zod";

const bdPhoneRegex = /^01[3-9]\d{8}$/;

export const createShopSchema = z.object({
  name: z.string().trim().min(1, "Shop name is required").max(150),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid mobile number")
    .optional(),
  address: z.string().trim().max(500).optional(),
  status: z.enum(["active", "inactive", "trial"]).default("active"),
});

export const updateShopSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid mobile number")
    .optional(),
  address: z.string().trim().max(500).optional(),
  status: z.enum(["active", "inactive", "trial"]).optional(),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
