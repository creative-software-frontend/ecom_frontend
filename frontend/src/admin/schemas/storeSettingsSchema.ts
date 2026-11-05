import { z } from "zod"

const bdPhoneRegex = /^01[3-9]\d{8}$/
const urlOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\//.test(v), {
    message: "Enter a valid URL starting with http:// or https://",
  })

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Store name is required"),
  tagline: z.string().trim().min(1, "Slogan is required"),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or less")
    .default(""),
  logo: z.string().nullable().default(null),
  contact: z.object({
    phone: z
      .string()
      .trim()
      .regex(
        bdPhoneRegex,
        "Enter a valid mobile number, for example 01712345678"
      ),
    phone_2: z
      .string()
      .trim()
      .refine((v) => v === "" || bdPhoneRegex.test(v), {
        message: "Enter a valid mobile number",
      }),
    whatsapp: z
      .string()
      .trim()
      .regex(bdPhoneRegex, "Enter a valid mobile number"),
    whatsapp_2: z
      .string()
      .trim()
      .refine((v) => v === "" || bdPhoneRegex.test(v), {
        message: "Enter a valid mobile number",
      }),
    email: z.string().trim().email("Enter a valid email address"),
    address: z.string().trim().min(1, "Address is required"),
    google_maps_url: urlOrEmpty,
  }),
  social: z.object({
    facebook: urlOrEmpty,
    instagram: urlOrEmpty,
    youtube: urlOrEmpty,
    tiktok: urlOrEmpty,
  }),
})

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>
