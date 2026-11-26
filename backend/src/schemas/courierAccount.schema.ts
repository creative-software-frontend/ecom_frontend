import { z } from "zod";

export const COURIER_SLUGS = [
  "steadfast",
  "pathao",
  "redx",
  "carrybee",
] as const;

export type CourierSlug = (typeof COURIER_SLUGS)[number];

type CourierEnvironment = {
  production: string;
  sandbox: string | null;
  hosts: {
    production: string;
    sandbox: string | null;
  };
};

/** Host allow-lists are derived from the URLs so they cannot drift. */
function environment(production: string, sandbox: string | null): CourierEnvironment {
  return {
    production,
    sandbox,
    hosts: {
      production: new URL(production).hostname,
      sandbox: sandbox === null ? null : new URL(sandbox).hostname,
    },
  };
}

/** Official, server-owned endpoints. Never accept a client-supplied base URL. */
export const COURIER_ENVIRONMENTS: Record<CourierSlug, CourierEnvironment> = {
  steadfast: environment("https://portal.packzy.com/api/v1", null),
  pathao: environment(
    "https://api-hermes.pathao.com",
    "https://courier-api-sandbox.pathao.com",
  ),
  redx: environment(
    "https://openapi.redx.com.bd/v1.0.0-beta",
    "https://sandbox.redx.com.bd/v1.0.0-beta",
  ),
  carrybee: environment(
    "https://developers.carrybee.com",
    "https://sandbox.carrybee.com",
  ),
};

/** Kept as the canonical production-only map for legacy callers. */
export const DEFAULT_COURIER_BASE_URLS: Record<CourierSlug, string> = {
  steadfast: COURIER_ENVIRONMENTS.steadfast.production,
  pathao: COURIER_ENVIRONMENTS.pathao.production,
  redx: COURIER_ENVIRONMENTS.redx.production,
  carrybee: COURIER_ENVIRONMENTS.carrybee.production,
};

export function supportsCourierSandbox(slug: CourierSlug): boolean {
  return COURIER_ENVIRONMENTS[slug].sandbox !== null;
}

/** Sandbox falls back to production whenever no official sandbox exists. */
export function resolveOfficialCourierBaseUrl(
  slug: CourierSlug,
  isSandbox: boolean,
): string {
  const config = COURIER_ENVIRONMENTS[slug];
  return isSandbox && config.sandbox !== null ? config.sandbox : config.production;
}

export function isOfficialCourierBaseUrl(
  slug: CourierSlug,
  url: string,
  isSandbox = false,
): boolean {
  const hosts = COURIER_ENVIRONMENTS[slug].hosts;
  const expectedHost = isSandbox ? hosts.sandbox : hosts.production;
  if (!expectedHost) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === expectedHost &&
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
// and the controller always derives it from COURIER_ENVIRONMENTS (SSRF guard).

// Secrets are never trimmed: tokens and keys may legitimately contain spaces.
// `undefined` preserves the stored ciphertext; an empty string also preserves
// it (only the explicit disconnect endpoint clears credentials).
const secretInput = z.string().max(2000, "Value is too long").optional();

export const upsertCourierAccountSchema = z.object({
  enabled: z.boolean().optional(),
  isSandbox: z.boolean().optional(),
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

export const toggleCourierSandboxSchema = z.object({
  isSandbox: z.boolean({ error: "isSandbox must be a boolean" }),
});

export type UpsertCourierAccountInput = z.infer<
  typeof upsertCourierAccountSchema
>;
