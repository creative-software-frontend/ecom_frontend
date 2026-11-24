import { z } from "zod";

const bdPhoneRegex = /^01[3-9]\d{8}$/;

const mobileSchema = z
  .string()
  .trim()
  .refine((value) => !value || bdPhoneRegex.test(value), "Enter a valid mobile number")
  .nullable()
  .optional();

export const createShopUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  name: z.string().trim().min(1, "Name is required").max(120),
  mobile: mobileSchema,
  password: z.string().min(12, "Password must be at least 12 characters"),
  roleId: z.coerce.number().int().positive("Select a valid role"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateShopUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  mobile: mobileSchema,
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const resetShopUserPasswordSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters"),
});
