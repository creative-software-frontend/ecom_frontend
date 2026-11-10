import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color like #0D9488");

const urlOptional = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => !v || /^https?:\/\//.test(v),
    "Must start with http:// or https://",
  )
  .optional();

// Individual banner — reused by the save-all payload.
const bannerInputSchema = z.object({
  // New banners have a temporary string ID; saved banners have a numeric ID.
  id: z.union([z.number().int().positive(), z.string()]).optional(),
  image_url: z.string().trim().max(500).default(""),
  alt_text: z.string().trim().max(200).optional(),
  link_url: urlOptional,
  is_active: z.boolean(),
});

export const storefrontSaveSchema = z.object({
  announcement: z.object({
    enabled: z.boolean(),
    marquee_text: z
      .string()
      .trim()
      .max(200, "Marquee text must be 200 characters or less"),
    order_note: z
      .string()
      .trim()
      .max(160, "Order note must be 160 characters or less"),
  }),
  banners: z.array(bannerInputSchema).max(10, "You can have up to 10 banners"),
  brand_colors: z.object({
    primary: hexColor,
    background: hexColor,
  }),
});

export type StorefrontSaveInput = z.infer<typeof storefrontSaveSchema>;
