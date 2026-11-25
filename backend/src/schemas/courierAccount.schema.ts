import { z } from "zod";

export const COURIER_SLUGS = [
  "steadfast",
  "pathao",
  "redx",
  "carrybee",
] as const;

export type CourierSlug = (typeof COURIER_SLUGS)[number];

export const COURIER_BASE_URLS: Record<CourierSlug, string> = {
  steadfast: "https://portal.packzy.com/api/v1",
  pathao: "https://api-hermes.pathao.com",
  redx: "https://openapi.redx.com.bd/v1.0.0-beta",
  carrybee: "https://developers.carrybee.com",
};

const identifier = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or less`)
    .nullable()
    .optional();

const baseUrl = z
  .string()
  .trim()
  .max(255, "Base URL must be 255 characters or less")
  .refine((value) => {
    if (!/^https?:\/\//.test(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid URL starting with http:// or https://");

// Secrets are never trimmed: tokens and keys may legitimately contain spaces.
// `undefined` preserves the stored ciphertext; an empty string also preserves
// it (only the explicit disconnect endpoint clears credentials).
const secretInput = z.string().max(2000, "Value is too long").optional();

export const upsertCourierAccountSchema = z.object({
  enabled: z.boolean().optional(),
  baseUrl: baseUrl.nullable().optional(),
  clientId: identifier(255, "Client ID"),
  username: identifier(255, "Username"),
  storeId: identifier(255, "Store ID"),
  clientContext: identifier(255, "Client context"),
  apiKey: secretInput,
  secretKey: secretInput,
  clientSecret: secretInput,
  password: secretInput,
  accessToken: secretInput,
});

export const toggleCourierAccountSchema = z.object({
  enabled: z.boolean({ error: "enabled must be a boolean" }),
});

export type UpsertCourierAccountInput = z.infer<
  typeof upsertCourierAccountSchema
>;
