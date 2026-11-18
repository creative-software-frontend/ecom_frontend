import { prisma } from "./prisma.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export async function generateShopSlug(
  name: string,
): Promise<{ slug: string; conflict: boolean }> {
  const base = slugify(name);

  if (!base) {
    for (let i = 0; i < 5; i++) {
      const slug = `shop-${Math.random().toString(36).substring(2, 8)}`;
      const exists = await prisma.shop.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) return { slug, conflict: false };
    }
    throw new Error("Could not generate unique slug after 5 attempts");
  }

  const exists = await prisma.shop.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  return { slug: base, conflict: Boolean(exists) };
}
