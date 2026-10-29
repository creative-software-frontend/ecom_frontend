import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { readJsonFile, writeJsonFile } from "../services/db.service.js";
import { prisma } from "../lib/prisma.js";
import {
  changePasswordSchema,
  formatSettingsValidationErrors,
  storeSettingsSchema,
} from "../schemas/settings.schema.js";

export async function getSettings(_req: Request, res: Response) {
  try {
    const store = await readJsonFile("store.json");
    return res.status(200).json({ success: true, data: store });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateStoreSettings(req: Request, res: Response) {
  const parsed = storeSettingsSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid settings data",
      errors: formatSettingsValidationErrors(parsed.error),
    });
  }

  try {
    await writeJsonFile("store.json", parsed.data);
    return res.status(200).json({
      success: true,
      data: parsed.data,
      message: "Store settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating store settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function changePassword(req: Request, res: Response) {
  const admin = req.admin;
  if (!admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid password data",
      errors: formatSettingsValidationErrors(parsed.error),
    });
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        errors: { currentPassword: "Current password is incorrect" },
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing admin password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

