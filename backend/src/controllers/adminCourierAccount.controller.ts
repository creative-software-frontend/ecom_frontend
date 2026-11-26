import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { encryptSecret, maskSecret } from "../lib/crypto.js";
import { testCourierConnection } from "../lib/courierTester.js";
import { prisma } from "../lib/prisma.js";
import { sendValidationError } from "../lib/validation.js";
import {
  COURIER_SLUGS,
  resolveOfficialCourierBaseUrl,
  supportsCourierSandbox,
  toggleCourierAccountSchema,
  toggleCourierSandboxSchema,
  upsertCourierAccountSchema,
  type CourierSlug,
  type UpsertCourierAccountInput,
} from "../schemas/courierAccount.schema.js";

type CourierAccountRow = NonNullable<
  Awaited<ReturnType<typeof prisma.courierAccount.findUnique>>
>;

type CredentialField =
  | "apiKey"
  | "secretKey"
  | "clientId"
  | "clientSecret"
  | "username"
  | "password"
  | "storeId"
  | "accessToken"
  | "clientContext";

const SECRET_FIELDS = [
  "apiKey",
  "secretKey",
  "clientSecret",
  "password",
  "accessToken",
] as const;

/** Credentials required before a courier account may be enabled. */
const REQUIRED_CREDENTIALS: Record<CourierSlug, readonly CredentialField[]> = {
  steadfast: ["apiKey", "secretKey"],
  pathao: ["clientId", "clientSecret", "username", "password", "storeId"],
  redx: ["storeId", "accessToken"],
  carrybee: ["clientId", "clientSecret", "storeId", "clientContext"],
};

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins cannot manage shop courier accounts here.",
    });
    return null;
  }
  return shopId;
}

function isCourierSlug(value: string): value is CourierSlug {
  return (COURIER_SLUGS as readonly string[]).includes(value);
}

function notFound(res: Response) {
  return res.status(404).json({ success: false, message: "Courier account not found" });
}

function hasCredential(value: string | null): boolean {
  return value !== null && value.trim().length > 0;
}

/**
 * Serializer whitelist: no encrypted payload and no decrypted secret ever
 * leaves the server. Only boolean flags and masked previews are exposed.
 */
function toSafeCourierAccount(row: CourierAccountRow) {
  return {
    id: row.id,
    shopId: row.shopId,
    slug: row.slug,
    enabled: row.enabled,
    isSandbox: row.isSandbox,
    supportsSandbox: supportsCourierSandbox(row.slug as CourierSlug),
    baseUrl: row.baseUrl,
    clientId: row.clientId,
    username: row.username,
    storeId: row.storeId,
    clientContext: row.clientContext,
    status: row.status,
    statusMessage: row.statusMessage,
    balance: row.balance === null ? null : row.balance.toNumber(),
    checkedAt: row.checkedAt,
    hasApiKey: row.apiKey !== null,
    hasSecretKey: row.secretKey !== null,
    hasClientSecret: row.clientSecret !== null,
    hasPassword: row.password !== null,
    hasAccessToken: row.accessToken !== null,
    apiKeyPreview: maskSecret(row.apiKey).preview,
    secretKeyPreview: maskSecret(row.secretKey).preview,
    clientSecretPreview: maskSecret(row.clientSecret).preview,
    passwordPreview: maskSecret(row.password).preview,
    accessTokenPreview: maskSecret(row.accessToken).preview,
    updatedAt: row.updatedAt,
  };
}

/** Creates the four clean courier rows for a shop, without seeding any credentials. */
export async function ensureShopCourierAccounts(shopId: number): Promise<void> {
  await prisma.courierAccount.createMany({
    data: COURIER_SLUGS.map((slug) => ({
      shopId,
      slug,
      enabled: false,
      isSandbox: false,
      baseUrl: resolveOfficialCourierBaseUrl(slug, false),
      apiKey: null,
      secretKey: null,
      clientId: null,
      clientSecret: null,
      username: null,
      password: null,
      storeId: null,
      accessToken: null,
      clientContext: null,
      credentialsLegacy: null,
      status: "not_connected",
      statusMessage: null,
      balance: null,
      checkedAt: null,
    })),
    skipDuplicates: true,
  });
}

async function findAccount(shopId: number, slug: CourierSlug) {
  return prisma.courierAccount.findUnique({
    where: { shopId_slug: { shopId, slug } },
  });
}

/** Effective credential values after applying an update (no decryption needed). */
function effectiveCredentials(
  input: Partial<UpsertCourierAccountInput>,
  row: CourierAccountRow,
): Record<CredentialField, string | null> {
  const fromInput = (value: string | null | undefined, fallback: string | null) =>
    value === undefined ? fallback : value;

  return {
    apiKey: input.apiKey ? input.apiKey : row.apiKey,
    secretKey: input.secretKey ? input.secretKey : row.secretKey,
    clientSecret: input.clientSecret ? input.clientSecret : row.clientSecret,
    password: input.password ? input.password : row.password,
    accessToken: input.accessToken ? input.accessToken : row.accessToken,
    clientId: fromInput(input.clientId, row.clientId),
    username: fromInput(input.username, row.username),
    storeId: fromInput(input.storeId, row.storeId),
    clientContext: fromInput(input.clientContext, row.clientContext),
  };
}

function isConfigured(
  slug: CourierSlug,
  credentials: Record<CredentialField, string | null>,
): boolean {
  return REQUIRED_CREDENTIALS[slug].every((field) =>
    hasCredential(credentials[field]),
  );
}

/** Stored encrypted fields are non-null when a credential has been saved. */
function hasRequiredCredentials(
  slug: CourierSlug,
  row: CourierAccountRow,
): boolean {
  return isConfigured(slug, row);
}

export async function listCourierAccounts(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  try {
    await ensureShopCourierAccounts(shopId);
    // toSafeCourierAccount() is the only output path; encrypted values stay server-side.
    const rows = await prisma.courierAccount.findMany({ where: { shopId } });
    rows.sort(
      (a, b) =>
        COURIER_SLUGS.indexOf(a.slug as CourierSlug) -
        COURIER_SLUGS.indexOf(b.slug as CourierSlug),
    );
    return res.json({
      success: true,
      data: rows.map(toSafeCourierAccount),
    });
  } catch (error) {
    console.error("Error listing courier accounts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function upsertCourierAccount(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slugParam = typeof req.params.slug === "string" ? req.params.slug : "";
  if (!isCourierSlug(slugParam)) return notFound(res);

  const parsed = upsertCourierAccountSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  if (parsed.data.isSandbox === true && !supportsCourierSandbox(slugParam)) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: { isSandbox: "Sandbox mode is not available for Steadfast." },
    });
  }

  try {
    await ensureShopCourierAccounts(shopId);
    const existing = await findAccount(shopId, slugParam);
    if (!existing) return notFound(res);

    const input = parsed.data;
    const nextIsSandbox = input.isSandbox ?? existing.isSandbox;
    const environmentChanged = nextIsSandbox !== existing.isSandbox;
    const configured = isConfigured(
      slugParam,
      effectiveCredentials(input, existing),
    );
    if (input.enabled === true && !configured) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: {
          enabled: "Configure required credentials before enabling this courier.",
        },
      });
    }

    const encryptedSecrets: Partial<Record<(typeof SECRET_FIELDS)[number], string>> =
      {};
    for (const field of SECRET_FIELDS) {
      const value = input[field];
      if (value !== undefined && value.length > 0) {
        encryptedSecrets[field] = encryptSecret(value);
      }
    }

    const status = !configured
      ? "not_connected"
      : environmentChanged
        ? "ready"
        : existing.status === "connected"
          ? "connected"
          : "ready";

    const data: Prisma.CourierAccountUncheckedUpdateInput = {
      ...encryptedSecrets,
      enabled: configured ? (input.enabled ?? existing.enabled) : false,
      isSandbox: nextIsSandbox,
      status,
      statusMessage: null,
      // Read-only by design: derived from the official environment URL only.
      baseUrl: resolveOfficialCourierBaseUrl(slugParam, nextIsSandbox),
      ...(environmentChanged && {
        balance: null,
        checkedAt: null,
        // Pathao's token is issued for a specific environment; RedX's token
        // is user-supplied and must survive an environment switch.
        ...(slugParam === "pathao" && { accessToken: null }),
      }),
      ...(input.clientId !== undefined && { clientId: input.clientId }),
      ...(input.username !== undefined && { username: input.username }),
      ...(input.storeId !== undefined && { storeId: input.storeId }),
      ...(input.clientContext !== undefined && {
        clientContext: input.clientContext,
      }),
    };

    const updated = await prisma.courierAccount.update({
      where: { id: existing.id },
      data,
    });

    void logAudit({
      req,
      action: "courier.account_update",
      entityType: "courier_account",
      entityId: updated.id,
      targetShopId: shopId,
      metadata: {
        slug: updated.slug,
        enabled: updated.enabled,
        status: updated.status,
        isSandbox: updated.isSandbox,
      },
    });

    return res.json({ success: true, data: toSafeCourierAccount(updated) });
  } catch (error) {
    console.error("Error updating courier account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function toggleCourierAccount(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slugParam = typeof req.params.slug === "string" ? req.params.slug : "";
  if (!isCourierSlug(slugParam)) return notFound(res);

  const parsed = toggleCourierAccountSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    await ensureShopCourierAccounts(shopId);
    const existing = await findAccount(shopId, slugParam);
    if (!existing) return notFound(res);

    if (
      parsed.data.enabled &&
      !isConfigured(slugParam, effectiveCredentials({}, existing))
    ) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: {
          enabled: "Configure required credentials before enabling this courier.",
        },
      });
    }

    const updated = await prisma.courierAccount.update({
      where: { id: existing.id },
      data: { enabled: parsed.data.enabled },
    });

    void logAudit({
      req,
      action: "courier.account_toggle",
      entityType: "courier_account",
      entityId: updated.id,
      targetShopId: shopId,
      metadata: { slug: updated.slug, enabled: updated.enabled, status: updated.status },
    });

    return res.json({ success: true, data: toSafeCourierAccount(updated) });
  } catch (error) {
    console.error("Error toggling courier account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

/** Switches a courier between official production and sandbox endpoints. */
export async function toggleCourierSandbox(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slugParam = typeof req.params.slug === "string" ? req.params.slug : "";
  if (!isCourierSlug(slugParam)) return notFound(res);

  const parsed = toggleCourierSandboxSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { isSandbox } = parsed.data;
  if (isSandbox && !supportsCourierSandbox(slugParam)) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: { isSandbox: "Sandbox mode is not available for Steadfast." },
    });
  }

  try {
    await ensureShopCourierAccounts(shopId);
    const existing = await findAccount(shopId, slugParam);
    if (!existing) return notFound(res);

    if (isSandbox === existing.isSandbox) {
      return res.json({ success: true, data: toSafeCourierAccount(existing) });
    }

    const updated = await prisma.courierAccount.update({
      where: { id: existing.id },
      data: {
        isSandbox,
        baseUrl: resolveOfficialCourierBaseUrl(slugParam, isSandbox),
        status: hasRequiredCredentials(slugParam, existing)
          ? "ready"
          : "not_connected",
        statusMessage: null,
        balance: null,
        checkedAt: null,
        // Pathao tokens are environment-specific; RedX tokens are entered by
        // the user and must be kept intact across the switch.
        ...(slugParam === "pathao" && { accessToken: null }),
      },
    });

    void logAudit({
      req,
      action: "courier.account_sandbox",
      entityType: "courier_account",
      entityId: updated.id,
      targetShopId: shopId,
      metadata: { slug: updated.slug, isSandbox: updated.isSandbox },
    });

    return res.json({ success: true, data: toSafeCourierAccount(updated) });
  } catch (error) {
    console.error("Error switching courier environment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function disconnectCourierAccount(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slugParam = typeof req.params.slug === "string" ? req.params.slug : "";
  if (!isCourierSlug(slugParam)) return notFound(res);

  try {
    await ensureShopCourierAccounts(shopId);
    const existing = await findAccount(shopId, slugParam);
    if (!existing) return notFound(res);

    const updated = await prisma.courierAccount.update({
      where: { id: existing.id },
      data: {
        apiKey: null,
        secretKey: null,
        clientId: null,
        clientSecret: null,
        username: null,
        password: null,
        storeId: null,
        accessToken: null,
        clientContext: null,
        credentialsLegacy: null,
        statusMessage: null,
        balance: null,
        checkedAt: null,
        enabled: false,
        isSandbox: false,
        status: "not_connected",
        baseUrl: resolveOfficialCourierBaseUrl(slugParam, false),
      },
    });

    void logAudit({
      req,
      action: "courier.account_disconnect",
      entityType: "courier_account",
      entityId: updated.id,
      targetShopId: shopId,
      metadata: { slug: updated.slug, enabled: false, status: updated.status },
    });

    return res.json({ success: true, data: toSafeCourierAccount(updated) });
  } catch (error) {
    console.error("Error disconnecting courier account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

/** Live probe with persisted, secret-free status/balance/checkedAt results. */
export async function testCourierAccount(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slugParam = typeof req.params.slug === "string" ? req.params.slug : "";
  if (!isCourierSlug(slugParam)) return notFound(res);

  try {
    await ensureShopCourierAccounts(shopId);
    const existing = await findAccount(shopId, slugParam);
    if (!existing) return notFound(res);

    if (!hasRequiredCredentials(slugParam, existing)) {
      return res.status(422).json({
        success: false,
        message: "Configure required credentials before testing connection.",
      });
    }

    const result = await testCourierConnection({
      ...existing,
      isSandbox: existing.isSandbox,
    });
    const updated = await prisma.courierAccount.update({
      where: { id: existing.id },
      data: {
        // Heal any legacy/poisoned URL: only the official environment URL is stored.
        baseUrl: resolveOfficialCourierBaseUrl(slugParam, existing.isSandbox),
        status: result.status,
        statusMessage: result.ok ? null : result.message,
        checkedAt: new Date(),
        ...(slugParam === "steadfast" &&
          result.ok &&
          result.balance !== undefined && { balance: result.balance }),
        ...(slugParam === "pathao" &&
          result.ok &&
          result.encryptedAccessToken && {
            accessToken: result.encryptedAccessToken,
          }),
      },
    });

    void logAudit({
      req,
      action: "courier.account_test",
      entityType: "courier_account",
      entityId: updated.id,
      targetShopId: shopId,
      metadata: {
        slug: updated.slug,
        ok: result.ok,
        status: updated.status,
      },
    });

    return res.json({
      success: true,
      data: {
        ok: result.ok,
        message: result.message,
        account: toSafeCourierAccount(updated),
      },
    });
  } catch (error) {
    console.error("Error testing courier connection:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
