import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { IS_PRODUCTION, JWT_SECRET } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const DUMMY_PASSWORD_HASH =
  "$2b$12$ovTjS60rfPUAij6cC069qeltkyg7GtK7Ety/1nzknk1bx8YRFuxdK";

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: IS_PRODUCTION,
  path: "/",
};

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  const { email, password } = parsed.data;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(
      password,
      admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!admin || !passwordMatches) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: admin.id }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "8h",
    });

    res.cookie("admin_token", token, {
      ...cookieOptions,
      maxAge: EIGHT_HOURS_MS,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie("admin_token", cookieOptions);
  return res.status(200).json({ success: true });
}

export function me(req: Request, res: Response) {
  const admin = req.admin;

  if (!admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  return res.json({
    success: true,
    data: {
      id: admin.id,
      email: admin.email,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    },
  });
}

const updateProfileSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});

export async function updateProfile(req: Request, res: Response) {
  const admin = req.admin;

  if (!admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Invalid email address";
    return res.status(400).json({
      success: false,
      message: errorMsg,
      errors: { email: errorMsg },
    });
  }

  const { email } = parsed.data;

  try {
    if (email !== admin.email) {
      const existing = await prisma.admin.findUnique({ where: { email } });
      if (existing && existing.id !== admin.id) {
        return res.status(400).json({
          success: false,
          message: "This email is already in use by another admin",
          errors: { email: "This email is already in use by another admin" },
        });
      }
    }

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: { email },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updated.id,
        email: updated.email,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
