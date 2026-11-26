export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const IMAGE_ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",")

/** Client-side check before upload — the backend validates the bytes again. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP image."
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be 5 MB or smaller."
  }
  return null
}
