import { z } from "zod"

export const bannerSchema = z.object({
  id: z.string(),
  image: z.string().nullable(),
  alt: z.string().trim().default(""),
  link: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//.test(v), {
      message: "Enter a valid URL starting with http:// or https://",
    }),
  active: z.boolean().default(true),
})

export const storefrontSchema = z.object({
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
  banners: z.array(bannerSchema).max(10, "You can add up to 10 banners"),
  brand_colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color"),
    background: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color"),
  }),
})

export type StorefrontFormValues = z.infer<typeof storefrontSchema>
