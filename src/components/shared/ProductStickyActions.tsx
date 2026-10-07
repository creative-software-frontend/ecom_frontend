import { motion } from "motion/react"

import { useEffect, useState } from "react"
import { ChevronUp, MessageCircle, Phone, ShoppingCart } from "lucide-react"
import type { Product, ProductTheme } from "@/types/product"
import { Button } from "../ui/button"

type ProductStickyActionsProps = {
  product: Product
  theme: ProductTheme
}

const ProductStickyActions = ({
  product,
  theme,
}: ProductStickyActionsProps) => {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const isLightTheme = theme.appearance === "light"
  const phoneUrl =
    typeof product.cta.call_url === "string"
      ? product.cta.call_url
      : "tel:01780212230"
  const whatsappUrl = product.cta.whatsapp_url
  const accentBg = theme.primaryBgColor ?? "bg-yellow-500"
  const actionText = isLightTheme ? "text-white" : "text-slate-950"

  const scrollToOrder = () => {
    const orderSection = document.getElementById("order")
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: "smooth" })
      return
    }

    const orderUrl = new URL(whatsappUrl)
    orderUrl.searchParams.set(
      "text",
      `আমি ${product.brand_name} অর্ডার করতে চাই। মূল্য: ৳ ${product.price.current.toLocaleString("bn-BD")}`
    )
    window.open(orderUrl.toString(), "_blank", "noopener,noreferrer")
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", updateBackToTopVisibility, {
      passive: true,
    })
    updateBackToTopVisibility()
    return () => window.removeEventListener("scroll", updateBackToTopVisibility)
  }, [])

  return (
    <>
      <nav
        aria-label="দ্রুত যোগাযোগ"
        className={`fixed inset-x-0 bottom-0 z-40 border-t px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur ${isLightTheme ? "border-gray-200 bg-white/95" : "border-white/10 bg-[#160b13]/95"}`}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_1fr_1.4fr] gap-2">
          <a
            href={phoneUrl}
            className={`flex min-h-12 flex-col items-center justify-center rounded-lg border text-[11px] font-semibold ${isLightTheme ? "border-gray-200 text-gray-800" : "border-white/10 text-amber-300"}`}
          >
            <Phone className="size-4" /> কল
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex min-h-12 flex-col items-center justify-center rounded-lg border text-[11px] font-semibold ${isLightTheme ? "border-gray-200 text-emerald-600" : "border-white/10 text-emerald-400"}`}
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <button
            type="button"
            onClick={scrollToOrder}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg text-sm font-black ${actionText} ${accentBg}`}
          >
            <ShoppingCart className="size-4" /> অর্ডার করুন
          </button>
        </div>
      </nav>

      {showBackToTop && (
        <motion.div
          whileHover={{ scale: 1.09 }}
          whileTap={{ scale: 0.95 }}
          className="fixed right-4 bottom-20 z-50"
        >
          <Button
            aria-label="উপরে ফিরে যান"
            onClick={scrollToTop}
            className="flex size-12 items-center justify-center rounded-full border border-red-700/20 bg-red-600/90 backdrop-blur-xl hover:bg-red-600"
          >
            <ChevronUp className="size-6" />
          </Button>
        </motion.div>
      )}
    </>
  )
}

export default ProductStickyActions
