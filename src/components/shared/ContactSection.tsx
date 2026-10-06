import { ArrowRight, MessageCircle, Phone } from "lucide-react"
import type { ProductTheme } from "@/types/product"

const contact = {
  phone: "01780212230",
  whatsapp: "01780212230",
}

const phoneUrl = `tel:${contact.phone}`
const whatsappUrl = `https://wa.me/88${contact.whatsapp}`

const ContactSection = ({
  styles,
  theme,
  title,
}: {
  styles: Pick<ProductTheme, "sectionBg">
  theme?: ProductTheme
  title: string
}) => {
  const isLightTheme = theme?.appearance === "light"
  const accentBg = theme?.primaryBgColor ?? "bg-[#d4af37]"
  const accentText = theme?.primaryTextColor ?? "text-[#d4af37]"

  return (
    <section
      className={`${styles.sectionBg} px-4 pt-4 pb-12 ${isLightTheme ? "text-[#171717]" : "text-white"}`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p
            className={`mt-3 text-lg ${isLightTheme ? "text-gray-600" : "text-white/65"}`}
          >
            যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন
          </p>
          <div
            className={`mx-auto mt-6 h-1.5 w-24 overflow-hidden rounded-full ${isLightTheme ? "bg-red-100" : "bg-white/10"}`}
          >
            <div className={`h-full w-1/2 rounded-full ${accentBg}`} />
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          <a
            href={phoneUrl}
            className={`group flex flex-col items-center rounded-3xl border p-6 transition ${isLightTheme ? "border-gray-200 bg-white hover:border-red-200" : "border-white/10 bg-white/4 hover:border-white/20"}`}
          >
            <span
              className={`flex size-18 items-center justify-center rounded-full ${isLightTheme ? "bg-red-50 text-red-600" : "bg-white/6 text-amber-300"}`}
            >
              <Phone className="size-8" />
            </span>
            <h3 className="mt-5 text-xl font-bold">সরাসরি কল করুন</h3>
            <p className={`mt-2 text-xl font-black ${accentText}`}>
              {phoneUrl.replace("tel:", "")}
            </p>
            <span
              className={`mt-6 inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-sm font-bold ${isLightTheme ? "text-white" : (theme?.textColor ?? "text-slate-950")} ${accentBg}`}
            >
              Call Now <ArrowRight className="size-4" />
            </span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={`group flex flex-col items-center rounded-3xl border p-6 transition ${isLightTheme ? "border-gray-200 bg-white hover:border-red-200" : "border-white/10 bg-white/4 hover:border-white/20"}`}
          >
            <span className="flex size-18 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
              <MessageCircle className="size-8" />
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
  )
}
export default ContactSection
