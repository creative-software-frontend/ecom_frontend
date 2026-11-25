import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "./prisma.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export async function generateShopSlug(name: string): Promise<string> {
  const base = slugify(name);

  if (!base) {
    for (let i = 0; i < 5; i++) {
      const slug = `shop-${Math.random().toString(36).substring(2, 8)}`;
      const exists = await prisma.shop.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) return slug;
    }
    throw new Error("Could not generate unique slug after 5 attempts");
  }

  const baseExists = await prisma.shop.findUnique({
    where: { slug: base },
    select: { slug: true },
  });
  if (!baseExists) return base;

  for (let suffix = 1; ; suffix++) {
    const suffixText = `-${suffix}`;
    const candidate = `${base.slice(0, 60 - suffixText.length)}${suffixText}`;
    const exists = await prisma.shop.findUnique({
      where: { slug: candidate },
      select: { slug: true },
    });
    if (!exists) return candidate;
  }
}

export function isShopSlugUniqueConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.some((field) => String(field).includes("slug"))
    : typeof target === "string" && target.includes("slug");
}
