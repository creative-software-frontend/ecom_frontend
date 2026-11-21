import type { Request, Response } from "express";
import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { IS_PRODUCTION, JWT_SECRET } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/auditLog.js";
import { generateShopSlug, isShopSlugUniqueConflict } from "../lib/shopSlug.js";

const DUMMY_PASSWORD_HASH =
  "$2b$12$ovTjS60rfPUAij6cC069qeltkyg7GtK7Ety/1nzknk1bx8YRFuxdK";

const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // ৩০ দিন
const MOBILE_VERIFICATION_EXPIRY_MS = 10 * 60 * 1000;
const MOBILE_VERIFICATION_MAX_ATTEMPTS = 5;
const BD_MOBILE_PATTERN = /^01[3-9]\d{8}$/;

const registrationMobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(BD_MOBILE_PATTERN, "Enter a valid BD mobile number"),
});

const requestMobileVerificationSchema = registrationMobileSchema.extend({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
});

const verifyMobileSchema = registrationMobileSchema.extend({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

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
    .regex(BD_MOBILE_PATTERN, "Enter a valid mobile number"),
  address: z.string().trim().max(500).optional(),
  password: z.string().min(12, "Password must be at least 12 characters"),
  verificationToken: z.string().min(32).max(128),
});

function hashVerificationValue(purpose: string, value: string): string {
  return createHmac("sha256", JWT_SECRET)
    .update(`${purpose}:${value}`)
    .digest("hex");
}

function hashesMatch(expectedHash: string, actualHash: string): boolean {
  return (
    /^[a-f0-9]{64}$/i.test(expectedHash) &&
    timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(actualHash, "hex"),
    )
  );
}

class InvalidMobileVerificationError extends Error {}

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

export async function requestRegistrationMobileVerification(
  req: Request,
  res: Response,
) {
  const parsed = requestMobileVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field] = issue.message;
      }
    }
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const { email, mobile } = parsed.data;
  try {
    const [existingEmail, existingMobile] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { mobile },
        select: { id: true },
      }),
    ]);

    const errors: Record<string, string> = {};
    if (existingEmail) errors.email = "This email is already registered";
    if (existingMobile) {
      errors.mobile = "This mobile number is already registered";
    }
    if (Object.keys(errors).length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account already uses this email or mobile number",
        errors,
      });
    }
  } catch (error) {
    console.error("Error checking shop registration uniqueness:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to check registration details",
    });
  }

  if (IS_PRODUCTION) {
    return res.status(503).json({
      success: false,
      message: "Mobile verification delivery is not configured",
    });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.mobileVerification.deleteMany({
        where: { expiresAt: { lt: now } },
      });
      await transaction.mobileVerification.updateMany({
        where: { mobile, consumedAt: null },
        data: { consumedAt: now },
      });
      await transaction.mobileVerification.create({
        data: {
          mobile,
          codeHash: hashVerificationValue("mobile-otp", code),
          expiresAt: new Date(now.getTime() + MOBILE_VERIFICATION_EXPIRY_MS),
        },
      });
    });

    return res.status(201).json({
      success: true,
      data: {
        expiresInSeconds: MOBILE_VERIFICATION_EXPIRY_MS / 1000,
        developmentCode: code,
      },
    });
  } catch (error) {
    console.error(
      "Error creating shop registration mobile verification:",
      error,
    );
    return res
      .status(500)
      .json({ success: false, message: "Unable to send a verification code" });
  }
}

export async function verifyRegistrationMobile(req: Request, res: Response) {
  const parsed = verifyMobileSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field] = issue.message;
      }
    }
    return res
      .status(422)
      .json({ success: false, message: "Validation failed", errors });
  }

  const { mobile, code } = parsed.data;
  const now = new Date();

  try {
    const challenge = await prisma.mobileVerification.findFirst({
      where: {
        mobile,
        verifiedAt: null,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return res.status(422).json({
        success: false,
        message: "The verification code is invalid or expired",
      });
    }

    if (challenge.attempts >= MOBILE_VERIFICATION_MAX_ATTEMPTS) {
      return res.status(422).json({
        success: false,
        message: "Too many incorrect codes. Request a new verification code.",
      });
    }

    const submittedHash = hashVerificationValue("mobile-otp", code);
    if (!hashesMatch(challenge.codeHash, submittedHash)) {
      await prisma.mobileVerification.updateMany({
        where: {
          id: challenge.id,
          attempts: { lt: MOBILE_VERIFICATION_MAX_ATTEMPTS },
          verifiedAt: null,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { attempts: { increment: 1 } },
      });
      return res.status(422).json({
        success: false,
        message: "The verification code is incorrect",
        errors: { code: "The verification code is incorrect" },
      });
    }

    const verificationToken = randomBytes(32).toString("base64url");
    const result = await prisma.mobileVerification.updateMany({
      where: {
        id: challenge.id,
        attempts: { lt: MOBILE_VERIFICATION_MAX_ATTEMPTS },
        verifiedAt: null,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        verifiedAt: now,
        verificationTokenHash: hashVerificationValue(
          "mobile-registration-token",
          verificationToken,
        ),
      },
    });

    if (result.count !== 1) {
      return res.status(422).json({
        success: false,
        message: "The verification code is invalid or expired",
      });
    }

    return res.status(200).json({
      success: true,
      data: { verificationToken },
    });
  } catch (error) {
    console.error("Error verifying shop registration mobile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to verify the mobile number" });
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

  const {
    shopName,
    name,
    email,
    mobile,
    address,
    password,
    verificationToken,
  } = parsed.data;

  try {
    const existingAccount = await prisma.user.findFirst({
      where: { OR: [{ email }, { mobile }] },
      select: { email: true, mobile: true },
    });
    if (existingAccount) {
      const errors: Record<string, string> = {};
      if (existingAccount.email === email) {
        errors.email = "This email is already registered";
      }
      if (existingAccount.mobile === mobile) {
        errors.mobile = "This mobile number is already registered";
      }
      return res.status(409).json({
        success: false,
        message: "An account already uses this email or mobile number",
        errors,
      });
    }

    const role = await prisma.role.findUnique({
      where: { name: "shop_admin" },
    });

    if (!role || role.scope !== "shop") {
      console.error("Shop admin role is missing or has an invalid scope");
      return res.status(500).json({
        success: false,
        message: "Registration is currently unavailable",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const createRegistration = (slug: string) =>
      prisma.$transaction(async (transaction) => {
        const verificationAt = new Date();
        const verification = await transaction.mobileVerification.updateMany({
          where: {
            mobile,
            verificationTokenHash: hashVerificationValue(
              "mobile-registration-token",
              verificationToken,
            ),
            verifiedAt: { not: null },
            consumedAt: null,
            expiresAt: { gt: verificationAt },
          },
          data: { consumedAt: verificationAt },
        });
        if (verification.count !== 1) {
          throw new InvalidMobileVerificationError();
        }

        const shop = await transaction.shop.create({
          data: {
            name: shopName,
            slug,
            mobile: mobile || null,
            address: address || null,
            status: "inactive",
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
            status: "inactive",
            mobileVerifiedAt: verificationAt,
            lastLoginAt: new Date(),
          },
          include: { role: true, shop: true },
        });
      });

    let slug: string | undefined;
    let user: Awaited<ReturnType<typeof createRegistration>> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      slug = await generateShopSlug(shopName);
      try {
        user = await createRegistration(slug);
        break;
      } catch (error) {
        if (!isShopSlugUniqueConflict(error) || attempt === 2) throw error;
      }
    }

    if (!user || !slug) {
      throw new Error("Could not create shop with a unique URL");
    }

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
      metadata: { name: shopName, slug, selfRegistered: true },
      targetShopId: user.shopId,
    });

    return res.status(201).json({
      success: true,
      data: toAuthResponse(user),
    });
  } catch (error) {
    if (error instanceof InvalidMobileVerificationError) {
      return res.status(422).json({
        success: false,
        message: "Verify your mobile number before creating a shop",
        errors: { mobile: "Verify your mobile number before creating a shop" },
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      const emailConflict =
        (Array.isArray(target) && target.includes("email")) ||
        (typeof target === "string" && target.includes("email"));
      const mobileConflict =
        (Array.isArray(target) && target.includes("mobile")) ||
        (typeof target === "string" && target.includes("mobile"));
      return res.status(409).json({
        success: false,
        message: emailConflict
          ? "This email is already registered"
          : mobileConflict
            ? "This mobile number is already registered"
            : "A shop with this name was just created. Please try again.",
        errors: emailConflict
          ? { email: "This email is already registered" }
          : mobileConflict
            ? { mobile: "This mobile number is already registered" }
            : { shopName: "Please retry shop registration." },
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
