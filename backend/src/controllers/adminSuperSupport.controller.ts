import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { prisma } from "../lib/prisma.js";
import { sendValidationError } from "../lib/validation.js";
import {
  replyMessageSchema,
  superSupportListQuerySchema,
  updateTicketStatusSchema,
} from "../schemas/support.schema.js";

/* ================================================================
   Platform-scoped support inbox. Mounted behind requireAuth +
   requireSuperAdmin, so every ticket across every shop is visible.
   ================================================================ */

function notFound(res: Response) {
  return res
    .status(404)
    .json({ success: false, message: "Support ticket not found" });
}

const summaryInclude = {
  shop: { select: { id: true, name: true, slug: true } },
  createdBy: { select: { id: true, name: true } },
  messages: {
    take: 1,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { message: true },
  },
  _count: { select: { messages: true } },
} satisfies Prisma.SupportTicketInclude;

const detailInclude = {
  shop: { select: { id: true, name: true, slug: true } },
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
    shop: ticket.shop,
    createdBy: ticket.createdBy,
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
    shop: ticket.shop,
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

async function findDetail(id: number) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: detailInclude,
  });
  return ticket ? toDetail(ticket) : null;
}

export async function superListTickets(req: Request, res: Response) {
  const parsed = superSupportListQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { q, status, shopId } = parsed.data;
  const baseWhere: Prisma.SupportTicketWhereInput =
    shopId === undefined ? {} : { shopId };
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
    console.error("Error listing support tickets (super):", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superGetTicketById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  try {
    const ticket = await findDetail(id);
    if (!ticket) return notFound(res);
    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error fetching support ticket (super):", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superReplyTicket(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  const parsed = replyMessageSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, shopId: true, status: true },
    });
    if (!existing) return notFound(res);
    if (existing.status === "closed") {
      return res.status(422).json({
        success: false,
        message: "Cannot reply to a closed ticket. Reopen it first.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.supportMessage.create({
        data: {
          ticketId: id,
          senderId: req.user!.id,
          senderType: "support",
          message: parsed.data.message,
        },
      });
      await tx.supportTicket.update({
        where: { id },
        data: {
          lastMessageAt: new Date(),
          ...(existing.status === "open" ? { status: "answered" } : {}),
        },
      });
    });

    const ticket = await findDetail(id);
    if (!ticket) return notFound(res);

    void logAudit({
      req,
      action: "support.reply",
      entityType: "support_ticket",
      entityId: existing.id,
      targetShopId: existing.shopId,
    });

    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error replying to support ticket (super):", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superUpdateTicketStatus(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  const parsed = updateTicketStatusSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const status = parsed.data.status;

  try {
    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, shopId: true, status: true },
    });
    if (!existing) return notFound(res);

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        closedAt: status === "closed" ? new Date() : null,
      },
    });

    const ticket = await findDetail(id);
    if (!ticket) return notFound(res);

    void logAudit({
      req,
      action: "support.status_update",
      entityType: "support_ticket",
      entityId: existing.id,
      targetShopId: existing.shopId,
      metadata: { previousStatus: existing.status, status },
    });

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error updating support ticket status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
