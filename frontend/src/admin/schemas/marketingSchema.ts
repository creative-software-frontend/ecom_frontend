import { z } from "zod"

// Pixel IDs are free-form here — real format validation lives in the backend.
// The form only guards against accidental absurdity (empty / too long).
export const marketingSchema = z.object({
  facebook: z.object({
    enabled: z.boolean(),
    pixel_id: z.string().trim().max(30, "Pixel ID is too long"),
    test_event_code: z.string().trim().max(30, "Test event code is too long"),
    // Input for a *new* token. Empty string means "keep the existing one".
    token_input: z.string().trim(),
  }),
  tiktok: z.object({
    enabled: z.boolean(),
    pixel_id: z.string().trim().max(30, "Pixel ID is too long"),
    token_input: z.string().trim(),
  }),
})

export type MarketingFormValues = z.infer<typeof marketingSchema>

// Default form values — token_input always starts empty (server never sends
// real tokens). The `_saved` flags live outside the form as read-only state.
export const defaultMarketingValues: MarketingFormValues = {
  facebook: {
    enabled: true,
    pixel_id: "849201948201940",
    test_event_code: "TEST84920",
    token_input: "",
  },
  tiktok: {
    enabled: true,
    pixel_id: "CTR9824X82901P",
    token_input: "",
  },
}
