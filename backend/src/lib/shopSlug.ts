<<<<<<< HEAD
=======
import { Prisma } from "../../generated/prisma/client.js";
>>>>>>> 943589b71143456bbd5207a815a53a15c35d7a01
import { prisma } from "./prisma.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

<<<<<<< HEAD
export async function generateShopSlug(
  name: string,
): Promise<{ slug: string; conflict: boolean }> {
=======
export async function generateShopSlug(name: string): Promise<string> {
>>>>>>> 943589b71143456bbd5207a815a53a15c35d7a01
  const base = slugify(name);

  if (!base) {
    for (let i = 0; i < 5; i++) {
      const slug = `shop-${Math.random().toString(36).substring(2, 8)}`;
      const exists = await prisma.shop.findUnique({
        where: { slug },
        select: { id: true },
      });
<<<<<<< HEAD
      if (!exists) return { slug, conflict: false };
=======
      if (!exists) return slug;
>>>>>>> 943589b71143456bbd5207a815a53a15c35d7a01
    }
    throw new Error("Could not generate unique slug after 5 attempts");
  }

<<<<<<< HEAD
  const exists = await prisma.shop.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  return { slug: base, conflict: Boolean(exists) };
=======
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
>>>>>>> 943589b71143456bbd5207a815a53a15c35d7a01
}
