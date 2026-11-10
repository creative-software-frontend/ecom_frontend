import { z } from "zod";

const bdPhoneRegex = /^01[3-9]\d{8}$/;

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  name: z.string().trim().min(1, "Name is required").max(120),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid mobile number")
    .optional(),
  password: z.string().min(12, "Password must be at least 12 characters"),
  roleId: z.coerce.number().int().positive("Select a valid role"),
  shopId: z.coerce.number().int().positive().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid mobile number")
    .optional(),
  roleId: z.coerce.number().int().positive().optional(),
  shopId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const resetUserPasswordSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
