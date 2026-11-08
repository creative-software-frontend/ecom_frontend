import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { storeSettingsV2Schema } from "../schemas/storeSettings.v2.js";

// Transform DB row -> API shape (nested contact/social).
function toApiShape(
  row: Awaited<ReturnType<typeof prisma.storeSettings.findUnique>>,
) {
  if (!row) return null;
  return {
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    logo: row.logo,
    contact: {
      phone: row.phone,
      phone_2: row.phone2 ?? "",
      whatsapp: row.whatsapp,
      whatsapp_2: row.whatsapp2 ?? "",
      email: row.email,
      address: row.address,
      google_maps_url: row.googleMapsUrl ?? "",
    },
    social: {
      facebook: row.facebook ?? "",
      instagram: row.instagram ?? "",
      youtube: row.youtube ?? "",
      tiktok: row.tiktok ?? "",
    },
  };
}

export async function getStoreSettings(_req: Request, res: Response) {
  try {
    const row = await prisma.storeSettings.findUnique({ where: { id: 1 } });
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Store settings not initialized. Run the migration script.",
      });
    }
    return res.json({ success: true, data: toApiShape(row) });
  } catch (error) {
    console.error("Error fetching store settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateStoreSettings(req: Request, res: Response) {
  const parsed = storeSettingsV2Schema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!(key in errors)) errors[key] = issue.message;
    }
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const d = parsed.data;
  try {
    const row = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: {
        name: d.name,
        tagline: d.tagline,
        description: d.description,
        logo: d.logo ?? null,
        phone: d.contact.phone,
        phone2: d.contact.phone_2 || null,
        whatsapp: d.contact.whatsapp,
        whatsapp2: d.contact.whatsapp_2 || null,
        email: d.contact.email,
        address: d.contact.address,
        googleMapsUrl: d.contact.google_maps_url || null,
        facebook: d.social.facebook || null,
        instagram: d.social.instagram || null,
        youtube: d.social.youtube || null,
        tiktok: d.social.tiktok || null,
      },
      create: {
        id: 1,
        name: d.name,
        tagline: d.tagline,
        description: d.description,
        logo: d.logo ?? null,
        phone: d.contact.phone,
        phone2: d.contact.phone_2 || null,
        whatsapp: d.contact.whatsapp,
        whatsapp2: d.contact.whatsapp_2 || null,
        email: d.contact.email,
        address: d.contact.address,
        googleMapsUrl: d.contact.google_maps_url || null,
        facebook: d.social.facebook || null,
        instagram: d.social.instagram || null,
        youtube: d.social.youtube || null,
        tiktok: d.social.tiktok || null,
      },
    });
    return res.json({ success: true, data: toApiShape(row) });
  } catch (error) {
    console.error("Error updating store settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
