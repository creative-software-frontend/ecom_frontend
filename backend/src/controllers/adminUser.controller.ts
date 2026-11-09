import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/auditLog.js";
import {
  createUserSchema,
  updateUserSchema,
  resetUserPasswordSchema,
} from "../schemas/adminUser.schema.js";

type UserWithRelations = Prisma.UserGetPayload<{
  include: { role: true; shop: true };
}>;

function toApiShape(u: UserWithRelations) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    mobile: u.mobile ?? "",
    roleId: u.roleId,
    role: u.role.name,
    roleDisplayName: u.role.displayName,
    shopId: u.shopId,
    shop: u.shop
      ? { id: u.shop.id, name: u.shop.name, slug: u.shop.slug }
      : null,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

// Count active super_admin users — used to protect the last one.
async function countActiveSuperAdmins(excludeUserId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      status: "active",
      role: { name: "super_admin" },
      ...(excludeUserId && { id: { not: excludeUserId } }),
    },
  });
}

export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50),
  );
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const roleId =
    typeof req.query.roleId === "string" ? req.query.roleId : undefined;
  const shopFilter = req.query.shopId;
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { mobile: { contains: q } },
    ];
  }
  if (roleId) where.roleId = roleId;
  if (status) where.status = status;
  // Special value "null" filters platform users (no shop).
  if (shopFilter === "null") where.shopId = null;
  else if (typeof shopFilter === "string") where.shopId = shopFilter;

  try {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true, shop: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return res.json({
      success: true,
      data: { items: items.map(toApiShape), page, limit, total },
    });
  } catch (error) {
    console.error("listUsers failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".") || "form";
      if (!(k in errors)) errors[k] = i.message;
    }
    return res
      .status(422)
      .json({ success: false, message: "Validation failed", errors });
  }
  const data = parsed.data;

  try {
    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: { roleId: "Role not found" },
      });
    }

    // Shop-scoped roles must have a shop; platform roles must not.
    if (role.scope === "shop" && !data.shopId) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: { shopId: "Shop is required for shop-scoped roles" },
      });
    }
    if (role.scope === "platform" && data.shopId) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: { shopId: "Platform roles cannot be assigned to a shop" },
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        mobile: data.mobile || null,
        passwordHash,
        roleId: data.roleId,
        shopId: data.shopId,
        status: data.status,
      },
      include: { role: true, shop: true },
    });

    void logAudit({
      req,
      action: "user.create",
      entityType: "user",
      entityId: user.id,
      metadata: { email: user.email, role: role.name, shopId: user.shopId },
      targetShopId: user.shopId,
    });

    return res.status(201).json({ success: true, data: toApiShape(user) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
        errors: { email: "This email is already registered" },
      });
    }
    console.error("createUser failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const actor = req.user!;
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".") || "form";
      if (!(k in errors)) errors[k] = i.message;
    }
    return res
      .status(422)
      .json({ success: false, message: "Validation failed", errors });
  }
  const data = parsed.data;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Self-protection rules: cannot change own role or deactivate self.
    if (existing.id === actor.id) {
      if (data.roleId && data.roleId !== existing.roleId) {
        return res.status(403).json({
          success: false,
          message: "You cannot change your own role",
        });
      }
      if (data.status === "inactive") {
        return res.status(403).json({
          success: false,
          message: "You cannot deactivate your own account",
        });
      }
    }

    // Last super_admin protection.
    if (
      existing.role.name === "super_admin" &&
      (data.status === "inactive" ||
        (data.roleId && data.roleId !== existing.roleId))
    ) {
      const remaining = await countActiveSuperAdmins(existing.id);
      if (remaining === 0) {
        return res.status(403).json({
          success: false,
          message: "Cannot remove the last active super admin",
        });
      }
    }

    // Validate new role's scope vs shop.
    if (data.roleId) {
      const newRole = await prisma.role.findUnique({
        where: { id: data.roleId },
      });
      if (!newRole) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors: { roleId: "Role not found" },
        });
      }
      const finalShopId =
        data.shopId !== undefined ? data.shopId : existing.shopId;
      if (newRole.scope === "shop" && !finalShopId) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors: { shopId: "Shop is required for shop-scoped roles" },
        });
      }
      if (newRole.scope === "platform" && finalShopId) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors: { shopId: "Platform roles cannot be assigned to a shop" },
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.mobile !== undefined && { mobile: data.mobile || null }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.shopId !== undefined && { shopId: data.shopId }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: { role: true, shop: true },
    });

    void logAudit({
      req,
      action: data.status === "inactive" ? "user.deactivate" : "user.update",
      entityType: "user",
      entityId: updated.id,
      metadata: { changes: data },
      targetShopId: updated.shopId,
    });

    return res.json({ success: true, data: toApiShape(updated) });
  } catch (error) {
    console.error("updateUser failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function resetUserPassword(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = resetUserPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: {
        password: parsed.error.issues[0]?.message ?? "Invalid password",
      },
    });
  }
  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }
  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const updated = await prisma.user.update({
      where: { id },
      data: { passwordHash },
      include: { role: true, shop: true },
    });

    void logAudit({
      req,
      action: "user.reset_password",
      entityType: "user",
      entityId: updated.id,
      targetShopId: updated.shopId,
    });

    return res.json({ success: true, data: toApiShape(updated) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    console.error("resetUserPassword failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const actor = req.user!;

  if (id === actor.id) {
    return res.status(403).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }
  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }
  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (existing.role.name === "super_admin" && existing.status === "active") {
      const remaining = await countActiveSuperAdmins(existing.id);
      if (remaining === 0) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete the last active super admin",
        });
      }
    }

    // Soft delete — hard delete is blocked to preserve audit refs.
    const updated = await prisma.user.update({
      where: { id },
      data: { status: "inactive" },
      include: { role: true, shop: true },
    });

    void logAudit({
      req,
      action: "user.delete",
      entityType: "user",
      entityId: updated.id,
      metadata: { email: existing.email },
      targetShopId: updated.shopId,
    });

    return res.json({ success: true, data: toApiShape(updated) });
  } catch (error) {
    console.error("deleteUser failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
