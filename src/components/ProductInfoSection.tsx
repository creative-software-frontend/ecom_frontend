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
import type { ProductPageTheme } from "@/pages/Products/ProductPage"
import type { Product } from "@/types/product"

interface ProductInfoSectionProps {
  product: Product
  styles: ProductPageTheme
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

          <section
            id="order"
            className={`${sectionBg} scroll-mt-6 px-4 pb-20 text-white md:pb-24`}
          >
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/20 sm:p-8 md:p-10">
              <div className="mb-8 text-center">
                <div
                  className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${accentBg} text-slate-950`}
                >
                  <ShoppingCart className="size-5" />
                </div>
                <h2 className="text-2xl font-black sm:text-3xl">
                  {String(
                    orderForm.heading ??
                      `আজই আপনার ${product.brand_name} অর্ডার করুন`
                  )}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                  {String(
                    orderForm.description ??
                      "নিচের ফর্মটি সঠিক তথ্য দিয়ে পূরণ করুন, আমরা দ্রুত আপনার সাথে যোগাযোগ করব।"
                  )}
                </p>
              </div>

              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
                  <span className="text-sm text-white/65">পণ্যের মূল্য</span>
                  <strong className={`font-bold ${accentText}`}>
                    {formatPrice(product.price.current)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-white/65">
                    <Wallet className="size-4" /> পেমেন্ট পদ্ধতি
                  </span>
                  <strong className="text-sm font-semibold">
                    {paymentMethod}
                  </strong>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {formFields
                    .filter(
                      (field) => field.name === "name" || field.name === "phone"
                    )
                    .map((field) => (
                      <label
                        key={field.name}
                        className="block text-sm font-semibold text-white/85"
                      >
                        {field.label}
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type ?? "text"}
                          required={field.required}
                          placeholder={field.placeholder}
                          className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-black/20 px-4 text-base text-white outline-none placeholder:text-white/35 focus:border-white/40"
                        />
                      </label>
                    ))}
                </div>

                {formFields
                  .filter((field) => field.name === "address")
                  .map((field) => (
                    <label
                      key={field.name}
                      className="block text-sm font-semibold text-white/85"
                    >
                      {field.label}
                      <textarea
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={3}
                        className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/35 focus:border-white/40"
                      />
                    </label>
                  ))}

                <div className="grid gap-4 sm:grid-cols-2">
                  {deliveryField && (
                    <label className="block text-sm font-semibold text-white/85">
                      {deliveryField.label}
                      <select
                        name={deliveryField.name}
                        required={deliveryField.required}
                        value={selectedDelivery}
                        onChange={(event) =>
                          setSelectedDelivery(event.target.value)
                        }
                        className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#1a1018] px-4 text-base text-white outline-none focus:border-white/40"
                      >
                        {deliveryOptions.map((option, index) => {
                          const value = String(
                            option.id ?? option.value ?? option.label ?? index
                          )
                          const charge = option.delivery_charge ?? 0
                          return (
                            <option key={value} value={value}>
                              {option.label} — {formatPrice(charge)}
                            </option>
                          )
                        })}
                      </select>
                    </label>
                  )}

                  <div>
                    <span className="block text-sm font-semibold text-white/85">
                      {formFields.find((field) => field.name === "quantity")
                        ?.label ?? "পরিমাণ"}
                    </span>
                    <div className="mt-2 flex min-h-12 items-center justify-between rounded-lg border border-white/15 bg-black/20 px-2">
                      <button
                        type="button"
                        aria-label="পরিমাণ কমান"
                        disabled={quantity <= 1}
                        onClick={() =>
                          setQuantity((current) => Math.max(1, current - 1))
                        }
                        className="flex size-9 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10 disabled:opacity-35"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span aria-live="polite" className="font-bold">
                        {quantity.toLocaleString("bn-BD")}
                      </span>
                      <button
                        type="button"
                        aria-label="পরিমাণ বাড়ান"
                        onClick={() => setQuantity((current) => current + 1)}
                        className="flex size-9 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {formFields
                  .filter((field) => field.name === "notes")
                  .map((field) => (
                    <label
                      key={field.name}
                      className="block text-sm font-semibold text-white/85"
                    >
                      {field.label}
                      <textarea
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        placeholder="কোনো নির্দেশনা থাকলে লিখুন"
                        rows={2}
                        className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/35 focus:border-white/40"
                      />
                    </label>
                  ))}

                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-2">
                  <div className="flex justify-between gap-4 border-b border-white/10 py-3 text-sm text-white/65">
                    <span>পণ্যের মূল্য</span>
                    <span>{formatPrice(product.price.current * quantity)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/10 py-3 text-sm text-white/65">
                    <span>ডেলিভারি চার্জ</span>
                    <span>{formatPrice(deliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between gap-4 py-3 font-bold text-white">
                    <span>মোট মূল্য</span>
                    <span className={accentText}>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-lg px-6 text-base font-black text-slate-950 transition hover:brightness-105 ${accentBg}`}
                >
                  {submitLabel}
                  <ArrowRight className="size-5" />
                </button>

                <p className="flex items-center justify-center gap-2 text-center text-sm text-white/65">
                  <Check className={`size-4 ${accentText}`} />
                  {paymentNote}
                </p>
              </form>

              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 text-center sm:grid-cols-4">
                {footerBadges.map((badge) => (
                  <div
                    key={badge}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-white/4 px-2 text-[11px] font-bold text-white/60 uppercase"
                  >
                    <BadgeCheck className={`size-4 shrink-0 ${accentText}`} />
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`${sectionBg} px-4 pt-4 pb-12 text-white`}>
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black">যোগাযোগ</h2>
                <p className="mt-3 text-white/65">
                  যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন
                </p>
                <div className="mx-auto mt-6 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full w-1/2 rounded-full ${accentBg}`} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <a
                  href={phoneUrl}
                  className="group rounded-2xl border border-white/10 bg-white/4 p-6 transition hover:border-white/20"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/6 text-amber-300">
                    <Phone className="size-7" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">সরাসরি কল করুন</h3>
                  <p className={`mt-2 text-xl font-black ${accentText}`}>
                    {phoneUrl.replace("tel:", "")}
                  </p>
                  <span
                    className={`mt-6 inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-sm font-bold text-slate-950 ${accentBg}`}
                  >
                    Call Now <ArrowRight className="size-4" />
                  </span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/4 p-6 transition hover:border-white/20"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                    <MessageCircle className="size-7" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">WhatsApp করুন</h3>
                  <p className="mt-2 text-xl font-black text-emerald-400">
                    {phoneUrl.replace("tel:", "")}
                  </p>
                  <span className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-bold text-white">
                    Message Now <ArrowRight className="size-4" />
                  </span>
                </a>
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
