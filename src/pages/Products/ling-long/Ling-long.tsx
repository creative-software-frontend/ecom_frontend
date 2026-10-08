import ProblemSection from "@/ProblemSection"
import ProductPreviewSection from "@/components/ProductPreviewSection"
import ContactSection from "@/components/shared/ContactSection"
import Footer from "@/components/shared/Footer"
import LingLongPromoBanner from "@/components/shared/LingLongPromoBanner"
import OrderForm from "@/components/shared/OrderForm"
import ProductIngredientsSection from "@/components/shared/ProductIngredientsSection"
import ProductReviewsSection from "@/components/shared/ProductReviewsSection"
import ProductStickyActions from "@/components/shared/ProductStickyActions"
import WhyChooseUsSection from "@/components/shared/WhyChooseUsSection"
import getProductsById from "@/lib/getProductsById"
import type { Product } from "@/types/product"
import type { CSSProperties } from "react"

const pageColors = {
  "--linglong-background": "#ffffff",
  "--linglong-section": "#f7f8fa",
  "--linglong-text": "#171717",
  "--linglong-red": "#e1262f",
  "--linglong-badge": "#fef2f2",
  "--linglong-outline": "#fecaca",
  "--linglong-muted": "#6b7280",
  "--linglong-shadow": "rgba(225, 38, 47, 0.16)",
} as CSSProperties

const styles = {
  appearance: "light" as const,
  bg: "bg-[var(--linglong-background)]",
  sectionBg: "bg-[var(--linglong-section)]",
  textColor: "text-[var(--linglong-text)]",
  primaryTextColor: "text-[var(--linglong-red)]",
  primaryBgColor: "bg-[var(--linglong-red)]",
  badgeBgColor: "bg-[var(--linglong-badge)]",
  badgeOutlineColor: "ring-[var(--linglong-outline)]",
  descriptionTextColor: "text-[var(--linglong-muted)]",
  productImageShadow: "drop-shadow-[0_25px_28px_var(--linglong-shadow)]",
}

const LingLong = () => {
  const product: Product | null = getProductsById("ling-long")

  if (!product) return null

  return (
    <main style={pageColors}>
      <ProductPreviewSection product={product} styles={styles} />
      {product.problems?.length ? (
        <ProblemSection problems={product.problems} theme={styles} />
      ) : null}
      {product.benefits?.length ? (
        <ProblemSection
          title="কেন এই পণ্যটি ব্যবহার করবেন?"
          problems={product.benefits}
          theme={styles}
        />
      ) : null}
      <ProductIngredientsSection product={product} />
      <LingLongPromoBanner />
      <WhyChooseUsSection />
      <ProductReviewsSection />
      <OrderForm
        product={product}
        theme={styles}
        title={`অর্ডার করুন`}
        subtitle="অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করে নিশ্চিত করবেন।"
        styles={{
          formBorderColor: "border-[var(--linglong-outline)]/50",
        }}
      />
      <div className="pb-12 sm:pb-16">
        <ContactSection
          borderColorVar={"var(--linglong-red)"}
          title="যোগাযোগ"
          styles={styles}
          theme={styles}
        />
        <Footer theme={{ sectionBg: "bg-[var(--linglong-background)]" }} />
        <ProductStickyActions
          product={product}
          theme={{ ...styles, sectionBg: "bg-[var(--linglong-background)]" }}
        />
      </div>
    </main>
  )
}

export default LingLong
