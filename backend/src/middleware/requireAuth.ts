import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

function isUserPayload(
  payload: string | JwtPayload,
): payload is JwtPayload & { id: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.id === "string"
  );
}

function unauthorized(res: Response, message = "Unauthorized") {
  return res.status(401).json({ success: false, message });
}

function forbidden(res: Response, message = "Forbidden") {
  return res.status(403).json({ success: false, message });
}

export async function requireAuth(
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
    if (!isUserPayload(payload)) {
      return unauthorized(res);
    }

    // Load user with role + shop so middleware can enforce account and
    // shop-level status checks and downstream handlers get req.permissions.
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true, shop: true },
    });
    if (!user) {
      return unauthorized(res);
    }

    if (user.status !== "active") {
      return forbidden(
        res,
        "Your account is inactive. Contact the administrator.",
      );
    }

    // Shop scope: super admin has no shop; shop users inherit shop status.
    if (user.shopId && user.shop?.status !== "active") {
      return forbidden(
        res,
        "This shop is inactive. Please contact platform support.",
      );
    }

    const permissions =
      (user.role.permissions as Record<string, string[]> | null) ?? {};

    req.user = user;
    req.permissions = permissions;
    return next();
  } catch {
    return unauthorized(res);
  }
}
