import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import {
  changePasswordSchema,
  formatSettingsValidationErrors,
} from "../schemas/settings.schema.js";

/* Only password change remains here.
   Store settings moved to adminStoreSettings.controller.ts (DB-backed). */
export async function changePassword(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
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
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        errors: { currentPassword: "Current password is incorrect" },
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
