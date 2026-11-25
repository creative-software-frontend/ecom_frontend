import { z } from "zod";
import { BD_DIVISIONS } from "../constants/division.js";

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
  division: z.enum(BD_DIVISIONS).default("Dhaka"),
  ownerName: z.string().trim().max(120).optional(),
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
  division: z.enum(BD_DIVISIONS).optional(),
  ownerName: z.string().trim().max(120).optional(),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
