import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { prisma } from "../lib/prisma.js";
import { sendValidationError } from "../lib/validation.js";
import {
  createTicketSchema,
  replyMessageSchema,
  shopSupportListQuerySchema,
  type CreateTicketInput,
} from "../schemas/support.schema.js";

/* ================================================================
   Shop-scoped support tickets.
   Every query is filtered by the authenticated user's shopId.
   ================================================================ */

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins must use /api/admin/super/support.",
    });
    return null;
  }
  return shopId;
}

function notFound(res: Response) {
  return res
    .status(404)
    .json({ success: false, message: "Support ticket not found" });
}

const CATEGORY_LABELS: Record<CreateTicketInput["category"], string> = {
  pickup: "Pickup",
  delivery: "Delivery",
  payment: "Payment",
  billing: "Billing",
  service: "Service",
  other: "Other",
};

const summaryInclude = {
  messages: {
    take: 1,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { message: true },
  },
  _count: { select: { messages: true } },
} satisfies Prisma.SupportTicketInclude;

const detailInclude = {
  createdBy: { select: { id: true, name: true } },
  messages: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { sender: { select: { id: true, name: true } } },
  },
} satisfies Prisma.SupportTicketInclude;

type SummaryRecord = Prisma.SupportTicketGetPayload<{
  include: typeof summaryInclude;
}>;
type DetailRecord = Prisma.SupportTicketGetPayload<{
  include: typeof detailInclude;
}>;

function toSummary(ticket: SummaryRecord) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    shopId: ticket.shopId,
    createdById: ticket.createdById,
    title: ticket.title,
    category: ticket.category,
    status: ticket.status,
    lastMessageAt: ticket.lastMessageAt,
    closedAt: ticket.closedAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    preview: ticket.messages[0]?.message ?? null,
    messageCount: ticket._count.messages,
  };
}

function toDetail(ticket: DetailRecord) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    shopId: ticket.shopId,
    createdById: ticket.createdById,
    title: ticket.title,
    category: ticket.category,
    status: ticket.status,
    lastMessageAt: ticket.lastMessageAt,
    closedAt: ticket.closedAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    createdBy: ticket.createdBy,
    messages: ticket.messages.map((message) => ({
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      senderType: message.senderType,
      message: message.message,
      createdAt: message.createdAt,
      sender: message.sender,
    })),
  };
}

async function findDetail(id: number, shopId: number) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, shopId },
    include: detailInclude,
  });
  return ticket ? toDetail(ticket) : null;
}

export async function listShopTickets(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = shopSupportListQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { q, status } = parsed.data;
  const baseWhere: Prisma.SupportTicketWhereInput = { shopId };
  const where: Prisma.SupportTicketWhereInput = {
    ...baseWhere,
    ...(status !== "all" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { ticketNumber: { contains: q } },
            { title: { contains: q } },
          ],
        }
      : {}),
  };

  try {
    const [items, total, open, answered, closed] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: summaryInclude,
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      }),
      prisma.supportTicket.count({ where: baseWhere }),
      prisma.supportTicket.count({ where: { ...baseWhere, status: "open" } }),
      prisma.supportTicket.count({
        where: { ...baseWhere, status: "answered" },
      }),
      prisma.supportTicket.count({ where: { ...baseWhere, status: "closed" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items: items.map(toSummary),
        counts: { total, open, answered, closed },
      },
    });
  } catch (error) {
    console.error("Error listing support tickets:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function getShopTicketById(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  try {
    const ticket = await findDetail(id, shopId);
    if (!ticket) return notFound(res);
    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createShopTicket(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const input = parsed.data;
  const actorId = req.user!.id;
  const title = input.title || `${CATEGORY_LABELS[input.category]} request`;

  try {
    const createdId = await prisma.$transaction(async (tx) => {
      const draft = await tx.supportTicket.create({
        data: {
          ticketNumber: `T-TMP-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          shopId,
          createdById: actorId,
          title,
          category: input.category,
        },
      });
      const finalNumber = `T-${1000 + draft.id}`;
      await tx.supportTicket.update({
        where: { id: draft.id },
        data: { ticketNumber: finalNumber },
      });
      await tx.supportMessage.create({
        data: {
          ticketId: draft.id,
          senderId: actorId,
          senderType: "shop",
          message: input.message,
        },
      });
      return draft.id;
    });

    // The number depends on the inserted id, so read it back after commit.
    const finalNumber = `T-${1000 + createdId}`;
    const ticket = await findDetail(createdId, shopId);
    if (!ticket) return notFound(res);

    void logAudit({
      req,
      action: "support.create",
      entityType: "support_ticket",
      entityId: createdId,
      targetShopId: shopId,
      metadata: { ticketNumber: finalNumber, category: input.category },
    });

    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function replyShopTicket(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  const parsed = replyMessageSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const existing = await prisma.supportTicket.findFirst({
      where: { id, shopId },
      select: { id: true, status: true },
    });
    if (!existing) return notFound(res);
    if (existing.status === "closed") {
      return res.status(422).json({
        success: false,
        message: "Cannot reply to a closed ticket.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.supportMessage.create({
        data: {
          ticketId: id,
          senderId: req.user!.id,
          senderType: "shop",
          message: parsed.data.message,
        },
      });
      await tx.supportTicket.update({
        where: { id },
        data: {
          lastMessageAt: new Date(),
          ...(existing.status === "answered" ? { status: "open" } : {}),
        },
      });
    });

    const ticket = await findDetail(id, shopId);
    if (!ticket) return notFound(res);

    void logAudit({
      req,
      action: "support.reply",
      entityType: "support_ticket",
      entityId: existing.id,
      targetShopId: shopId,
    });

    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error replying to support ticket:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function closeShopTicket(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  try {
    const existing = await prisma.supportTicket.findFirst({
      where: { id, shopId },
      select: { id: true, closedAt: true },
    });
    if (!existing) return notFound(res);

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: "closed",
        closedAt: existing.closedAt ?? new Date(),
      },
    });

    const ticket = await findDetail(id, shopId);
    if (!ticket) return notFound(res);

    void logAudit({
      req,
      action: "support.close",
      entityType: "support_ticket",
      entityId: existing.id,
      targetShopId: shopId,
    });

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error closing support ticket:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
