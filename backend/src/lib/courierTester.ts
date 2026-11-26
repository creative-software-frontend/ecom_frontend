import { decryptSecret, encryptSecret } from "./crypto.js";
import {
  COURIER_ENVIRONMENTS,
  DEFAULT_COURIER_BASE_URLS,
  resolveOfficialCourierBaseUrl,
  supportsCourierSandbox,
  type CourierSlug,
} from "../schemas/courierAccount.schema.js";

/* ================================================================
   Live courier connection probes.

   Security invariants:
   - The endpoint is ALWAYS the official URL for the slug and environment;
     a stored or client-supplied base URL is never used as a fetch target.
   - Decrypted secrets only ever travel in request headers/body, never in
     URLs, responses, logs, or error messages.
   - Every request has a hard 10s timeout and all upstream text is sanitised.
   ================================================================ */

const TIMEOUT_MS = 10_000;
const MAX_MESSAGE_LENGTH = 240;
const BODY_SCAN_LIMIT = 64_000;

export type CourierTestResult = {
  ok: boolean;
  status: "connected" | "error";
  message: string;
  balance?: number | null;
  encryptedAccessToken?: string | null;
};

/** Only the fields a probe needs; the controller row satisfies this shape. */
export type CourierTestAccount = {
  slug: string;
  isSandbox?: boolean;
  baseUrl?: string | null;
  apiKey?: string | null;
  secretKey?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  username?: string | null;
  password?: string | null;
  storeId?: string | null;
  accessToken?: string | null;
  clientContext?: string | null;
};

type ApiResponse = {
  res: Response;
  text: string;
  json: unknown;
};

function isCourierSlug(value: string): value is CourierSlug {
  return Object.prototype.hasOwnProperty.call(DEFAULT_COURIER_BASE_URLS, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIpLiteral(hostname: string): boolean {
  const bare = hostname.replace(/^\[/, "").replace(/\]$/, "");
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(bare) || bare.includes(":");
}

/**
 * Defense in depth: even if an official URL were misconfigured, refuse to
 * probe a non-HTTPS, private, loopback, credential-bearing, or unexpected host.
 */
export function assertOfficialCourierBaseUrl(
  slug: CourierSlug,
  isSandbox = false,
): string {
  if (isSandbox && !supportsCourierSandbox(slug)) {
    throw new Error("Sandbox mode is not available for this courier.");
  }

  const configured = resolveOfficialCourierBaseUrl(slug, isSandbox);
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("Courier endpoint is not configured correctly.");
  }

  const hosts = COURIER_ENVIRONMENTS[slug].hosts;
  const expectedHost = isSandbox ? hosts.sandbox : hosts.production;
  if (
    parsed.protocol !== "https:" ||
    !expectedHost ||
    parsed.hostname !== expectedHost ||
    isIpLiteral(parsed.hostname) ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    throw new Error("Courier endpoint is not configured correctly.");
  }
  return configured;
}

/** Shared redaction helper so dispatch failures cannot leak upstream secrets. */
export function sanitizeMessage(
  input: string,
  secrets: readonly string[] = [],
): string {
  let text = input;
  // Upstreams sometimes echo the submitted credential verbatim. Redact every
  // known decrypted value before any generic pattern-based scrubbing.
  for (const secret of [...secrets].sort((a, b) => b.length - a.length)) {
    if (secret) text = text.split(secret).join("[redacted]");
  }
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(
      /(?:\b(?:with|is|was|equals)\s+)?\b(api[-_ ]?key|secret[-_ ]?key|client[-_ ]?secret|access[-_ ]?token|password)\b(?:\s*[:=]\s*|\s+)(\S+)/gi,
      "$1: [redacted]",
    )
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function failure(message: string): CourierTestResult {
  return {
    ok: false,
    status: "error",
    message: sanitizeMessage(message) || "Connection test failed.",
  };
}

function success(
  message: string,
  extra: Pick<CourierTestResult, "balance" | "encryptedAccessToken"> = {},
): CourierTestResult {
  return { ok: true, status: "connected", message: sanitizeMessage(message), ...extra };
}

function getAtPath(root: unknown, path: readonly string[]): unknown {
  let current = root;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function getString(root: unknown, path: readonly string[]): string | null {
  const value = getAtPath(root, path);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstArray(
  root: unknown,
  paths: readonly (readonly string[])[],
): unknown[] | null {
  for (const path of paths) {
    const value = getAtPath(root, path);
    if (Array.isArray(value)) return value;
  }
  return null;
}

function errorDetail(entry: unknown, label?: string): string | null {
  if (typeof entry === "string") {
    const text = entry.trim();
    return text ? (label ? `${label}: ${text}` : text) : null;
  }
  if (isRecord(entry)) {
    const nested = entry.message ?? entry.error;
    if (typeof nested === "string" && nested.trim()) {
      return label ? `${label}: ${nested.trim()}` : nested.trim();
    }
  }
  return null;
}

/** Parse `message`, `error`, and `errors` without trusting upstream shapes. */
function apiErrorMessage(
  payload: ApiResponse,
  secrets: readonly string[],
): string {
  const { json, text, res } = payload;
  const parts: string[] = [];

  if (isRecord(json)) {
    for (const key of ["message", "error"] as const) {
      const detail = errorDetail(json[key]);
      if (detail) parts.push(detail);
    }
    const errors = json.errors;
    if (typeof errors === "string" || isRecord(errors)) {
      const detail = errorDetail(errors);
      if (detail) parts.push(detail);
    } else if (Array.isArray(errors)) {
      for (const entry of errors) {
        const detail = errorDetail(entry);
        if (detail) parts.push(detail);
      }
    }
    for (const key of ["message", "error"] as const) {
      const detail = errorDetail(getAtPath(json, ["data", key]), key);
      if (detail) parts.push(detail);
    }
  }

  const fallback = text.trim() || `HTTP ${res.status}`;
  return (
    sanitizeMessage(parts.join(" ") || fallback, secrets) || `HTTP ${res.status}`
  );
}

async function request(
  url: string,
  init: RequestInit,
): Promise<ApiResponse> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = (await res.text()).slice(0, BODY_SCAN_LIMIT);
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }
  return { res, text, json };
}

function decryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return decryptSecret(value);
  } catch {
    return null;
  }
}

/** Returns null when entries carry no verifiable id, so we never false-positive. */
function storeIdMatches(
  stores: readonly unknown[],
  storeId: string,
  keys: readonly string[],
): boolean | null {
  const identifiable = stores.filter(
    (entry) =>
      isRecord(entry) &&
      keys.some((key) => entry[key] !== undefined && entry[key] !== null),
  );
  if (identifiable.length === 0) return null;
  return identifiable.some(
    (entry) =>
      isRecord(entry) &&
      keys.some(
        (key) =>
          entry[key] !== undefined &&
          entry[key] !== null &&
          String(entry[key]) === storeId,
      ),
  );
}

async function testSteadfast(
  account: CourierTestAccount,
  baseUrl: string,
): Promise<CourierTestResult> {
  const apiKey = decryptField(account.apiKey);
  const secretKey = decryptField(account.secretKey);
  if (!apiKey || !secretKey) return failure("Steadfast credentials are unavailable.");

  const payload = await request(`${baseUrl}/get_balance`, {
    method: "GET",
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      Accept: "application/json",
    },
  });
  const secrets = [apiKey, secretKey].filter((v): v is string => v !== null);
  if (!payload.res.ok) return failure(apiErrorMessage(payload, secrets));

  const raw = getAtPath(payload.json, ["current_balance"]);
  const balance =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim().length > 0
        ? Number(raw)
        : Number.NaN;
  if (!Number.isFinite(balance)) {
    return failure("Steadfast responded without a valid current balance.");
  }
  return success("Steadfast connection successful.", { balance });
}

async function testPathao(
  account: CourierTestAccount,
  baseUrl: string,
): Promise<CourierTestResult> {
  const clientSecret = decryptField(account.clientSecret);
  const password = decryptField(account.password);
  if (!account.clientId || !clientSecret || !account.username || !password) {
    return failure("Pathao credentials are unavailable.");
  }

  const tokenPayload = await request(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: account.clientId,
      client_secret: clientSecret,
      username: account.username,
      password,
      grant_type: "password",
    }),
  });
  const secrets = [clientSecret, password].filter((v): v is string => v !== null);
  if (!tokenPayload.res.ok) return failure(apiErrorMessage(tokenPayload, secrets));

  const accessToken =
    getString(tokenPayload.json, ["access_token"]) ??
    getString(tokenPayload.json, ["data", "access_token"]) ??
    getString(tokenPayload.json, ["data", "data", "access_token"]);
  if (!accessToken) return failure("Pathao did not return an access token.");

  const storesPayload = await request(`${baseUrl}/aladdin/api/v1/stores`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!storesPayload.res.ok) {
    return failure(apiErrorMessage(storesPayload, [...secrets, accessToken]));
  }

  if (account.storeId) {
    const stores = firstArray(storesPayload.json, [
      ["data", "data"],
      ["data"],
      [],
    ]);
    if (stores && stores.length > 0) {
      const matched = storeIdMatches(stores, account.storeId, ["store_id", "id"]);
      if (matched === false) {
        return failure(
          "Authenticated with Pathao, but Store ID was not found.",
        );
      }
    }
  }

  return success("Pathao connection successful.", {
    encryptedAccessToken: encryptSecret(accessToken),
  });
}

async function testRedx(
  account: CourierTestAccount,
  baseUrl: string,
): Promise<CourierTestResult> {
  const accessToken = decryptField(account.accessToken);
  if (!accessToken) return failure("RedX access token is unavailable.");

  const payload = await request(`${baseUrl}/pickup/stores`, {
    method: "GET",
    headers: {
      "API-ACCESS-TOKEN": `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!payload.res.ok) {
    return failure(apiErrorMessage(payload, [accessToken]));
  }

  if (account.storeId) {
    const stores = firstArray(payload.json, [
      ["pickup_stores"],
      ["data", "pickup_stores"],
      ["data", "data"],
    ]);
    if (stores && stores.length > 0) {
      const matched = storeIdMatches(stores, account.storeId, ["id", "store_id"]);
      if (matched === false) {
        return failure(
          "Authenticated with RedX, but Store ID was not found.",
        );
      }
    }
  }

  return success("RedX connection successful.");
}

async function testCarrybee(
  account: CourierTestAccount,
  baseUrl: string,
): Promise<CourierTestResult> {
  const clientSecret = decryptField(account.clientSecret);
  if (!account.clientId || !clientSecret || !account.clientContext) {
    return failure("Carrybee credentials are unavailable.");
  }

  const payload = await request(`${baseUrl}/api/v2/stores`, {
    method: "GET",
    headers: {
      "Client-ID": account.clientId,
      "Client-Secret": clientSecret,
      "Client-Context": account.clientContext,
      Accept: "application/json",
    },
  });
  if (!payload.res.ok) {
    return failure(apiErrorMessage(payload, [clientSecret]));
  }

  if (account.storeId) {
    const stores = firstArray(payload.json, [
      ["data", "stores"],
      ["data"],
      ["stores"],
    ]);
    if (stores && stores.length > 0) {
      const matched = storeIdMatches(stores, account.storeId, ["id", "store_id"]);
      if (matched === false) {
        return failure(
          "Authenticated with Carrybee, but Store ID was not found.",
        );
      }
    }
  }

  return success("Carrybee connection successful.");
}

/** Runs one live probe; never throws and never returns decrypted secrets. */
export async function testCourierConnection(
  account: CourierTestAccount,
): Promise<CourierTestResult> {
  try {
    if (!isCourierSlug(account.slug)) {
      return failure("Unsupported courier.");
    }
    const slug: CourierSlug = account.slug;
    const sandbox = Boolean(account.isSandbox);
    // account.baseUrl is deliberately ignored: only the official URL for the
    // selected environment can be a probe target, so a poisoned stored value
    // cannot cause SSRF.
    const baseUrl = assertOfficialCourierBaseUrl(slug, sandbox);

    switch (slug) {
      case "steadfast":
        return await testSteadfast(account, baseUrl);
      case "pathao":
        return await testPathao(account, baseUrl);
      case "redx":
        return await testRedx(account, baseUrl);
      case "carrybee":
        return await testCarrybee(account, baseUrl);
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return failure("Courier API request timed out. Please try again.");
    }
    if (
      error instanceof Error &&
      (error.message.includes("not configured") ||
        error.message.includes("Sandbox mode is not available"))
    ) {
      return failure(error.message);
    }
    return failure("Could not reach the courier API. Please try again.");
  }
}
