import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { parseId } from "../lib/parseId.js";
import { logAudit } from "../lib/auditLog.js";
import {
  createRoleSchema,
  updateRoleSchema,
} from "../schemas/adminRole.schema.js";
import type { IdParams } from "../types/reuseable.type.js";

function toApiShape(
  r: {
    id: number;
    name: string;
    displayName: string;
    scope: string;
    permissions: unknown;
    isSystem: boolean;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  userCount = 0,
) {
  return {
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    scope: r.scope,
    permissions: (r.permissions as Record<string, string[]> | null) ?? {},
    isSystem: r.isSystem,
    description: r.description ?? "",
    userCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function listRoles(_req: Request, res: Response) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { users: true } } },
    });
    return res.json({
      success: true,
      data: roles.map((r) => toApiShape(r, r._count.users)),
    });
  } catch (error) {
    console.error("listRoles failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createRole(req: Request, res: Response) {
  const parsed = createRoleSchema.safeParse(req.body);
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

  try {
    const role = await prisma.role.create({
      data: {
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        scope: parsed.data.scope,
        permissions: parsed.data.permissions as Prisma.InputJsonValue,
        description: parsed.data.description || null,
        isSystem: false,
      },
    });
    void logAudit({
      req,
      action: "role.create",
      entityType: "role",
      entityId: role.id,
      metadata: { name: role.name, scope: role.scope },
    });
    return res.status(201).json({ success: true, data: toApiShape(role) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "Role name already in use",
        errors: { name: "This role name is taken" },
      });
    }
    console.error("createRole failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateRole(req: Request<IdParams>, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ success: false, message: "Invalid role ID" });
  }
  const parsed = updateRoleSchema.safeParse(req.body);
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

  try {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    // super_admin permissions are hard-coded; the UI may not change them.
    if (
      existing.name === "super_admin" &&
      parsed.data.permissions !== undefined
    ) {
      return res.status(403).json({
        success: false,
        message: "super_admin permissions cannot be modified",
      });
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(parsed.data.displayName !== undefined && {
          displayName: parsed.data.displayName,
        }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description || null,
        }),
        ...(parsed.data.permissions !== undefined && {
          permissions: parsed.data.permissions as Prisma.InputJsonValue,
        }),
      },
    });
    void logAudit({
      req,
      action: "role.update",
      entityType: "role",
      entityId: updated.id,
      metadata: { name: updated.name },
    });
    return res.json({ success: true, data: toApiShape(updated) });
  } catch (error) {
    console.error("updateRole failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function deleteRole(req: Request<IdParams>, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ success: false, message: "Invalid role ID" });
  }
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: "System roles cannot be deleted",
      });
    }
    if (role._count.users > 0) {
      return res.status(409).json({
        success: false,
        message: `Role is assigned to ${role._count.users} user(s). Reassign them first.`,
      });
    }

    await prisma.role.delete({ where: { id } });
    void logAudit({
      req,
      action: "role.delete",
      entityType: "role",
      entityId: id,
      metadata: { name: role.name },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("deleteRole failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
