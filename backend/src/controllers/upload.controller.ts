import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import sharp from "sharp";
import { logAudit } from "../lib/auditLog.js";

const UPLOAD_FOLDERS = ["products", "brands", "banners", "logos"] as const;
type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

function isUploadFolder(value: unknown): value is UploadFolder {
  return typeof value === "string" && UPLOAD_FOLDERS.includes(value as UploadFolder);
}

/** `folder` may arrive as a query param or in the multipart body. */
function readFolder(req: Request): unknown {
  if (req.query.folder !== undefined) return req.query.folder;
  const body = req.body as Record<string, unknown> | undefined;
  return body?.folder;
}

export async function uploadImage(req: Request, res: Response) {
  const rawFolder = readFolder(req);
  const folder = rawFolder === undefined ? "products" : rawFolder;
  if (!isUploadFolder(folder)) {
    return res.status(422).json({
      success: false,
      message: "Invalid upload folder.",
    });
  }

  const buffer = req.file?.buffer;
  if (!buffer) {
    return res.status(422).json({
      success: false,
      message: "Select an image file to upload.",
    });
  }

  let outputBuffer: Buffer;
  try {
    const metadata = await sharp(buffer).metadata();
    if (
      typeof metadata.width !== "number" ||
      typeof metadata.height !== "number" ||
      metadata.width <= 0 ||
      metadata.height <= 0
    ) {
      throw new Error("Image has no usable dimensions.");
    }

    outputBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return res.status(422).json({
      success: false,
      message: "Invalid or corrupted image file.",
    });
  }

  const filename = `${randomUUID()}.webp`;
  const directory = path.resolve(process.cwd(), "uploads", folder);
  const url = `/uploads/${folder}/${filename}`;

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), outputBuffer);
  } catch (error) {
    console.error("[upload-image] failed to write file:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not save the uploaded image." });
  }

  void logAudit({
    req,
    action: "upload.image",
    entityType: "upload",
    entityId: filename,
    targetShopId: req.user?.shopId ?? null,
    metadata: { folder, url },
  });

  return res.status(201).json({
    success: true,
    data: { url, folder, size: outputBuffer.length },
  });
}
