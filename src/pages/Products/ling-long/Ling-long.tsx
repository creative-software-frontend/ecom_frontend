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

const styles = {
  appearance: "light" as const,
  bg: "bg-white",
  sectionBg: "bg-[#f7f8fa]",
  textColor: "text-[#171717]",
  primaryTextColor: "text-[#e1262f]",
  primaryBgColor: "bg-[#e1262f]",
  badgeBgColor: "bg-red-50",
  badgeOutlineColor: "ring-red-200",
  descriptionTextColor: "text-gray-500",
  productImageShadow: "drop-shadow-[0_25px_28px_rgba(225,38,47,0.16)]",
}

const LingLong = () => {
  const product: Product | null = getProductsById("ling-long")

  if (!product) return null

  return (
    <main>
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
        styles={styles}
      />
      <ContactSection title="যোগাযোগ" styles={styles} theme={styles} />
      <Footer theme={styles} />
      <ProductStickyActions product={product} theme={styles} />
    </main>
  )
}

export default LingLong
