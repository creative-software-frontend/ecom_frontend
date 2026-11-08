import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { storefrontSaveSchema } from "../schemas/storefrontSettings.schema.js";

/* ================================================================
   DB row -> API shape
   ================================================================ */

type StorefrontRow = NonNullable<
  Awaited<ReturnType<typeof prisma.storefrontSettings.findUnique>>
>;
type BannerRow = Awaited<ReturnType<typeof prisma.banner.findMany>>[number];

function bannerToApi(b: BannerRow) {
  return {
    id: b.id,
    image_url: b.imageUrl,
    alt_text: b.altText ?? "",
    link_url: b.linkUrl ?? "",
    is_active: b.isActive,
  };
}

function toApiShape(settings: StorefrontRow, banners: BannerRow[]) {
  return {
    announcement: {
      enabled: settings.announcementEnabled,
      marquee_text: settings.announcementText ?? "",
      order_note: settings.orderNote ?? "",
    },
    banners: banners.map(bannerToApi),
    brand_colors: {
      primary: settings.primaryColor,
      background: settings.backgroundColor,
    },
  };
}

/* ================================================================
   GET /api/admin/settings/storefront
   ================================================================ */

export async function getStorefrontSettings(_req: Request, res: Response) {
  try {
    const [settings, banners] = await Promise.all([
      prisma.storefrontSettings.findUnique({ where: { id: 1 } }),
      prisma.banner.findMany({ orderBy: { position: "asc" } }),
    ]);
    if (!settings) {
      return res.status(404).json({
        success: false,
        message:
          "Storefront settings not initialized. Run the migration script.",
      });
    }
    return res.json({ success: true, data: toApiShape(settings, banners) });
  } catch (error) {
    console.error("Error fetching storefront settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

/* ================================================================
   PUT /api/admin/settings/storefront

   Single transactional save:
     1. Upsert announcement + brand colors (singleton row id=1)
     2. Reconcile banners — new / updated / deleted, positions by array index
     3. Return the freshest full state so the client gets real UUIDs back
   ================================================================ */

export async function updateStorefrontSettings(req: Request, res: Response) {
  const parsed = storefrontSaveSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!(key in errors)) errors[key] = issue.message;
    }
    return res
      .status(422)
      .json({ success: false, message: "Validation failed", errors });
  }

  const { announcement, banners, brand_colors } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert singleton
      await tx.storefrontSettings.upsert({
        where: { id: 1 },
        update: {
          announcementEnabled: announcement.enabled,
          announcementText: announcement.marquee_text || null,
          orderNote: announcement.order_note || null,
          primaryColor: brand_colors.primary,
          backgroundColor: brand_colors.background,
        },
        create: {
          id: 1,
          announcementEnabled: announcement.enabled,
          announcementText: announcement.marquee_text || null,
          orderNote: announcement.order_note || null,
          primaryColor: brand_colors.primary,
          backgroundColor: brand_colors.background,
        },
      });

      // 2. Diff banners — one read for all current IDs
      const currentRows = await tx.banner.findMany({ select: { id: true } });
      const currentIds = new Set(currentRows.map((r) => r.id));
      const incomingIds = banners
        .map((b) => b.id)
        .filter((v): v is string => !!v && currentIds.has(v));

      // Delete banners no longer in the payload (or all, if payload is empty)
      if (incomingIds.length === 0) {
        await tx.banner.deleteMany();
      } else {
        await tx.banner.deleteMany({
          where: { id: { notIn: incomingIds } },
        });
      }

      // Upsert each banner; position follows array index
      for (const [i, b] of banners.entries()) {
        const existingId = b.id && currentIds.has(b.id) ? b.id : undefined;
        const data = {
          imageUrl: b.image_url,
          altText: b.alt_text ?? null,
          linkUrl: b.link_url || null,
          isActive: b.is_active,
          position: i,
        };
        if (existingId) {
          await tx.banner.update({ where: { id: existingId }, data });
        } else {
          await tx.banner.create({ data });
        }
      }

      // 3. Read fresh state inside the same transaction
      const [freshSettings, freshBanners] = await Promise.all([
        tx.storefrontSettings.findUnique({ where: { id: 1 } }),
        tx.banner.findMany({ orderBy: { position: "asc" } }),
      ]);

      if (!freshSettings) {
        throw new Error("Storefront settings missing after upsert");
      }
      return { settings: freshSettings, banners: freshBanners };
    });

    return res.json({
      success: true,
      data: toApiShape(result.settings, result.banners),
    });
  } catch (error) {
    console.error("Error updating storefront settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
