import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { IS_PRODUCTION, JWT_SECRET } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/auditLog.js";
import { generateShopSlug } from "../lib/shopSlug.js";

const DUMMY_PASSWORD_HASH =
  "$2b$12$ovTjS60rfPUAij6cC069qeltkyg7GtK7Ety/1nzknk1bx8YRFuxdK";

const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // ৩০ দিন

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

const registrationSchema = z.object({
  shopName: z.string().trim().min(1, "Shop name is required").max(150),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
  mobile: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^01[3-9]\d{8}$/.test(value),
      "Enter a valid mobile number",
    )
    .optional(),
  address: z.string().trim().max(500).optional(),
  password: z.string().min(12, "Password must be at least 12 characters"),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: IS_PRODUCTION,
  path: "/",
};

type UserWithRelations = NonNullable<
  Awaited<ReturnType<typeof prisma.user.findUnique>>
> & {
  role: { id: number; name: string; displayName: string; permissions: unknown };
  shop: { id: number; name: string; slug: string; status: string } | null;
};

function toAuthResponse(user: UserWithRelations) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    roleDisplayName: user.role.displayName,
    permissions:
      (user.role.permissions as Record<string, string[]> | null) ?? {},
    shopId: user.shopId,
    shop: user.shop
      ? {
          id: user.shop.id,
          name: user.shop.name,
          slug: user.shop.slug,
          status: user.shop.status,
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, shop: true },
    });

    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: "Your account is inactive." });
    }

    if (user.shopId && user.shop?.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: "This shop is inactive." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "8h",
    });

    res.cookie("admin_token", token, {
      ...cookieOptions,
      maxAge: SESSION_EXPIRY,
    });

    // Fire-and-forget lastLoginAt update
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((err: unknown) =>
        console.error("Failed to update lastLoginAt:", err),
      );

    // Fire-and-forget login audit — userId passed explicitly since
    // req.user isn't populated yet (login runs before requireAuth)
    void logAudit({
      req,
      userId: user.id,
      action: "login",
      metadata: { email: user.email, role: user.role.name },
      targetShopId: user.shopId,
    });

    return res.status(200).json({
      success: true,
      data: toAuthResponse(user as UserWithRelations),
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function register(req: Request, res: Response) {
  const parsed = registrationSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".") || "form";
      if (!(field in errors)) errors[field] = issue.message;
    }
    return res
      .status(422)
      .json({ success: false, message: "Validation failed", errors });
  }

  const { shopName, name, email, mobile, address, password } = parsed.data;

  try {
    const [role, slugResult] = await Promise.all([
      prisma.role.findUnique({ where: { name: "shop_admin" } }),
      generateShopSlug(shopName),
    ]);

    if (!role || role.scope !== "shop") {
      console.error("Shop admin role is missing or has an invalid scope");
      return res
        .status(500)
        .json({
          success: false,
          message: "Registration is currently unavailable",
        });
    }

    if (slugResult.conflict) {
      return res.status(409).json({
        success: false,
        message: "A shop with a similar name already exists",
        errors: {
          shopName: "This shop name creates a URL that is already taken",
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (transaction) => {
      const shop = await transaction.shop.create({
        data: {
          name: shopName,
          slug: slugResult.slug,
          mobile: mobile || null,
          address: address || null,
          status: "active",
        },
      });

      return transaction.user.create({
        data: {
          email,
          name,
          mobile: mobile || null,
          passwordHash,
          roleId: role.id,
          shopId: shop.id,
          status: "active",
          lastLoginAt: new Date(),
        },
        include: { role: true, shop: true },
      });
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "8h",
    });
    res.cookie("admin_token", token, {
      ...cookieOptions,
      maxAge: SESSION_EXPIRY,
    });

    void logAudit({
      req,
      userId: user.id,
      action: "shop.create",
      entityType: "shop",
      entityId: user.shopId ?? undefined,
      metadata: { name: shopName, slug: slugResult.slug, selfRegistered: true },
      targetShopId: user.shopId,
    });

    return res.status(201).json({
      success: true,
      data: toAuthResponse(user),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      const emailConflict =
        (Array.isArray(target) && target.includes("email")) ||
        (typeof target === "string" && target.includes("email"));
      return res.status(409).json({
        success: false,
        message: emailConflict
          ? "This email is already registered"
          : "A shop with a similar name already exists",
        errors: emailConflict
          ? { email: "This email is already registered" }
          : { shopName: "This shop name creates a URL that is already taken" },
      });
    }
    console.error("Error during shop registration:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export function logout(req: Request, res: Response) {
  // Best-effort audit: decode the token manually so we can log the actor
  // even though this route is intentionally unauthenticated (a corrupt
  // or expired cookie should still be able to clear itself).
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.["admin_token"];
  if (typeof token === "string") {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ["HS256"],
      });
      if (
        typeof payload === "object" &&
        payload !== null &&
        "id" in payload &&
        typeof payload.id === "number" &&
        Number.isSafeInteger(payload.id) &&
        payload.id > 0
      ) {
        void logAudit({
          req,
          userId: payload.id,
          action: "logout",
        });
      }
    } catch {
      // Token invalid/expired — still clear the cookie below.
    }
  }

  res.clearCookie("admin_token", cookieOptions);
  return res.status(200).json({ success: true });
}

export async function me(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  return res.json({
    success: true,
    data: toAuthResponse(user as UserWithRelations),
  });
}

const updateProfileSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
});

export async function updateProfile(req: Request, res: Response) {
  const current = req.user;
  if (!current) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid email address";
    return res.status(400).json({
      success: false,
      message: errorMsg,
      errors: { email: errorMsg },
    });
  }

  const { email } = parsed.data;

  try {
    if (email !== current.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== current.id) {
        return res.status(400).json({
          success: false,
          message: "This email is already in use",
          errors: { email: "This email is already in use" },
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: current.id },
      data: { email },
      include: { role: true, shop: true },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: toAuthResponse(updated as UserWithRelations),
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
