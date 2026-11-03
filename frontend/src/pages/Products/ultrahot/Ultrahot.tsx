import ProblemSection from "@/ProblemSection"
import ProductPreviewSection from "@/components/ProductPreviewSection"
import ContactSection from "@/components/shared/ContactSection"
import Footer from "@/components/shared/Footer"
import OrderForm from "@/components/shared/OrderForm"
import ProductStickyActions from "@/components/shared/ProductStickyActions"
import ProductTrustSection from "@/components/shared/ProductTrustSection"
import getProductsById from "@/lib/getProductsById"
import type { Product, ProductTheme } from "@/types/product"
import type { CSSProperties } from "react"

const pageColors = {
  "--ultrahot-background": "#1a0b15",
  "--ultrahot-section": "#2d0a1b",
  "--ultrahot-gold": "#d4af37",
  "--ultrahot-gold-shadow": "rgba(212, 175, 55, 0.3)",
} as CSSProperties

const styles: ProductTheme = {
  bg: "bg-linear-to-br from-(--ultrahot-background) via-(--ultrahot-section) to-(--ultrahot-background)",
  textColor: "text-white",
  primaryTextColor: "text-(--ultrahot-gold)",
  primaryBgColor: "bg-(--ultrahot-gold)",
  badgeBgColor: "bg-(--ultrahot-gold)/20",
  badgeOutlineColor: "ring-(--ultrahot-gold)/40",
  descriptionTextColor: "text-white/60",
  productImageShadow: "drop-shadow-[0_35px_35px_var(--ultrahot-gold-shadow)]",
}

const problemSectionStyles = {
  sectionBg: "bg-(--ultrahot-section)",
}

const benefitSectionStyles = {
  sectionBg: "bg-(--ultrahot-background)",
}

const Ultrahot = () => {
  const product: Product | null = getProductsById("ultrahot")

  if (!product) return null

  return (
    <main style={pageColors}>
      <ProductPreviewSection product={product} styles={styles} />
      {product.problems?.length ? (
        <ProblemSection
          title="আপনি কি নিয়মিত এই সমস্যাগুলোর মুখোমুখি হচ্ছেন?"
          subtitle="মনে রাখবেন: কৃত্রিম বা কেমিক্যালযুক্ত তাৎক্ষণিক সমাধান আপনার শরীরের স্থায়ী ক্ষতি করতে পারে। আপনার প্রয়োজন প্রাকৃতিকভাবে ভেতর থেকে শক্তি রিচার্জ করা!"
          problems={product.problems}
          theme={styles}
          sectionStyles={problemSectionStyles}
        />
      ) : null}
      {product.benefits?.length ? (
        <ProblemSection
          title="🌿 কেন আপনার প্রতিদিনের সঙ্গী হিসেবে বেছে নেবেন ULTRAHOT?"
          problems={product.benefits}
          theme={styles}
          sectionStyles={benefitSectionStyles}
        />
      ) : null}
      <ProductTrustSection
        product={product}
        theme={{
          ...styles,
          sectionBg: "bg-(--ultrahot-section)",
          badgeBgColor: "bg-(--ultrahot-gold)/20",
        }}
      />
      <OrderForm
        product={product}
        theme={{ ...styles, primaryBgColor: "bg-red-500" }}
        title={`আজই আপনার ULTRAHOT অর্ডার করুন`}
        subtitle="অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করে নিশ্চিত করবেন।"
        styles={{
          sectionBg: "bg-(--ultrahot-background)",
          formBg: "bg-(--ultrahot-section)/60",
          formBorderColor: "border-(--ultrahot-gold)/20",
        }}
      />
      <div className="pb-12 sm:pb-16">
        <ContactSection
          title="যোগাযোগ"
          borderColorVar={"var(--ultrahot-gold)"}
          styles={benefitSectionStyles}
        />
        <Footer theme={{ sectionBg: "bg-(--ultrahot-background)" }} />
        <ProductStickyActions
          product={product}
          theme={{ ...styles, sectionBg: "bg-(--ultrahot-background)" }}
        />
      </div>
    </main>
  )
}

export default Ultrahot
