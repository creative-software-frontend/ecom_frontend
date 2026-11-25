import { z } from "zod";
import { fieldErrorsFromZod } from "../lib/validation.js";

/* ================================================================
   Support tickets. Categories and statuses mirror the string columns
   on SupportTicket so a crafted request cannot persist an unknown value.
   ================================================================ */

export const TICKET_CATEGORIES = [
  "pickup",
  "delivery",
  "payment",
  "billing",
  "service",
  "other",
] as const;
export const TICKET_STATUSES = ["open", "answered", "closed"] as const;
export const TICKET_STATUS_FILTERS = ["all", ...TICKET_STATUSES] as const;

const messageSchema = z
  .string()
  .trim()
  .min(1, "Message is required")
  .max(2000, "Message must be 2000 characters or fewer");

export const createTicketSchema = z.object({
  category: z.enum(TICKET_CATEGORIES),
  /** Blank input is treated as omitted; the server derives a readable title. */
  title: z
    .string()
    .trim()
    .max(200, "Title must be 200 characters or fewer")
    .optional()
    .transform((value) => (value ? value : undefined)),
  message: messageSchema,
});

export const replyMessageSchema = z.object({
  message: messageSchema,
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
});

export const shopSupportListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(TICKET_STATUS_FILTERS).default("all"),
});

export const superSupportListQuerySchema = shopSupportListQuerySchema.extend({
  shopId: z.coerce.number().int().positive().optional(),
});

export function formatSupportValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  return fieldErrorsFromZod(error);
}

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReplyMessageInput = z.infer<typeof replyMessageSchema>;
export type UpdateTicketStatusInput = z.infer<
  typeof updateTicketStatusSchema
>;
