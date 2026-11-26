import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import {
  fetchCourierAreas,
  fetchCourierCities,
  fetchCourierZones,
  dispatchToCourier,
} from "../lib/courierDispatcher.js";
import { sanitizeMessage } from "../lib/courierTester.js";
import { prisma } from "../lib/prisma.js";
import { parseId } from "../lib/parseId.js";
import { sendValidationError } from "../lib/validation.js";
import type { CourierSlug } from "../schemas/courierAccount.schema.js";
import {
  bulkDispatchSchema,
  courierAreasQuerySchema,
  courierZonesQuerySchema,
  dispatchOrderSchema,
  type DispatchOrderInput,
} from "../schemas/courierDispatch.schema.js";
import { fetchOrderDetail } from "./adminOrder.controller.js";

/* ================================================================
   Shop-scoped courier dispatch endpoints. Super admins have no
   shopId and are rejected before any data access (403).
   ================================================================ */

type CourierAccountRow = NonNullable<
  Awaited<ReturnType<typeof prisma.courierAccount.findUnique>>
>;

async function loadDispatchableOrder(id: number, shopId: number) {
  return prisma.order.findFirst({
    where: { id, shopId },
    include: {
      items: { include: { product: { select: { name: true } } } },
      shipments: {
        where: { consignmentId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

type DispatchableOrder = NonNullable<
  Awaited<ReturnType<typeof loadDispatchableOrder>>
>;

const FINAL_STATUSES = new Set(["delivered", "returned", "cancelled"]);

const PENDING_MESSAGE =
  "Order is pending. Confirm the order before dispatching to courier.";
const PENDING_FIELD_ERROR = "Pending order requires confirmation first.";
const ACTIVE_SHIPMENT_MESSAGE = "Order already has an active courier shipment.";

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message: "Shop-scoped endpoint. Super admins cannot dispatch courier orders here.",
    });
    return null;
  }
  return shopId;
}

function present(value: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasRequiredCredentials(
  slug: CourierSlug,
  account: CourierAccountRow,
): boolean {
  switch (slug) {
    case "steadfast":
      return present(account.apiKey) && present(account.secretKey);
    case "pathao":
      return (
        present(account.clientId) &&
        present(account.clientSecret) &&
        present(account.username) &&
        present(account.password) &&
        present(account.storeId)
      );
    case "redx":
      return present(account.storeId) && present(account.accessToken);
    case "carrybee":
      return (
        present(account.clientId) &&
        present(account.clientSecret) &&
        present(account.storeId) &&
        present(account.clientContext)
      );
  }
}

function isCourierSlug(value: string): value is CourierSlug {
  return (
    value === "steadfast" ||
    value === "pathao" ||
    value === "redx" ||
    value === "carrybee"
  );
}

function locationSlug(
  res: Response,
  raw: unknown,
  allowed: readonly CourierSlug[],
): CourierSlug | null {
  const value = typeof raw === "string" ? raw : "";
  if (!isCourierSlug(value) || !allowed.includes(value)) {
    res.status(404).json({
      success: false,
      message: "Location lookup is not available for this courier.",
    });
    return null;
  }
  return value;
}

function notConfigured(res: Response, slug: CourierSlug) {
  return res.status(422).json({
    success: false,
    message: `Configure and enable ${slug} credentials before using this endpoint.`,
  });
}

async function findUsableAccount(shopId: number, slug: CourierSlug) {
  const account = await prisma.courierAccount.findUnique({
    where: { shopId_slug: { shopId, slug } },
  });
  if (!account || !account.enabled || !hasRequiredCredentials(slug, account)) {
    return null;
  }
  return account;
}

async function persistRefreshedToken(
  account: CourierAccountRow,
  encryptedAccessToken: string | null | undefined,
) {
  if (!encryptedAccessToken) return;
  await prisma.courierAccount.update({
    where: { id: account.id },
    data: { accessToken: encryptedAccessToken },
  });
}

async function confirmPendingOrder(
  req: Request,
  order: DispatchableOrder,
  shopId: number,
): Promise<boolean> {
  const updated = await prisma.order.updateMany({
    where: { id: order.id, shopId, status: "pending" },
    data: { status: "confirmed" },
  });
  if (updated.count !== 1) return false;

  void logAudit({
    req,
    action: "order.status_update",
    entityType: "order",
    entityId: order.id,
    metadata: {
      previousStatus: "pending",
      status: "confirmed",
      source: "courier_dispatch",
    },
    targetShopId: shopId,
  });
  return true;
}

/** Runs the external call, persists the attempt and audits the outcome. */
async function dispatchPreparedOrder({
  req,
  shopId,
  order,
  account,
  payload,
}: {
  req: Request;
  shopId: number;
  order: DispatchableOrder;
  account: CourierAccountRow;
  payload: DispatchOrderInput;
}) {
  if (order.status === "pending" && payload.confirmFirst) {
    const confirmed = await confirmPendingOrder(req, order, shopId);
    if (!confirmed) {
      return {
        ok: false,
        message: "Order status changed. Please retry the dispatch.",
        shipment: null,
      };
    }
    order.status = "confirmed";
  }

  const result = await dispatchToCourier(
    account,
    {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      notes: order.notes,
      courierNote: order.courierNote,
      total: order.total,
      advance: order.advance,
      paymentStatus: order.paymentStatus,
      items: order.items,
    },
    payload,
  );

  await persistRefreshedToken(account, result.encryptedAccessToken);

  const shipment = await prisma.courierShipment.create({
    data: {
      orderId: order.id,
      shopId,
      courierSlug: payload.courierSlug,
      isSandbox: account.isSandbox,
      consignmentId: result.consignmentId,
      trackingCode: result.trackingCode,
      courierStatus: result.courierStatus,
      deliveryFee: result.deliveryFee,
      cityId: payload.cityId ?? null,
      zoneId: payload.zoneId ?? null,
      areaId: payload.areaId ?? null,
      areaName: payload.areaName ?? null,
      errorMessage: result.ok
        ? null
        : sanitizeMessage(result.message).slice(0, 255) || "Dispatch failed.",
      rawResponse: result.rawResponse ?? Prisma.DbNull,
      dispatchedAt: result.ok ? new Date() : null,
    },
  });

  if (result.ok) {
    // Per Decision 4: keep the current order status; only assign the courier.
    await prisma.order.update({
      where: { id: order.id, shopId },
      data: { courier: payload.courierSlug },
    });

    void logAudit({
      req,
      action: "order.courier_dispatch",
      entityType: "courier_shipment",
      entityId: shipment.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        courierSlug: payload.courierSlug,
        isSandbox: account.isSandbox,
        ok: true,
      },
      targetShopId: shopId,
    });
  } else {
    void logAudit({
      req,
      action: "order.courier_dispatch",
      entityType: "courier_shipment",
      entityId: shipment.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        courierSlug: payload.courierSlug,
        isSandbox: account.isSandbox,
        ok: false,
      },
      targetShopId: shopId,
    });
  }

  return {
    ok: result.ok,
    message: result.message,
    shipment,
    consignmentId: result.consignmentId,
    trackingCode: result.trackingCode,
  };
}

/* ---------------------------------------------------------------- */
/* Location lookups                                                 */
/* ---------------------------------------------------------------- */

export async function getCourierCities(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slug = locationSlug(res, req.params.slug, ["pathao", "carrybee"]);
  if (slug === null) return;

  try {
    const account = await findUsableAccount(shopId, slug);
    if (!account) return notConfigured(res, slug);

    const result = await fetchCourierCities(account);
    await persistRefreshedToken(account, result.encryptedAccessToken);
    if (!result.ok) {
      return res.status(422).json({ success: false, message: result.message });
    }
    return res.json({ success: true, data: result.options });
  } catch (error) {
    console.error("Error loading courier cities:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getCourierZones(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slug = locationSlug(res, req.params.slug, ["pathao", "carrybee"]);
  if (slug === null) return;

  const parsed = courierZonesQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const account = await findUsableAccount(shopId, slug);
    if (!account) return notConfigured(res, slug);

    const result = await fetchCourierZones(account, parsed.data.cityId);
    await persistRefreshedToken(account, result.encryptedAccessToken);
    if (!result.ok) {
      return res.status(422).json({ success: false, message: result.message });
    }
    return res.json({ success: true, data: result.options });
  } catch (error) {
    console.error("Error loading courier zones:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getCourierAreas(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const slug = locationSlug(res, req.params.slug, ["pathao", "carrybee", "redx"]);
  if (slug === null) return;

  const parsed = courierAreasQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { cityId, zoneId } = parsed.data;
  if (slug === "pathao" && !zoneId) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: { zoneId: "Zone is required for Pathao." },
    });
  }
  if (slug === "carrybee" && (!cityId || !zoneId)) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: {
        ...(!cityId ? { cityId: "City is required for Carrybee." } : {}),
        ...(!zoneId ? { zoneId: "Zone is required for Carrybee." } : {}),
      },
    });
  }

  try {
    const account = await findUsableAccount(shopId, slug);
    if (!account) return notConfigured(res, slug);

    const result = await fetchCourierAreas(account, { cityId, zoneId });
    await persistRefreshedToken(account, result.encryptedAccessToken);
    if (!result.ok) {
      return res.status(422).json({ success: false, message: result.message });
    }
    return res.json({ success: true, data: result.options });
  } catch (error) {
    console.error("Error loading courier areas:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/* ---------------------------------------------------------------- */
/* Dispatch endpoints                                               */
/* ---------------------------------------------------------------- */

export async function dispatchSingleOrder(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  try {
    const order = await loadDispatchableOrder(id, shopId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (FINAL_STATUSES.has(order.status)) {
      return res.status(422).json({
        success: false,
        message: "Order is in a final status and cannot be dispatched.",
      });
    }
    if (order.shipments.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: ACTIVE_SHIPMENT_MESSAGE });
    }

    const parsed = dispatchOrderSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);

    if (order.status === "pending" && !parsed.data.confirmFirst) {
      return res.status(422).json({
        success: false,
        message: PENDING_MESSAGE,
        errors: { confirmFirst: PENDING_FIELD_ERROR },
      });
    }

    const account = await findUsableAccount(shopId, parsed.data.courierSlug);
    if (!account) return notConfigured(res, parsed.data.courierSlug);

    const outcome = await dispatchPreparedOrder({
      req,
      shopId,
      order,
      account,
      payload: parsed.data,
    });
    if (!outcome.shipment) {
      return res.status(409).json({
        success: false,
        message: outcome.message,
      });
    }
    if (!outcome.ok) {
      return res.status(422).json({
        success: false,
        message: outcome.message,
        data: { shipment: outcome.shipment },
      });
    }

    const updated = await fetchOrderDetail(id, shopId);
    return res.status(201).json({
      success: true,
      data: { shipment: outcome.shipment, order: updated },
    });
  } catch (error) {
    console.error("Error dispatching order to courier:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function bulkDispatchOrders(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = bulkDispatchSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const orderIds = [...new Set(parsed.data.orderIds)];
  const slug: CourierSlug = parsed.data.courierSlug;

  try {
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, shopId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        shipments: {
          where: { consignmentId: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    const byId = new Map(orders.map((order) => [order.id, order]));

    if (!parsed.data.confirmFirst) {
      const hasPending = orders.some((order) => order.status === "pending");
      if (hasPending) {
        return res.status(422).json({
          success: false,
          message: PENDING_MESSAGE,
          errors: { confirmFirst: PENDING_FIELD_ERROR },
        });
      }
    }

    const account = await findUsableAccount(shopId, slug);
    if (!account) return notConfigured(res, slug);

    const results: {
      orderId: number;
      orderNumber: string;
      ok: boolean;
      consignmentId?: string | null;
      trackingCode?: string | null;
      error?: string;
    }[] = [];

    for (const orderId of orderIds) {
      const order = byId.get(orderId);
      if (!order) {
        results.push({
          orderId,
          orderNumber: "#" + orderId,
          ok: false,
          error: "Order not found",
        });
        continue;
      }
      if (FINAL_STATUSES.has(order.status)) {
        results.push({
          orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: "Order is in a final status and cannot be dispatched.",
        });
        continue;
      }
      if (order.shipments.length > 0) {
        results.push({
          orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: ACTIVE_SHIPMENT_MESSAGE,
        });
        continue;
      }

      const outcome = await dispatchPreparedOrder({
        req,
        shopId,
        order,
        account,
        payload: { courierSlug: slug, confirmFirst: parsed.data.confirmFirst },
      });
      if (!outcome.ok || !outcome.shipment) {
        results.push({
          orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: outcome.message,
        });
        continue;
      }
      results.push({
        orderId,
        orderNumber: order.orderNumber,
        ok: true,
        consignmentId: outcome.consignmentId,
        trackingCode: outcome.trackingCode,
      });
    }

    const succeededCount = results.filter((result) => result.ok).length;
    return res.json({
      success: true,
      data: {
        results,
        succeededCount,
        failedCount: results.length - succeededCount,
      },
    });
  } catch (error) {
    console.error("Error bulk dispatching orders:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
