import { z } from "zod";

export const COURIER_SLUGS = [
  "steadfast",
  "pathao",
  "redx",
  "carrybee",
] as const;

export type CourierSlug = (typeof COURIER_SLUGS)[number];

/** Official, read-only endpoints. Never accept a client-supplied base URL. */
export const DEFAULT_COURIER_BASE_URLS: Record<CourierSlug, string> = {
  steadfast: "https://portal.packzy.com/api/v1",
  pathao: "https://courier-api-sandbox.pathao.com",
  redx: "https://sandbox.redx.com.bd/v1.0.0-beta",
  carrybee: "https://sandbox.carrybee.com",
};

/** Derived from the defaults so the allow-list cannot drift from the URLs. */
export const COURIER_ALLOWED_HOSTNAMES: Record<CourierSlug, string> = {
  steadfast: new URL(DEFAULT_COURIER_BASE_URLS.steadfast).hostname,
  pathao: new URL(DEFAULT_COURIER_BASE_URLS.pathao).hostname,
  redx: new URL(DEFAULT_COURIER_BASE_URLS.redx).hostname,
  carrybee: new URL(DEFAULT_COURIER_BASE_URLS.carrybee).hostname,
};

export function isOfficialCourierBaseUrl(
  slug: CourierSlug,
  url: string,
): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === COURIER_ALLOWED_HOSTNAMES[slug] &&
      parsed.username === "" &&
      parsed.password === ""
    );
  } catch {
    return false;
  }
}

const identifier = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or less`)
    .nullable()
    .optional();

// `baseUrl` is intentionally absent: z.object strips any client-supplied value
// and the controller always writes DEFAULT_COURIER_BASE_URLS[slug] (SSRF guard).

// Secrets are never trimmed: tokens and keys may legitimately contain spaces.
// `undefined` preserves the stored ciphertext; an empty string also preserves
// it (only the explicit disconnect endpoint clears credentials).
const secretInput = z.string().max(2000, "Value is too long").optional();

export const upsertCourierAccountSchema = z.object({
  enabled: z.boolean().optional(),
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
