import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

function isAdminPayload(
  payload: string | JwtPayload,
): payload is JwtPayload & { id: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.id === "string"
  );
}

function unauthorized(res: Response) {
  return res.status(401).json({ success: false, message: "Unauthorized" });
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.["admin_token"];

  if (typeof token !== "string" || token.length === 0) {
    return unauthorized(res);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!isAdminPayload(payload)) {
      return unauthorized(res);
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.id },
    });

    if (!admin) {
      return unauthorized(res);
    }

    req.admin = admin;
    return next();
  } catch {
    return unauthorized(res);
  }
}
