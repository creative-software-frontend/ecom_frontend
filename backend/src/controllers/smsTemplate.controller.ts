import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { sendValidationError } from "../lib/validation.js";
import { smsTemplateSchema } from "../schemas/smsTemplate.schema.js";

function getShopId(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message: "A shop account is required for SMS templates.",
    });
    return null;
  }
  return shopId;
}

export async function listSmsTemplates(req: Request, res: Response) {
  const shopId = getShopId(req, res);
  if (!shopId) return;

  try {
    const templates = await prisma.smsTemplate.findMany({
      where: { shopId },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      success: true,
      data: templates.map((template) => ({
        id: template.id,
        name: template.name,
        message: template.message,
      })),
    });
  } catch (error) {
    console.error("Error fetching SMS templates:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createSmsTemplate(req: Request, res: Response) {
  const shopId = getShopId(req, res);
  if (!shopId) return;

  const parsed = smsTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const template = await prisma.smsTemplate.create({
      data: {
        shopId,
        name: parsed.data.name,
        message: parsed.data.message,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        message: template.message,
      },
    });
  } catch (error) {
    console.error("Error creating SMS template:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateSmsTemplate(req: Request, res: Response) {
  const shopId = getShopId(req, res);
  if (!shopId) return;

  const templateId = Number(req.params.id);
  if (!Number.isSafeInteger(templateId) || templateId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid SMS template ID.",
    });
  }

  const parsed = smsTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const existing = await prisma.smsTemplate.findFirst({
      where: { id: templateId, shopId },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "SMS template not found.",
      });
    }

    const template = await prisma.smsTemplate.update({
      where: { id: templateId },
      data: {
        name: parsed.data.name,
        message: parsed.data.message,
      },
    });

    return res.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        message: template.message,
      },
    });
  } catch (error) {
    console.error("Error updating SMS template:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
