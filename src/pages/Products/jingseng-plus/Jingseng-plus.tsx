import ProblemSection from "@/ProblemSection"
import ProductPreviewSection from "@/components/ProductPreviewSection"
import ContactSection from "@/components/shared/ContactSection"
import Footer from "@/components/shared/Footer"
import OrderForm from "@/components/shared/OrderForm"
import ProductPromoSection from "@/components/shared/ProductPromoSection"
import ProductStickyActions from "@/components/shared/ProductStickyActions"
import ProductTrustSection from "@/components/shared/ProductTrustSection"
import getProductsById from "@/lib/getProductsById"
import type { Product } from "@/types/product"
import type { CSSProperties } from "react"

const pageColors = {
  "--jingseng-dark": "#0a0908",
  "--jingseng-brown": "#241a12",
  "--jingseng-section": "#140d1b",
  "--jingseng-gold": "#d9b45f",
  "--jingseng-gold-shadow": "rgba(217, 180, 95, 0.3)",
} as CSSProperties

const styles = {
  bg: "bg-gradient-to-br from-[var(--jingseng-dark)] via-[var(--jingseng-brown)] to-[var(--jingseng-dark)]",
  sectionBg: "bg-[var(--jingseng-section)]",
  textColor: "text-white",
  primaryTextColor: "text-[var(--jingseng-gold)]",
  primaryBgColor: "bg-[var(--jingseng-gold)]",
  badgeBgColor: "bg-[var(--jingseng-gold)]/30",
  productImageShadow: "drop-shadow-[0_1px_80px_var(--jingseng-gold-shadow)]",
}
const whyChooseSectionStyles = {
  sectionBg: "bg-[var(--jingseng-dark)]",
}

const JingsengPlus = () => {
  const product: Product | null = getProductsById("jingseng-plus")

  if (!product) return null

  return (
    <main style={pageColors}>
      <ProductPreviewSection product={product} styles={styles} />
      {/* {product.problems?.length ? (
        <ProblemSection problems={product.problems} theme={styles} />
      ) : null} */}
      <ProblemSection
        title="কেন JINGSENG PLUS?"
        problems={product.benefits}
        theme={styles}
        sectionStyles={whyChooseSectionStyles}
      />
      <ProductPromoSection product={product} />
      <ProductTrustSection
        product={product}
        theme={{
          ...styles,
          sectionBg: "bg-[var(--jingseng-brown)]",
          badgeBgColor: "bg-[var(--jingseng-gold)]/20",
        }}
        title="🔒 সম্পূর্ণ গোপন ডেলিভারি"
      />
      <OrderForm
        product={product}
        theme={{ ...styles, textColor: "text-black" }}
        title={`আজই আপনার ${product.brand_name} অর্ডার করুন`}
        subtitle="অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করে নিশ্চিত করবেন।"
        styles={{
          sectionBg: "bg-[var(--jingseng-dark)]",
          formBg: "bg-[var(--jingseng-brown)]/40",
          formBorderColor: "border-[var(--jingseng-gold)]/20",
        }}
      />
      <div className="pb-12 sm:pb-16">
        <ContactSection
          title="যেকোনো প্রয়োজনে যোগাযোগ করুন"
          styles={whyChooseSectionStyles}
        />
        <Footer
          // classNames="bg-[var(--ultrahot-background)]"
          theme={{ sectionBg: "bg-[var(--jingseng-dark)]" }}
        />
        <ProductStickyActions product={product} theme={styles} />
      </div>
    </main>
  )
}

export default JingsengPlus
