import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { sendPrismaError } from "../lib/prismaError.js";
import { sanitizeHtml } from "../lib/sanitizeHtml.js";
import { prisma } from "../lib/prisma.js";
import {
  createPageSchema,
  formatPageValidationErrors,
  generatePageSlug,
  updatePageSchema,
} from "../schemas/page.schema.js";

/* ================================================================
   Helpers
   ================================================================ */

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message: "Shop-scoped endpoint. Super admins cannot manage shop pages here.",
    });
    return null;
  }
  return shopId;
}

function actorName(req: Request): string {
  return req.user?.name || req.user?.email || "Admin";
}

function pageNotFound(res: Response) {
  return res.status(404).json({ success: false, message: "Page not found" });
}

function handlePagePrismaError(error: unknown, res: Response): Response | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const message = "A page with this slug already exists.";
    return res.status(409).json({
      success: false,
      message,
      errors: { slug: message },
    });
  }
  return sendPrismaError(error, res);
}

/* ================================================================
   Endpoints
   ================================================================ */

export async function listPages(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  try {
    const items = await prisma.page.findMany({
      where: { shopId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        language: true,
        lastEditedBy: true,
        revisionCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function getPageById(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return pageNotFound(res);

  try {
    const page = await prisma.page.findFirst({ where: { id, shopId } });
    if (!page) return pageNotFound(res);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createPage(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = createPageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatPageValidationErrors(parsed.error),
    });
  }

  const input = parsed.data;
  const slug = input.slug ?? generatePageSlug(input.title);
  const contentHtml = sanitizeHtml(input.contentHtml);
  const actor = actorName(req);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const page = await tx.page.create({
        data: {
          shopId,
          title: input.title,
          slug,
          contentHtml,
          status: input.status,
          language: input.language,
          lastEditedBy: actor,
          revisionCount: 1,
        },
      });

      await tx.pageRevision.create({
        data: {
          pageId: page.id,
          title: page.title,
          contentHtml: page.contentHtml,
          editedBy: actor,
        },
      });

      return page;
    });

    void logAudit({
      req,
      action: "page.create",
      entityType: "page",
      entityId: created.id,
      targetShopId: shopId,
      metadata: { slug: created.slug },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    const handled = handlePagePrismaError(error, res);
    if (handled) return handled;
    console.error("Error creating page:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updatePage(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return pageNotFound(res);

  const parsed = updatePageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatPageValidationErrors(parsed.error),
    });
  }

  try {
    const existing = await prisma.page.findFirst({ where: { id, shopId } });
    if (!existing) return pageNotFound(res);

    const input = parsed.data;
    if (
      typeof input.slug === "string" &&
      input.slug.trim().toLowerCase() !== existing.slug
    ) {
      const message = "Slug cannot be changed after creation";
      return res.status(422).json({
        success: false,
        message,
        errors: { slug: message },
      });
    }

    const actor = actorName(req);
    const sanitizedHtml = sanitizeHtml(input.contentHtml);
    const contentChanged =
      existing.title !== input.title || existing.contentHtml !== sanitizedHtml;

    const updated = await prisma.$transaction(async (tx) => {
      if (contentChanged) {
        await tx.pageRevision.create({
          data: {
            pageId: id,
            title: existing.title,
            contentHtml: existing.contentHtml,
            editedBy: existing.lastEditedBy,
          },
        });
      }

      return tx.page.update({
        where: { id },
        data: {
          title: input.title,
          contentHtml: sanitizedHtml,
          ...(input.status !== undefined && { status: input.status }),
          ...(input.language !== undefined && { language: input.language }),
          lastEditedBy: actor,
          ...(contentChanged && { revisionCount: { increment: 1 } }),
        },
      });
    });

    void logAudit({
      req,
      action: "page.update",
      entityType: "page",
      entityId: updated.id,
      targetShopId: shopId,
      metadata: { slug: updated.slug, status: updated.status },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    const handled = handlePagePrismaError(error, res);
    if (handled) return handled;
    console.error("Error updating page:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function listPageRevisions(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return pageNotFound(res);

  try {
    const page = await prisma.page.findFirst({
      where: { id, shopId },
      select: { id: true },
    });
    if (!page) return pageNotFound(res);

    const items = await prisma.pageRevision.findMany({
      where: { pageId: id },
      orderBy: { editedAt: "desc" },
      take: 30,
    });

    return res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    console.error("Error fetching page revisions:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function restorePageRevision(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  const revisionId = parseId(req.params.revisionId);
  if (id === null || revisionId === null) return pageNotFound(res);

  try {
    const page = await prisma.page.findFirst({ where: { id, shopId } });
    if (!page) return pageNotFound(res);

    const revision = await prisma.pageRevision.findFirst({
      where: { id: revisionId, pageId: id },
    });
    if (!revision) {
      return res
        .status(404)
        .json({ success: false, message: "Page revision not found" });
    }

    const actor = actorName(req);
    const contentChanged =
      page.title !== revision.title || page.contentHtml !== revision.contentHtml;

    const updated = await prisma.$transaction(async (tx) => {
      if (contentChanged) {
        await tx.pageRevision.create({
          data: {
            pageId: id,
            title: page.title,
            contentHtml: page.contentHtml,
            editedBy: page.lastEditedBy,
          },
        });
      }

      return tx.page.update({
        where: { id },
        data: {
          title: revision.title,
          contentHtml: revision.contentHtml,
          lastEditedBy: actor,
          revisionCount: { increment: 1 },
        },
      });
    });

    void logAudit({
      req,
      action: "page.revision_restore",
      entityType: "page",
      entityId: updated.id,
      targetShopId: shopId,
      metadata: { revisionId },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    const handled = handlePagePrismaError(error, res);
    if (handled) return handled;
    console.error("Error restoring page revision:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function deletePage(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return pageNotFound(res);

  try {
    const existing = await prisma.page.findFirst({
      where: { id, shopId },
      select: { id: true, slug: true },
    });
    if (!existing) return pageNotFound(res);

    // Ownership was verified by the scoped findFirst above. Revisions cascade.
    await prisma.page.delete({ where: { id } });

    void logAudit({
      req,
      action: "page.delete",
      entityType: "page",
      entityId: id,
      targetShopId: shopId,
      metadata: { slug: existing.slug },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    const handled = handlePagePrismaError(error, res);
    if (handled) return handled;
    console.error("Error deleting page:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
