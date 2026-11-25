import type { Request, Response } from "express";
import type { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { prisma } from "../lib/prisma.js";
import {
  createNewsSchema,
  formatNewsValidationErrors,
  newsListQuerySchema,
  updateNewsSchema,
} from "../schemas/news.schema.js";

/* ================================================================
   Helpers
   ================================================================ */

function notFound(res: Response) {
  return res.status(404).json({ success: false, message: "News post not found" });
}

function invalid(res: Response, error: ZodError) {
  return res.status(422).json({
    success: false,
    message: "Validation failed",
    errors: formatNewsValidationErrors(error),
  });
}

const authorSelect = {
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.NewsInclude;

/* ================================================================
   Platform-scoped endpoints
   ================================================================ */

export async function superListNews(req: Request, res: Response) {
  const parsed = newsListQuerySchema.safeParse(req.query);
  if (!parsed.success) return invalid(res, parsed.error);

  const { q, category, status } = parsed.data;
  const where: Prisma.NewsWhereInput = {
    ...(category !== "all" ? { category } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };

  try {
    // Counts are computed on the full table so metric cards stay accurate
    // while a search or filter is active.
    const [items, total, published, draft, pinned] = await Promise.all([
      prisma.news.findMany({
        where,
        include: authorSelect,
        orderBy: [
          { isPinned: "desc" },
          { publishedAt: "desc" },
          { id: "desc" },
        ],
      }),
      prisma.news.count(),
      prisma.news.count({ where: { status: "published" } }),
      prisma.news.count({ where: { status: "draft" } }),
      prisma.news.count({ where: { isPinned: true } }),
    ]);

    return res.status(200).json({
      success: true,
      data: { items, counts: { total, published, draft, pinned } },
    });
  } catch (error) {
    console.error("Error listing news:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superCreateNews(req: Request, res: Response) {
  const parsed = createNewsSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);

  const input = parsed.data;
  try {
    const created = await prisma.news.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        isPinned: input.isPinned,
        status: input.status,
        publishedAt: input.publishedAt ?? new Date(),
        createdById: req.user!.id,
      },
      include: authorSelect,
    });

    void logAudit({
      req,
      action: "news.create",
      entityType: "news",
      entityId: created.id,
      metadata: { title: created.title, status: created.status },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error("Error creating news:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superUpdateNews(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  const parsed = updateNewsSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);

  const input = parsed.data;
  const data: Prisma.NewsUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.category !== undefined) data.category = input.category;
  if (input.isPinned !== undefined) data.isPinned = input.isPinned;
  if (input.status !== undefined) data.status = input.status;
  if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt;

  try {
    const existing = await prisma.news.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return notFound(res);

    const updated = await prisma.news.update({
      where: { id },
      data,
      include: authorSelect,
    });

    void logAudit({
      req,
      action: "news.update",
      entityType: "news",
      entityId: updated.id,
      metadata: {
        title: updated.title,
        status: updated.status,
        isPinned: updated.isPinned,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating news:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superDeleteNews(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  try {
    const existing = await prisma.news.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) return notFound(res);

    await prisma.news.delete({ where: { id } });

    void logAudit({
      req,
      action: "news.delete",
      entityType: "news",
      entityId: existing.id,
      metadata: { title: existing.title },
    });

    return res.status(200).json({
      success: true,
      data: { id: existing.id },
    });
  } catch (error) {
    console.error("Error deleting news:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
