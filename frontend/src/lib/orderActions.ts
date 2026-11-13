import type { Product } from "@/types/product"
import { formatBdt } from "./formatPrice"

type OrderProduct = Pick<Product, "brand_name" | "price" | "cta">

/** Scrolls to the on-page order form. Returns false when it is not rendered. */
export function scrollToOrderSection(): boolean {
  const section = document.getElementById("order")
  if (!section) return false
  section.scrollIntoView({ behavior: "smooth" })
  return true
}

/** Builds the pre-filled WhatsApp order URL for a product. */
export function buildWhatsAppOrderUrl(product: OrderProduct): string | null {
  if (typeof product.cta?.whatsapp_url !== "string") return null

  const url = new URL(product.cta.whatsapp_url)
  url.searchParams.set(
    "text",
    `আমি ${product.brand_name} অর্ডার করতে চাই। মূল্য: ${formatBdt(product.price.current)}`
  )
  return url.toString()
}

/**
 * Shared "Order now" action: scroll to the order form when present,
 * otherwise open a pre-filled WhatsApp chat.
 */
export function goToOrder(product: OrderProduct): void {
  if (scrollToOrderSection()) return

  const url = buildWhatsAppOrderUrl(product)
  if (url) window.open(url, "_blank", "noopener,noreferrer")
}
