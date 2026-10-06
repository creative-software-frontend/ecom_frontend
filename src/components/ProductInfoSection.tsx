import { useEffect, useState, type FormEvent } from "react"
import {
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Check,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Wallet,
} from "lucide-react"
import type { Product, ProductTheme } from "@/types/product"

interface ProductInfoSectionProps {
  product: Product
  styles: ProductTheme
}

type OrderOption = {
  id?: string
  label?: string
  value?: string
  delivery_charge?: number
}

type OrderField = {
  name?: string
  label?: string
  type?: string
  required?: boolean
  placeholder?: string
  default?: string | number
  min?: number
  options?: OrderOption[]
}

const formatPrice = (amount: number) => `৳ ${amount.toLocaleString("bn-BD")}`

const ProductInfoSection = ({ product, styles }: ProductInfoSectionProps) => {
  const orderForm = product.order_form as Record<string, unknown>
  const shouldRenderOrderDetails = orderForm.enabled === true
  const formFields = Array.isArray(orderForm.fields)
    ? (orderForm.fields as OrderField[])
    : []
  const deliveryField = formFields.find(
    (field) => field.name === "delivery_area"
  )
  const deliveryOptions = deliveryField?.options ?? []
  const firstDeliveryOption = deliveryOptions[0]
  const firstDeliveryValue =
    firstDeliveryOption?.id ??
    firstDeliveryOption?.value ??
    firstDeliveryOption?.label ??
    ""
  const [quantity, setQuantity] = useState(
    Math.max(
      1,
      Number(formFields.find((field) => field.name === "quantity")?.default) ||
        1
    )
  )
  const [selectedDelivery, setSelectedDelivery] = useState(
    String(firstDeliveryValue)
  )
  const [showBackToTop, setShowBackToTop] = useState(false)

  const sectionBg = styles.sectionBg ?? "bg-[#120910]"
  const accentBg = styles.primaryBgColor ?? "bg-yellow-500"
  const accentText = styles.primaryTextColor ?? "text-yellow-400"
  const phoneUrl =
    typeof product.cta.call_url === "string"
      ? product.cta.call_url
      : "tel:01780212230"
  const whatsappUrl = product.cta.whatsapp_url
  const deliveryCharge =
    deliveryOptions.find((option) => {
      const optionValue = option.id ?? option.value ?? option.label ?? ""
      return String(optionValue) === selectedDelivery
    })?.delivery_charge ?? 0
  const selectedDeliveryLabel =
    deliveryOptions.find((option) => {
      const optionValue = option.id ?? option.value ?? option.label ?? ""
      return String(optionValue) === selectedDelivery
    })?.label ?? ""
  const total = product.price.current * quantity + deliveryCharge
  const paymentMethod = String(orderForm.payment_method ?? "ক্যাশ অন ডেলিভারি")
  const paymentNote = String(
    orderForm.payment_note ?? "পণ্য হাতে পেয়ে টাকা পরিশোধ করুন"
  )
  const submitLabel = String(orderForm.submit_label ?? "অর্ডার নিশ্চিত করুন")
  const productFooterBadges = (
    product as Product & { badges_footer?: string[] }
  ).badges_footer
  const footerBadges = Array.isArray(productFooterBadges)
    ? productFooterBadges
    : ["SECURED", "ORIGINAL", "CASH ON DELIVERY", "24/7 SUPPORT"]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const lines = [
      `অর্ডার: ${product.brand_name}`,
      `নাম: ${String(formData.get("name") ?? "")}`,
      `মোবাইল: ${String(formData.get("phone") ?? "")}`,
      `ঠিকানা: ${String(formData.get("address") ?? "")}`,
      `ডেলিভারি এলাকা: ${selectedDeliveryLabel}`,
      `পরিমাণ: ${quantity}`,
      `মোট মূল্য: ${formatPrice(total)}`,
      `পেমেন্ট: ${paymentMethod}`,
      `অতিরিক্ত তথ্য: ${String(formData.get("notes") ?? "")}`,
    ]
    const orderUrl = new URL(whatsappUrl)
    orderUrl.searchParams.set("text", lines.join("\n"))
    window.open(orderUrl.toString(), "_blank", "noopener,noreferrer")
  }

  const scrollToOrder = () => {
    const orderSection = document.getElementById("order")
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: "smooth" })
      return
    }

    const orderUrl = new URL(whatsappUrl)
    orderUrl.searchParams.set(
      "text",
      `আমি ${product.brand_name} অর্ডার করতে চাই। মূল্য: ${formatPrice(product.price.current)}`
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
      {shouldRenderOrderDetails && (
        <>
          <section className={`${sectionBg} px-4 py-16 text-white md:py-20`}>
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black md:text-4xl">
                  অরিজিনালিটি ও গোপনীয়তা
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm text-white/65 md:text-base">
                  আসল পণ্য এবং আপনার ব্যক্তিগত তথ্যের গোপনীয়তা নিশ্চিত করুন
                </p>
                <div className="mx-auto mt-6 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full w-1/2 rounded-full ${accentBg}`} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {(product.trust ?? []).map((item, index) => (
                  <article
                    key={`${item.title}-${index}`}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/4 p-6"
                  >
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-xl ${accentText}`}
                    >
                      {item.icon ?? <ShieldCheck className="size-5" />}
                    </span>
                    <div>
                      <p className={`mb-2 text-lg font-bold ${accentText}`}>
                        {item.title}
                      </p>
                      <p className="text-sm leading-relaxed text-white/65">
                        {item.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <footer
            className={`${sectionBg} px-4 pt-4 pb-28 text-center text-xs text-white/45`}
          >
            © Power Zenox — সকল অধিকার সংরক্ষিত
          </footer>
        </>
      )}

      <nav
        aria-label="দ্রুত যোগাযোগ"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#160b13]/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_1fr_1.4fr] gap-2">
          <a
            href={phoneUrl}
            className="flex min-h-12 flex-col items-center justify-center rounded-lg border border-white/10 text-[11px] font-semibold text-amber-300"
          >
            <Phone className="size-4" /> কল
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 flex-col items-center justify-center rounded-lg border border-white/10 text-[11px] font-semibold text-emerald-400"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <button
            onClick={scrollToOrder}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg text-sm font-black text-slate-950 ${accentBg}`}
          >
            <ShoppingCart className="size-4" /> অর্ডার করুন
          </button>
        </div>
      </nav>

      {showBackToTop && (
        <button
          type="button"
          aria-label="উপরে ফিরে যান"
          onClick={scrollToTop}
          className="fixed right-4 bottom-20 z-50 flex size-11 items-center justify-center rounded-full border border-white/20 bg-red-600 text-white shadow-lg transition hover:bg-red-500"
        >
          <ArrowUp className="size-5" />
        </button>
      )}
    </>
  )
}

export default ProductInfoSection
