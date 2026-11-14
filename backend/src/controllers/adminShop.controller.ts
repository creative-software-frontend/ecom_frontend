import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { parseId } from "../lib/parseId.js";
import { logAudit } from "../lib/auditLog.js";
import {
  createShopSchema,
  updateShopSchema,
} from "../schemas/adminShop.schema.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

async function generateShopSlug(
  name: string,
): Promise<{ slug: string; conflict: boolean }> {
  const base = slugify(name);

  if (!base) {
    for (let i = 0; i < 5; i++) {
      const slug = `shop-${Math.random().toString(36).substring(2, 8)}`;
      const exists = await prisma.shop.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) return { slug, conflict: false };
    }
    throw new Error("Could not generate unique slug after 5 attempts");
  }

  const exists = await prisma.shop.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  return { slug: base, conflict: Boolean(exists) };
}

function toApiShape(
  s: {
    id: number;
    name: string;
    status: string;
    mobile: string | null;
    address: string | null;
    trialEndsAt: Date | null;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  userCount = 0,
) {
  return {
    id: s.id,
    name: s.name,
    status: s.status,
    mobile: s.mobile ?? "",
    address: s.address ?? "",
    trialEndsAt: s.trialEndsAt,
    expiryDate: s.expiryDate,
    userCount,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export async function listShops(_req: Request, res: Response) {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    });
    return res.json({
      success: true,
      data: shops.map((s) => toApiShape(s, s._count.users)),
    });
  } catch (error) {
    console.error("listShops failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createShop(req: Request, res: Response) {
  const parsed = createShopSchema.safeParse(req.body);
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
    const { slug, conflict } = await generateShopSlug(parsed.data.name);

    if (conflict) {
      return res.status(409).json({
        success: false,
        message:
          "A shop with a similar name already exists. Please choose a different name.",
        errors: {
          name: "This name creates a URL that is already taken. Try a more specific name (e.g. add the area).",
        },
      });
    }

    const shop = await prisma.shop.create({
      data: {
        slug,
        name: parsed.data.name,
        mobile: parsed.data.mobile || null,
        address: parsed.data.address || null,
        status: parsed.data.status,
      },
    });
    void logAudit({
      req,
      action: "shop.create",
      entityType: "shop",
      entityId: shop.id,
      metadata: { name: shop.name, slug: shop.slug },
      targetShopId: shop.id,
    });
    return res.status(201).json({ success: true, data: toApiShape(shop) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A shop with a similar name already exists. Please choose a different name.",
        errors: {
          name: "This name creates a URL that is already taken.",
        },
      });
    }
    console.error("createShop failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateShop(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ success: false, message: "Invalid shop ID" });
  }
  const parsed = updateShopSchema.safeParse(req.body);
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
    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.mobile !== undefined && {
          mobile: parsed.data.mobile || null,
        }),
        ...(parsed.data.address !== undefined && {
          address: parsed.data.address || null,
        }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      },
    });

    const action =
      parsed.data.status === "inactive"
        ? "shop.deactivate"
        : parsed.data.status === "active"
          ? "shop.activate"
          : "shop.update";

    void logAudit({
      req,
      action,
      entityType: "shop",
      entityId: updated.id,
      metadata: { name: updated.name, status: updated.status },
      targetShopId: updated.id,
    });

    return res.json({ success: true, data: toApiShape(updated) });
  } catch (error) {
    console.error("updateShop failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
