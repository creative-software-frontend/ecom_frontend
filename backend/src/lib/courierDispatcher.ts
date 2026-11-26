import type { Prisma } from "../../generated/prisma/client.js";
import {
  COURIER_SLUGS,
  type CourierSlug,
} from "../schemas/courierAccount.schema.js";
import {
  assertOfficialCourierBaseUrl,
  sanitizeMessage,
} from "./courierTester.js";
import { decryptSecret, encryptSecret } from "./crypto.js";

/* ================================================================
   Courier location lookups + parcel booking.

   Security invariants:
   - account.baseUrl is NEVER used; every call resolves the official,
     environment-specific URL via assertOfficialCourierBaseUrl().
   - Decrypted credentials only live in local variables and upstream
     request headers. They are never returned or persisted.
   - Upstream payloads are redacted recursively before being stored as
     rawResponse or surfaced as an error message.
   ================================================================ */

const TIMEOUT_MS = 15_000;
const BODY_SCAN_LIMIT = 64_000;
const MAX_JSON_KEYS = 40;
const MAX_JSON_ITEMS = 30;

export type DispatchAccount = {
  slug: string;
  isSandbox: boolean;
  apiKey: string | null;
  secretKey: string | null;
  clientId: string | null;
  clientSecret: string | null;
  username: string | null;
  password: string | null;
  storeId: string | null;
  accessToken: string | null;
  clientContext: string | null;
};

export type DispatchOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string | null;
  courierNote: string | null;
  total: number;
  advance: number;
  paymentStatus: string;
  items: { quantity: number; product: { name: string } }[];
};

export type DispatchParams = {
  courierSlug: CourierSlug;
  cityId?: number;
  zoneId?: number;
  areaId?: number;
  areaName?: string;
  itemWeight?: number;
  note?: string;
  confirmFirst?: boolean;
};

export type CourierLocationOption = {
  id: number;
  name: string;
  districtName?: string;
};

export type CourierLocationResult = {
  ok: boolean;
  options: CourierLocationOption[];
  message: string;
  encryptedAccessToken?: string | null;
};

export type DispatchResult = {
  ok: boolean;
  message: string;
  consignmentId: string | null;
  trackingCode: string | null;
  courierStatus: string | null;
  deliveryFee: number | null;
  rawResponse: Prisma.InputJsonValue | null;
  /** Set only when a Pathao token was issued/refreshed; already encrypted. */
  encryptedAccessToken?: string | null;
};

type ApiPayload = {
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
};

type Path = readonly string[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedSlug(value: string): value is CourierSlug {
  return (COURIER_SLUGS as readonly string[]).includes(value);
}

function getAtPath(root: unknown, path: Path): unknown {
  let current = root;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function firstArray(root: unknown, paths: readonly Path[]): unknown[] | null {
  for (const path of paths) {
    const value = getAtPath(root, path);
    if (Array.isArray(value)) return value;
  }
  return null;
}

function readString(
  root: unknown,
  paths: readonly Path[],
): string | null {
  for (const path of paths) {
    const value = getAtPath(root, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readId(root: unknown, paths: readonly Path[]): number | null {
  for (const path of paths) {
    const value = getAtPath(root, path);
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
      return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      const parsed = Number(value.trim());
      if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}

function readTrackingValue(root: unknown, paths: readonly Path[]): string | null {
  for (const path of paths) {
    const value = getAtPath(root, path);
    if (
      (typeof value === "string" || typeof value === "number") &&
      String(value).trim()
    ) {
      return String(value).trim().slice(0, 120);
    }
  }
  return null;
}

async function request(url: string, init: RequestInit): Promise<ApiPayload> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json", ...init.headers },
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
  return { ok: res.ok, status: res.status, json, text };
}

function addSecret(secrets: string[], value: string | null): string | null {
  if (!value || secrets.includes(value)) return value;
  secrets.push(value);
  return value;
}

function decryptField(value: string | null, secrets: string[]): string | null {
  if (!value) return null;
  try {
    return addSecret(secrets, decryptSecret(value));
  } catch {
    return null;
  }
}

/** Removes every known secret and every credential-looking key/value. */
function redactJson(
  value: unknown,
  secrets: readonly string[],
  depth = 0,
): Prisma.InputJsonValue | null {
  if (depth > 8) return "[truncated]";
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    return sanitizeMessage(value, secrets) || null;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_JSON_ITEMS)
      .map((entry) => redactJson(entry, secrets, depth + 1))
      .filter((entry): entry is Prisma.InputJsonValue => entry !== null);
  }
  if (!isRecord(value)) return null;

  const result: Record<string, Prisma.InputJsonValue> = {};
  let count = 0;
  for (const [key, entry] of Object.entries(value)) {
    if (count >= MAX_JSON_KEYS) {
      result.__truncated__ = true;
      break;
    }
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      /(?:apikey|secretkey|clientsecret|accesstoken|authtoken|refreshtoken|authorization|password|bearer|credential|signature)/.test(
        normalized,
      )
    ) {
      result[key] = "[redacted]";
      count += 1;
      continue;
    }
    const safe = redactJson(entry, secrets, depth + 1);
    if (safe !== null) {
      result[key] = safe;
      count += 1;
    }
  }
  return result;
}

function errorDetail(entry: unknown): string | null {
  if (typeof entry === "string" && entry.trim()) return entry.trim();
  if (isRecord(entry)) {
    const value = entry.message ?? entry.error;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function upstreamError(
  payload: ApiPayload,
  secrets: readonly string[],
): string {
  const parts: string[] = [];
  if (isRecord(payload.json)) {
    for (const key of ["message", "error"] as const) {
      const detail = errorDetail(payload.json[key]);
      if (detail) parts.push(detail);
    }
    const errors = payload.json.errors;
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
      const detail = errorDetail(getAtPath(payload.json, ["data", key]));
      if (detail) parts.push(detail);
    }
  }
  return (
    sanitizeMessage(
      parts.join(" ") || payload.text.trim() || `HTTP ${payload.status}`,
      secrets,
    ) || `HTTP ${payload.status}`
  );
}

function safeError(error: unknown, secrets: readonly string[]): string {
  if (error instanceof Error) {
    const name = error.name;
    if (name === "TimeoutError" || name === "AbortError") {
      return "Courier API request timed out. Please try again.";
    }
    if (
      error.message.includes("not configured") ||
      error.message.includes("Sandbox mode is not available")
    ) {
      return sanitizeMessage(error.message, secrets);
    }
  }
  return "Could not reach the courier API. Please try again.";
}

function locationFailure(message: string): CourierLocationResult {
  return { ok: false, options: [], message: sanitizeMessage(message) };
}

function dispatchFailure(
  message: string,
  rawResponse: Prisma.InputJsonValue | null = null,
): DispatchResult {
  return {
    ok: false,
    message: sanitizeMessage(message),
    consignmentId: null,
    trackingCode: null,
    courierStatus: null,
    deliveryFee: null,
    rawResponse,
  };
}

function optionFrom(value: unknown): CourierLocationOption | null {
  if (!isRecord(value)) return null;
  const id = readId(value, [
    ["id"],
    ["city_id"],
    ["zone_id"],
    ["area_id"],
    ["value"],
  ]);
  const name = readString(value, [
    ["name"],
    ["city_name"],
    ["zone_name"],
    ["area_name"],
    ["title"],
    ["label"],
  ]);
  if (id === null || !name) return null;
  const district = readString(value, [["districtName"], ["district_name"]]);
  return {
    id,
    name: name.slice(0, 150),
    ...(district ? { districtName: district.slice(0, 150) } : {}),
  };
}

function optionsFrom(root: unknown, paths: readonly Path[]) {
  const entries = firstArray(root, paths) ?? [];
  const options: CourierLocationOption[] = [];
  const seen = new Set<number>();
  for (const entry of entries) {
    const option = optionFrom(entry);
    if (option && !seen.has(option.id)) {
      seen.add(option.id);
      options.push(option);
    }
  }
  return options;
}

/* ---------------------------------------------------------------- */
/* Pathao token + request helpers                                   */
/* ---------------------------------------------------------------- */

async function issuePathaoToken(
  account: DispatchAccount,
  baseUrl: string,
  clientSecret: string,
  password: string,
  secrets: string[],
): Promise<string | null> {
  if (!account.clientId) return null;
  const payload = await request(
    `${baseUrl}/aladdin/api/v1/issue-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: account.clientId,
        client_secret: clientSecret,
        username: account.username,
        password,
        grant_type: "password",
      }),
    },
  );
  if (!payload.ok) return null;
  const token = readString(payload.json, [
    ["access_token"],
    ["data", "access_token"],
    ["data", "data", "access_token"],
  ]);
  return token ? addSecret(secrets, token) : null;
}

async function pathaoCall(
  account: DispatchAccount,
  baseUrl: string,
  path: string,
  method: "GET" | "POST",
  body: unknown,
  accessToken: string | null,
  secrets: string[],
): Promise<{ payload: ApiPayload; newToken: string | null }> {
  const clientSecret = decryptField(account.clientSecret, secrets);
  const password = decryptField(account.password, secrets);
  if (!account.clientId || !clientSecret || !password) {
    throw new Error("Pathao credentials are unavailable.");
  }

  const send = (token: string) =>
    request(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  let token = accessToken;
  let newToken: string | null = null;
  if (!token) {
    token = await issuePathaoToken(
      account,
      baseUrl,
      clientSecret,
      password,
      secrets,
    );
    if (!token) throw new Error("Pathao did not return an access token.");
    newToken = token;
  }

  let payload = await send(token);
  if (payload.status === 401) {
    const refreshed = await issuePathaoToken(
      account,
      baseUrl,
      clientSecret,
      password,
      secrets,
    );
    if (!refreshed) return { payload, newToken };
    addSecret(secrets, refreshed);
    token = refreshed;
    newToken = refreshed;
    payload = await send(token);
  }
  return { payload, newToken };
}

/* ---------------------------------------------------------------- */
/* Location lookups                                                 */
/* ---------------------------------------------------------------- */

export async function fetchCourierCities(
  account: DispatchAccount,
): Promise<CourierLocationResult> {
  const secrets: string[] = [];
  try {
    if (!isSupportedSlug(account.slug)) {
      return locationFailure("Unsupported courier.");
    }
    const baseUrl = assertOfficialCourierBaseUrl(account.slug, account.isSandbox);

    if (account.slug === "pathao") {
      const token = decryptField(account.accessToken, secrets);
      const { payload, newToken } = await pathaoCall(
        account,
        baseUrl,
        "/aladdin/api/v1/city-list",
        "GET",
        undefined,
        token,
        secrets,
      );
      if (!payload.ok) {
        return {
          ...locationFailure(upstreamError(payload, secrets)),
          ...(newToken
            ? { encryptedAccessToken: encryptSecret(newToken) }
            : {}),
        };
      }
      return {
        ok: true,
        options: optionsFrom(payload.json, [
          ["data", "data"],
          ["data"],
          [],
        ]),
        message: "Cities loaded.",
        ...(newToken ? { encryptedAccessToken: encryptSecret(newToken) } : {}),
      };
    }

    if (account.slug === "carrybee") {
      const clientSecret = decryptField(account.clientSecret, secrets);
      if (!account.clientId || !clientSecret || !account.clientContext) {
        return locationFailure("Carrybee credentials are unavailable.");
      }
      const payload = await request(`${baseUrl}/api/v2/cities`, {
        method: "GET",
        headers: {
          "Client-ID": account.clientId,
          "Client-Secret": clientSecret,
          "Client-Context": account.clientContext,
        },
      });
      if (!payload.ok) return locationFailure(upstreamError(payload, secrets));
      return {
        ok: true,
        options: optionsFrom(payload.json, [
          ["data", "cities"],
          ["data", "data"],
          ["cities"],
          ["data"],
          [],
        ]),
        message: "Cities loaded.",
      };
    }

    return locationFailure("City lookup is not available for this courier.");
  } catch (error) {
    return locationFailure(safeError(error, secrets));
  }
}

export async function fetchCourierZones(
  account: DispatchAccount,
  cityId: number,
): Promise<CourierLocationResult> {
  const secrets: string[] = [];
  try {
    if (!isSupportedSlug(account.slug)) {
      return locationFailure("Unsupported courier.");
    }
    const baseUrl = assertOfficialCourierBaseUrl(account.slug, account.isSandbox);

    if (account.slug === "pathao") {
      const token = decryptField(account.accessToken, secrets);
      const { payload, newToken } = await pathaoCall(
        account,
        baseUrl,
        `/aladdin/api/v1/cities/${cityId}/zone-list`,
        "GET",
        undefined,
        token,
        secrets,
      );
      if (!payload.ok) {
        return {
          ...locationFailure(upstreamError(payload, secrets)),
          ...(newToken
            ? { encryptedAccessToken: encryptSecret(newToken) }
            : {}),
        };
      }
      return {
        ok: true,
        options: optionsFrom(payload.json, [
          ["data", "data"],
          ["data", "zones"],
          ["data"],
          [],
        ]),
        message: "Zones loaded.",
        ...(newToken ? { encryptedAccessToken: encryptSecret(newToken) } : {}),
      };
    }

    if (account.slug === "carrybee") {
      const clientSecret = decryptField(account.clientSecret, secrets);
      if (!account.clientId || !clientSecret || !account.clientContext) {
        return locationFailure("Carrybee credentials are unavailable.");
      }
      const payload = await request(`${baseUrl}/api/v2/cities/${cityId}/zones`, {
        method: "GET",
        headers: {
          "Client-ID": account.clientId,
          "Client-Secret": clientSecret,
          "Client-Context": account.clientContext,
        },
      });
      if (!payload.ok) return locationFailure(upstreamError(payload, secrets));
      return {
        ok: true,
        options: optionsFrom(payload.json, [
          ["data", "zones"],
          ["data", "data"],
          ["zones"],
          ["data"],
          [],
        ]),
        message: "Zones loaded.",
      };
    }

    return locationFailure("Zone lookup is not available for this courier.");
  } catch (error) {
    return locationFailure(safeError(error, secrets));
  }
}

export async function fetchCourierAreas(
  account: DispatchAccount,
  params: { cityId?: number; zoneId?: number },
): Promise<CourierLocationResult> {
  const secrets: string[] = [];
  try {
    if (!isSupportedSlug(account.slug)) {
      return locationFailure("Unsupported courier.");
    }
    const baseUrl = assertOfficialCourierBaseUrl(account.slug, account.isSandbox);

    if (account.slug === "pathao") {
      if (!params.zoneId) {
        return locationFailure("Zone is required to load areas.");
      }
      const token = decryptField(account.accessToken, secrets);
      const { payload, newToken } = await pathaoCall(
        account,
        baseUrl,
        `/aladdin/api/v1/zones/${params.zoneId}/area-list`,
        "GET",
        undefined,
        token,
        secrets,
      );
      if (!payload.ok) {
        return {
          ...locationFailure(upstreamError(payload, secrets)),
          ...(newToken
            ? { encryptedAccessToken: encryptSecret(newToken) }
            : {}),
        };
      }
      return {
        ok: true,
        options: optionsFrom(payload.json, [
          ["data", "data"],
          ["data", "areas"],
          ["data"],
          [],
        ]),
        message: "Areas loaded.",
        ...(newToken ? { encryptedAccessToken: encryptSecret(newToken) } : {}),
      };
    }

    if (account.slug === "carrybee") {
      if (!params.cityId || !params.zoneId) {
        return locationFailure("City and zone are required to load areas.");
      }
      const clientSecret = decryptField(account.clientSecret, secrets);
      if (!account.clientId || !clientSecret || !account.clientContext) {
        return locationFailure("Carrybee credentials are unavailable.");
      }
      const payload = await request(
        `${baseUrl}/api/v2/cities/${params.cityId}/zones/${params.zoneId}/areas`,
        {
          method: "GET",
          headers: {
            "Client-ID": account.clientId,
            "Client-Secret": clientSecret,
            "Client-Context": account.clientContext,
          },
        },
      );
      if (!payload.ok) return locationFailure(upstreamError(payload, secrets));
      return {
        ok: true,
        options: optionsFrom(payload.json, [
          ["data", "areas"],
          ["data", "data"],
          ["areas"],
          ["data"],
          [],
        ]),
        message: "Areas loaded.",
      };
    }

    if (account.slug === "redx") {
      const accessToken = decryptField(account.accessToken, secrets);
      if (!accessToken) return locationFailure("RedX access token is unavailable.");
      const payload = await request(`${baseUrl}/areas`, {
        method: "GET",
        headers: { "API-ACCESS-TOKEN": `Bearer ${accessToken}` },
      });
      if (!payload.ok) return locationFailure(upstreamError(payload, secrets));
      return {
        ok: true,
        options: optionsFrom(payload.json, [
          ["areas"],
          ["data", "areas"],
          ["data", "data"],
          ["data"],
          [],
        ]),
        message: "Areas loaded.",
      };
    }

    return locationFailure("Area lookup is not available for this courier.");
  } catch (error) {
    return locationFailure(safeError(error, secrets));
  }
}

/* ---------------------------------------------------------------- */
/* Parcel booking                                                   */
/* ---------------------------------------------------------------- */

function codAmount(order: DispatchOrder): number {
  if (order.paymentStatus === "paid") return 0;
  return Math.max(0, order.total - (order.advance ?? 0));
}

function itemCount(order: DispatchOrder): number {
  return Math.max(1, order.items.reduce((sum, item) => sum + item.quantity, 0));
}

function itemDescription(order: DispatchOrder): string {
  return order.items
    .map((item) => `${item.product.name} x${item.quantity}`)
    .join(", ")
    .slice(0, 200);
}

function noteFor(order: DispatchOrder, params: DispatchParams): string {
  return params.note || order.courierNote || order.notes || "";
}

async function dispatchSteadfast(
  account: DispatchAccount,
  baseUrl: string,
  order: DispatchOrder,
  params: DispatchParams,
  secrets: string[],
): Promise<DispatchResult> {
  const apiKey = decryptField(account.apiKey, secrets);
  const secretKey = decryptField(account.secretKey, secrets);
  if (!apiKey || !secretKey) {
    return dispatchFailure("Steadfast credentials are unavailable.");
  }

  const payload = await request(`${baseUrl}/create_order`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice: order.orderNumber,
      recipient_name: order.customerName,
      recipient_phone: order.customerPhone,
      recipient_address: order.customerAddress,
      cod_amount: codAmount(order),
      note: noteFor(order, params),
    }),
  });
  const rawResponse = redactJson(payload.json, secrets);
  if (!payload.ok) {
    return dispatchFailure(upstreamError(payload, secrets), rawResponse);
  }

  const consignment = getAtPath(payload.json, ["consignment"]);
  const consignmentId =
    readTrackingValue(consignment, [["consignment_id"]]) ??
    readTrackingValue(payload.json, [
      ["consignment_id"],
      ["data", "consignment_id"],
    ]);
  const trackingCode =
    readTrackingValue(consignment, [["tracking_code"]]) ??
    readTrackingValue(payload.json, [
      ["tracking_code"],
      ["data", "tracking_code"],
    ]) ??
    consignmentId;
  if (!consignmentId) {
    return dispatchFailure(
      "Steadfast did not return a consignment ID.",
      rawResponse,
    );
  }

  return {
    ok: true,
    message: "Parcel booked with Steadfast.",
    consignmentId,
    trackingCode,
    courierStatus:
      readString(consignment, [["status"]]) ??
      readString(payload.json, [["status"], ["data", "status"]]),
    deliveryFee:
      readId(payload.json, [["delivery_fee"], ["data", "delivery_fee"]]) ?? null,
    rawResponse,
  };
}

async function dispatchPathao(
  account: DispatchAccount,
  baseUrl: string,
  order: DispatchOrder,
  params: DispatchParams,
  secrets: string[],
): Promise<DispatchResult> {
  if (!account.storeId || !params.cityId || !params.zoneId) {
    return dispatchFailure("Store, city and zone are required for Pathao.");
  }

  const token = decryptField(account.accessToken, secrets);
  const { payload, newToken } = await pathaoCall(
    account,
    baseUrl,
    "/aladdin/api/v1/orders",
    "POST",
    {
      store_id: Number(account.storeId),
      merchant_order_id: order.orderNumber,
      recipient_name: order.customerName,
      recipient_phone: order.customerPhone,
      recipient_address: order.customerAddress,
      recipient_city: params.cityId,
      recipient_zone: params.zoneId,
      ...(params.areaId ? { recipient_area: params.areaId } : {}),
      delivery_type: 48,
      item_type: 2,
      special_instruction: params.note || order.courierNote || "",
      item_quantity: itemCount(order),
      item_weight: params.itemWeight ?? 0.5,
      amount_to_collect: codAmount(order),
      item_description: itemDescription(order),
    },
    token,
    secrets,
  );
  const rawResponse = redactJson(payload.json, secrets);
  const encryptedAccessToken = newToken
    ? encryptSecret(newToken)
    : undefined;
  if (!payload.ok) {
    return {
      ...dispatchFailure(upstreamError(payload, secrets), rawResponse),
      ...(encryptedAccessToken ? { encryptedAccessToken } : {}),
    };
  }

  const consignmentId = readTrackingValue(payload.json, [
    ["data", "consignment_id"],
    ["consignment_id"],
  ]);
  if (!consignmentId) {
    return {
      ...dispatchFailure("Pathao did not return a consignment ID.", rawResponse),
      ...(encryptedAccessToken ? { encryptedAccessToken } : {}),
    };
  }
  return {
    ok: true,
    message: "Parcel booked with Pathao.",
    consignmentId,
    trackingCode:
      readTrackingValue(payload.json, [
        ["data", "tracking_code"],
        ["tracking_code"],
      ]) ?? consignmentId,
    courierStatus:
      readString(payload.json, [["data", "order_status"], ["order_status"]]) ??
      null,
    deliveryFee:
      readId(payload.json, [["data", "delivery_fee"], ["delivery_fee"]]) ?? null,
    rawResponse,
    ...(encryptedAccessToken ? { encryptedAccessToken } : {}),
  };
}

async function dispatchRedx(
  account: DispatchAccount,
  baseUrl: string,
  order: DispatchOrder,
  params: DispatchParams,
  secrets: string[],
): Promise<DispatchResult> {
  const accessToken = decryptField(account.accessToken, secrets);
  if (!accessToken) return dispatchFailure("RedX access token is unavailable.");
  if (!params.areaId || !params.areaName) {
    return dispatchFailure("Delivery area is required for RedX.");
  }

  const payload = await request(`${baseUrl}/parcel`, {
    method: "POST",
    headers: {
      "API-ACCESS-TOKEN": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      delivery_area: params.areaName,
      delivery_area_id: params.areaId,
      customer_address: order.customerAddress,
      merchant_invoice_id: order.orderNumber,
      cash_collection_amount: codAmount(order),
      parcel_weight: Math.round((params.itemWeight ?? 0.5) * 1000),
      instruction: params.note || order.courierNote || "",
      value: Math.max(0, order.total),
    }),
  });
  const rawResponse = redactJson(payload.json, secrets);
  if (!payload.ok) {
    return dispatchFailure(upstreamError(payload, secrets), rawResponse);
  }

  const trackingId = readTrackingValue(payload.json, [
    ["tracking_id"],
    ["data", "tracking_id"],
    ["parcel", "tracking_id"],
  ]);
  if (!trackingId) {
    return dispatchFailure("RedX did not return a tracking ID.", rawResponse);
  }
  return {
    ok: true,
    message: "Parcel booked with RedX.",
    consignmentId: trackingId,
    trackingCode: trackingId,
    courierStatus:
      readString(payload.json, [["status"], ["data", "status"]]) ?? null,
    deliveryFee:
      readId(payload.json, [["delivery_fee"], ["data", "delivery_fee"]]) ?? null,
    rawResponse,
  };
}

async function dispatchCarrybee(
  account: DispatchAccount,
  baseUrl: string,
  order: DispatchOrder,
  params: DispatchParams,
  secrets: string[],
): Promise<DispatchResult> {
  const clientSecret = decryptField(account.clientSecret, secrets);
  if (!account.clientId || !clientSecret || !account.clientContext) {
    return dispatchFailure("Carrybee credentials are unavailable.");
  }
  if (!account.storeId || !params.cityId || !params.zoneId || !params.areaId) {
    return dispatchFailure("Store, city, zone and area are required for Carrybee.");
  }

  const payload = await request(`${baseUrl}/api/v2/orders`, {
    method: "POST",
    headers: {
      "Client-ID": account.clientId,
      "Client-Secret": clientSecret,
      "Client-Context": account.clientContext,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      store_id: account.storeId,
      merchant_order_id: order.orderNumber,
      delivery_type: 1,
      product_type: 1,
      recipient_phone: order.customerPhone,
      recipient_name: order.customerName,
      recipient_address: order.customerAddress,
      city_id: params.cityId,
      zone_id: params.zoneId,
      area_id: params.areaId,
      special_instruction: params.note || order.courierNote || "",
      product_description: itemDescription(order),
      item_weight: Math.round((params.itemWeight ?? 0.5) * 1000),
      item_quantity: itemCount(order),
      collectable_amount: codAmount(order),
    }),
  });
  const rawResponse = redactJson(payload.json, secrets);
  if (!payload.ok) {
    return dispatchFailure(upstreamError(payload, secrets), rawResponse);
  }

  const consignmentId =
    readTrackingValue(payload.json, [
      ["order", "consignment_id"],
      ["consignment_id"],
      ["data", "order", "consignment_id"],
      ["data", "consignment_id"],
    ]) ?? null;
  const trackingCode =
    readTrackingValue(payload.json, [
      ["tracking_code"],
      ["order", "tracking_code"],
      ["data", "tracking_code"],
      ["data", "order", "tracking_code"],
    ]) ?? consignmentId;
  if (!consignmentId) {
    return dispatchFailure(
      "Carrybee did not return a consignment ID.",
      rawResponse,
    );
  }
  return {
    ok: true,
    message: "Parcel booked with Carrybee.",
    consignmentId,
    trackingCode,
    courierStatus:
      readString(payload.json, [
        ["order", "status"],
        ["status"],
        ["data", "order", "status"],
        ["data", "status"],
      ]) ?? null,
    deliveryFee:
      readId(payload.json, [
        ["order", "delivery_fee"],
        ["delivery_fee"],
        ["data", "delivery_fee"],
      ]) ?? null,
    rawResponse,
  };
}

/** Never throws and never returns decrypted credentials. */
export async function dispatchToCourier(
  account: DispatchAccount,
  order: DispatchOrder,
  params: DispatchParams,
): Promise<DispatchResult> {
  const secrets: string[] = [];
  try {
    if (!isSupportedSlug(account.slug)) {
      return dispatchFailure("Unsupported courier.");
    }
    const baseUrl = assertOfficialCourierBaseUrl(account.slug, account.isSandbox);
    switch (account.slug) {
      case "steadfast":
        return await dispatchSteadfast(account, baseUrl, order, params, secrets);
      case "pathao":
        return await dispatchPathao(account, baseUrl, order, params, secrets);
      case "redx":
        return await dispatchRedx(account, baseUrl, order, params, secrets);
      case "carrybee":
        return await dispatchCarrybee(account, baseUrl, order, params, secrets);
    }
  } catch (error) {
    return dispatchFailure(safeError(error, secrets));
  }
}
