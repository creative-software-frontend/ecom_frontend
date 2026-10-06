import { ArrowRight, ShoppingCart, Timer, Zap } from "lucide-react"
import type { Product } from "@/types/product"
import { Button } from "@/components/ui/button"

const ProductPromoSection = ({ product }: { product: Product }) => {
  const promo = product.promo
  if (!promo) return null

  const orderNow = () => {
    const orderSection = document.getElementById("order")
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: "smooth" })
      return
    }

    const orderUrl = new URL(product.cta.whatsapp_url)
    orderUrl.searchParams.set(
      "text",
      `আমি ${product.brand_name} অর্ডার করতে চাই। মূল্য: ৳ ${product.price.current.toLocaleString("bn-BD")}`
    )
    window.open(orderUrl.toString(), "_blank", "noopener,noreferrer")
  }

  return (
    <section className="bg-[#100b08] px-4 py-12 text-white sm:py-14">
      <div className="mx-auto max-w-md rounded-3xl border border-[#d9b45f]/35 bg-[#17110c] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:p-8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#d9b45f]/15 text-[#d9b45f]">
          <Zap className="size-5" fill="currentColor" />
        </span>
        <h2 className="mt-4 text-2xl leading-tight font-black sm:text-3xl">
          🚨 {promo.heading}
        </h2>

        <div className="mt-6 grid grid-cols-2 items-end gap-4">
          <div>
            <p className="text-xs text-white/55">{promo.regular_price_label}</p>
            <p className="mt-1 text-lg font-semibold text-white/45 line-through">
              ৳ {product.price.regular.toLocaleString("bn-BD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/65">{promo.offer_price_label}</p>
            <p className="mt-1 text-2xl font-black text-[#d9b45f]">
              ৳ {promo.offer_price.toLocaleString("bn-BD")}
            </p>
          </div>
        </div>

        <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70">
          <Timer className="size-3.5 text-[#d9b45f]" />
          {promo.urgency.replace(/^⏳\s*/, "")}
        </p>

        <Button
          variant="link"
          size="lg"
          onClick={orderNow}
          className="mt-5 h-12 w-full justify-center gap-2 rounded-xl bg-[#d9b45f] font-bold text-[#20170d] hover:no-underline"
        >
          <ShoppingCart className="size-4" />
          {product.cta.order_label}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}

export default ProductPromoSection
