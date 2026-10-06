import {
  ArrowRight,
  BadgeCheck,
  Phone,
  ShoppingCart,
  Truck,
  Zap,
} from "lucide-react"
import type { ProductPreviewSectionProps } from "./shared/ProductDetails"
import { Button } from "./ui/button"

const ProductPreviewSection = ({
  product,
  styles,
}: ProductPreviewSectionProps) => {
  const handleOrderClick = () => {
    const orderSection = document.getElementById("order")
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: "smooth" })
      return
    }

    if (typeof product?.cta.whatsapp_url !== "string") return

    const orderUrl = new URL(product.cta.whatsapp_url)
    orderUrl.searchParams.set(
      "text",
      `আমি ${product.brand_name} অর্ডার করতে চাই। মূল্য: ৳ ${product.price.current.toLocaleString("bn-BD")}`
    )
    window.open(orderUrl.toString(), "_blank", "noopener,noreferrer")
  }

  return (
    <section
      className={`relative overflow-hidden py-12 md:py-16 ${styles?.bg || "bg-[#1a0b15]"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.10),transparent_25%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 lg:grid-cols-2 lg:gap-12">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <img
              src={product?.images[0]}
              alt={product?.name || "product"}
              className="w-full object-cover"
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3 pb-2">
            {product?.images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                className="size-22 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-1 ring-1 ring-white/10 transition outline-none hover:ring-white/30"
              >
                <img
                  src={image}
                  className="h-full w-full rounded-xl object-cover"
                  alt={`${product?.name || "product"} preview ${index + 1}`}
                />
              </button>
            ))}
          </div>

          <ul className="mt-8 flex gap-4">
            {product?.specs.map((spec, i) => (
              <li
                key={`${spec.label}-${i}`}
                className={`items-center gap-3 px-3 py-2 text-sm ${styles?.textColor || "text-white"}`}
              >
                <span
                  className={`flex size-7 items-center justify-center text-base font-bold ${styles?.primaryTextColor || "text-yellow-400"}`}
                >
                  0{i + 1}
                </span>
                <span className="opacity-90">{spec.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-w-0">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black tracking-[0.12em] uppercase ring-1 ${styles?.badgeBgColor} ${styles?.primaryTextColor} ${styles?.badgeOutlineColor}`}
          >
            <Zap fill="currentColor" strokeWidth={0} className={`size-4`} />
            {product?.badge}
          </div>

          <h1
            className={`mt-6 text-3xl leading-tight font-black sm:text-4xl lg:text-5xl ${styles?.textColor || "text-white"}`}
          >
            {product?.tagline}
          </h1>

          <p
            className={`mt-4 text-lg leading-relaxed opacity-80 ${styles?.textColor || "text-white"}`}
          >
            {product?.short_description}
          </p>

          <div
            className={`mt-6 flex flex-wrap gap-3 ${styles?.textColor || "text-white"}`}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium">
              <BadgeCheck className="size-6" color="green" />
              ১০০% অরিজিনাল
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium">
              <Truck
                className={`size-6 ${styles?.primaryTextColor || "text-yellow-400"} `}
              />
              সারা দেশে হোম ডেলিভারি
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="mt-8 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`text-3xl font-black sm:text-4xl ${styles?.primaryTextColor || "text-yellow-400"}`}
                >
                  ৳ {product?.price.current.toLocaleString("bn-BD")}
                </span>
                <span className="text-lg text-white/60 line-through">
                  ৳ {product?.price.regular.toLocaleString("bn-BD")}
                </span>
              </div>
              <p className="mt-3 text-base text-white/70">
                সারা বাংলাদেশ ক্যাশ অন ডেলিভারি
              </p>
            </div>

            <div className="mt-8 flex w-full min-w-0 flex-col gap-4 sm:w-auto">
              <Button
                variant="link"
                className={`w-full rounded-full px-8 py-6 text-lg font-black sm:w-58 ${styles?.primaryBgColor || "bg-yellow-500"} text-slate-900 transition-none hover:no-underline`}
                size="lg"
                onClick={handleOrderClick}
              >
                <ShoppingCart className="size-5" />
                অর্ডার করুন
                <ArrowRight className="size-5" />
              </Button>

              <a
                href={
                  typeof product?.cta.call_url === "string"
                    ? product.cta.call_url
                    : "tel:01780212230"
                }
              >
                <Button
                  variant="outline"
                  className="w-full cursor-pointer rounded-full border-white/20 bg-white/5 px-8 py-6 text-lg font-black text-white hover:bg-white/10 hover:text-white"
                >
                  <Phone className="size-5" />
                  কল করুন
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default ProductPreviewSection
