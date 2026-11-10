import type { Request } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "./prisma.js";

/* ================================================================
   Fire-and-forget audit log entry.
   Supports explicit `userId` override for cases where req.user
   isn't populated yet — e.g., login handler runs BEFORE auth
   middleware sets req.user.
   Failures are logged to console but never propagate to caller.
   ================================================================ */

export type AuditAction =
  | "login"
  | "logout"
  | "user.create"
  | "user.update"
  | "user.deactivate"
  | "user.activate"
  | "user.delete"
  | "user.reset_password"
  | "role.create"
  | "role.update"
  | "role.delete"
  | "shop.create"
  | "shop.update"
  | "shop.activate"
  | "shop.deactivate";

export async function logAudit(params: {
  req: Request;
  action: AuditAction;
  entityType?: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
  targetShopId?: number | null;
  /** Explicit actor — required when req.user is not populated (e.g., login). */
  userId?: number;
}): Promise<void> {
  const finalUserId = params.userId ?? params.req.user?.id;
  if (!finalUserId) return;

  const ip =
    (params.req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ??
    params.req.ip ??
    null;
  const ua = params.req.headers["user-agent"] ?? null;

  try {
    await prisma.auditLog.create({
      data: {
        userId: finalUserId,
        shopId: params.targetShopId ?? params.req.user?.shopId ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId:
          params.entityId === undefined ? null : String(params.entityId),
        ipAddress: ip,
        userAgent: ua,
        ...(params.metadata !== undefined && {
          metadata: params.metadata as Prisma.InputJsonValue,
        }),
      },
    });
  } catch (err) {
    console.error("[audit-log] failed:", err);
  }
}
