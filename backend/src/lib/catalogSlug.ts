/**
 * Server-side slug generation for shop-scoped catalog terms.
 * Never derived from a client-supplied slug. Names without latin
 * characters (e.g. Bengali-only names) get a deterministic-length
 * random fallback, matching the existing shop/product slug pattern.
 */
export function buildCatalogSlug(
  name: string,
  kind: "brand" | "category",
): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);

  if (base) return base;

  return `${kind}-${Math.random().toString(36).substring(2, 8)}`;
}
