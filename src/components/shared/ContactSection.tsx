import { motion } from "motion/react"
import { ArrowRight, MessageCircle, Phone } from "lucide-react"
import type { ProductTheme } from "@/types/product"
import { containerVariants, itemVariants } from "@/lib/motionVariants"

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
  borderColorVar,
}: {
  styles: Pick<ProductTheme, "sectionBg">
  theme?: ProductTheme
  title: string
  borderColorVar?: string
}) => {
  const isLightTheme = theme?.appearance === "light"
  const accentBg = theme?.primaryBgColor ?? "bg-[#d4af37]"
  const accentText = theme?.primaryTextColor ?? "text-[#d4af37]"
  const hoverAccentCall = {
    "--hover-border-color": borderColorVar
      ? `color-mix(in srgb, ${borderColorVar} 30%, transparent) `
      : "#aaaaaa51",
    "--hover-shadow-color": borderColorVar
      ? `color-mix(in srgb,${borderColorVar} 15%, transparent`
      : "#aaaaaa51",
  } as React.CSSProperties

  return (
    <section
      className={`${styles.sectionBg} px-4 pt-4 pb-12 ${isLightTheme ? "text-[#171717]" : "text-white"}`}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-8 text-center">
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-black sm:text-4xl md:text-5xl"
          >
            {title}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className={`mt-3 text-lg ${isLightTheme ? "text-gray-600" : "text-white/65"}`}
          >
            যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন
          </motion.p>
          <div
            className={`mx-auto mt-6 h-1.5 w-24 overflow-hidden rounded-full ${isLightTheme ? "bg-red-100" : "bg-white/10"}`}
          >
            <div className={`h-full w-1/2 rounded-full ${accentBg}`} />
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {/* Phone Contact */}
          <motion.a
            style={hoverAccentCall}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            variants={itemVariants}
            href={phoneUrl}
            className={`group flex flex-col items-center rounded-3xl border-2 p-6 transition-colors hover:border-(--hover-border-color) hover:shadow-[0_0_30px_var(--hover-shadow-color)] ${isLightTheme ? "border-gray-200 bg-white" : "border-white/10 bg-white/4"}`}
          >
            <span
              className={`flex size-18 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${isLightTheme ? "bg-red-50 text-red-600" : "bg-white/6 text-amber-300"}`}
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
          </motion.a>
          {/* WhatsApp Contact */}
          <motion.a
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            variants={itemVariants}
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={`group flex flex-col items-center rounded-3xl border-2 p-6 transition-colors hover:border-emerald-400/30 hover:shadow-[0_0_30px_rgba(0,188,125,0.15)] ${isLightTheme ? "border-gray-200 bg-white" : "border-white/10 bg-white/4"}`}
          >
            <span className="flex size-18 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400 transition-all duration-300 group-hover:scale-110">
              <MessageCircle className="size-8" />
            </span>
            <h3 className="mt-5 text-xl font-bold">WhatsApp করুন</h3>
            <p className="mt-2 text-xl font-black text-emerald-400">
              {whatsappUrl.replace("https://wa.me/", "")}
            </p>
            <span className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-400 px-5 text-sm font-bold text-white">
              Message Now <ArrowRight className="size-4" />
            </span>
          </motion.a>
        </div>
      </motion.div>
    </section>
  )
}
export default ContactSection
