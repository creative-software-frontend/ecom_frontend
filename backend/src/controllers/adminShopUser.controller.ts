import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { prisma } from "../lib/prisma.js";
import { sendValidationError } from "../lib/validation.js";
import {
  createShopUserSchema,
  resetShopUserPasswordSchema,
  updateShopUserSchema,
} from "../schemas/shopUser.schema.js";

type ShopUserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

function toApiShape(user: ShopUserWithRole) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mobile: user.mobile ?? "",
    roleId: user.roleId,
    role: user.role.name,
    roleDisplayName: user.role.displayName,
    shopId: user.shopId,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getShopAdminOrForbid(req: Request, res: Response) {
  if (!req.user?.shopId) {
    res.status(403).json({
      success: false,
      message: "Shop-scoped endpoint. Super admins must use /api/admin/super/users.",
    });
    return null;
  }
  if (req.user.role.name !== "shop_admin") {
    res.status(403).json({
      success: false,
      message: "Only shop administrators can manage shop staff.",
    });
    return null;
  }
  return { shopId: req.user.shopId, actorId: req.user.id };
}

function getUniqueUserField(error: unknown): "email" | "mobile" | undefined {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return undefined;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];
  if (fields.some((field) => field.includes("email"))) return "email";
  if (fields.some((field) => field.includes("mobile"))) return "mobile";
  return undefined;
}

export async function listShopUsers(req: Request, res: Response) {
  const access = getShopAdminOrForbid(req, res);
  if (!access) return;

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const role =
    typeof req.query.role === "string" ? req.query.role.trim() : "";
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && status !== "active" && status !== "inactive") {
    return res.status(422).json({
      success: false,
      message: "Invalid status",
      errors: { status: "Status must be active or inactive" },
    });
  }

  const where: Prisma.UserWhereInput = { shopId: access.shopId };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { mobile: { contains: q } },
    ];
  }
  if (role && role !== "all") where.role = { name: role };
  if (status) where.status = status;

  try {
    const [items, total, active, inactive] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { shopId: access.shopId } }),
      prisma.user.count({
        where: { shopId: access.shopId, status: "active" },
      }),
      prisma.user.count({
        where: { shopId: access.shopId, status: "inactive" },
      }),
    ]);
    return res.json({
      success: true,
      data: {
        items: items.map(toApiShape),
        counts: { total, active, inactive },
      },
    });
  } catch (error) {
    console.error("listShopUsers failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function listAssignableShopRoles(req: Request, res: Response) {
  const access = getShopAdminOrForbid(req, res);
  if (!access) return;

  try {
    const roles = await prisma.role.findMany({
      where: { scope: "shop", name: { not: "shop_admin" } },
      orderBy: [{ isSystem: "desc" }, { displayName: "asc" }],
    });
    return res.json({
      success: true,
      data: roles.map(({ id, name, displayName, description }) => ({
        id,
        name,
        displayName,
        description,
      })),
    });
  } catch (error) {
    console.error("listAssignableShopRoles failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createShopUser(req: Request, res: Response) {
  const access = getShopAdminOrForbid(req, res);
  if (!access) return;

  const parsed = createShopUserSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const data = parsed.data;

  try {
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });
    if (!role || role.scope !== "shop" || role.name === "shop_admin") {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: { roleId: "You can only assign shop staff roles." },
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const created = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        mobile: data.mobile || null,
        passwordHash,
        roleId: data.roleId,
        shopId: access.shopId,
        status: data.status,
      },
      include: { role: true },
    });

    void logAudit({
      req,
      action: "user.create",
      entityType: "user",
      entityId: created.id,
      targetShopId: access.shopId,
      metadata: { email: created.email, role: role.name },
    });

    return res.status(201).json({
      success: true,
      data: toApiShape(created),
    });
  } catch (error) {
    const uniqueField = getUniqueUserField(error);
    if (uniqueField) {
      const message =
        uniqueField === "email"
          ? "This email is already registered"
          : "This mobile number is already registered";
      return res.status(409).json({
        success: false,
        message,
        errors: { [uniqueField]: message },
      });
    }
    console.error("createShopUser failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateShopUser(req: Request, res: Response) {
  const access = getShopAdminOrForbid(req, res);
  if (!access) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  const parsed = updateShopUserSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const data = parsed.data;

  try {
    const existing = await prisma.user.findFirst({
      where: { id, shopId: access.shopId },
      include: { role: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (existing.id === access.actorId) {
      return res.status(403).json({
        success: false,
        message: "You cannot modify your own account here.",
      });
    }
    if (existing.role.name === "shop_admin") {
      return res.status(403).json({
        success: false,
        message: "Shop admin accounts cannot be modified here.",
      });
    }

    if (data.roleId) {
      const newRole = await prisma.role.findUnique({
        where: { id: data.roleId },
      });
      if (!newRole || newRole.scope !== "shop" || newRole.name === "shop_admin") {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors: { roleId: "You can only assign shop staff roles." },
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.mobile !== undefined && { mobile: data.mobile || null }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: { role: true },
    });

    void logAudit({
      req,
      action: data.status === "inactive" ? "user.deactivate" : "user.update",
      entityType: "user",
      entityId: updated.id,
      targetShopId: access.shopId,
      metadata: { changes: data },
    });

    return res.json({ success: true, data: toApiShape(updated) });
  } catch (error) {
    const uniqueField = getUniqueUserField(error);
    if (uniqueField) {
      const message =
        uniqueField === "email"
          ? "This email is already registered"
          : "This mobile number is already registered";
      return res.status(409).json({
        success: false,
        message,
        errors: { [uniqueField]: message },
      });
    }
    console.error("updateShopUser failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function resetShopUserPassword(req: Request, res: Response) {
  const access = getShopAdminOrForbid(req, res);
  if (!access) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  const parsed = resetShopUserPasswordSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const existing = await prisma.user.findFirst({
      where: { id, shopId: access.shopId },
      include: { role: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (existing.id === access.actorId) {
      return res.status(403).json({
        success: false,
        message: "Use Profile settings to change your own password.",
      });
    }
    if (existing.role.name === "shop_admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot reset another shop admin's password.",
      });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
      include: { role: true },
    });

    void logAudit({
      req,
      action: "user.reset_password",
      entityType: "user",
      entityId: updated.id,
      targetShopId: access.shopId,
    });

    return res.json({ success: true, data: toApiShape(updated) });
  } catch (error) {
    console.error("resetShopUserPassword failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
