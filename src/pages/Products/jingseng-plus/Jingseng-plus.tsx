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

const styles = {
  bg: "bg-gradient-to-br from-[#0a0908] via-[#241a12] to-[#0a0908]",
  sectionBg: "bg-[#140d1b]",
  textColor: "text-white",
  primaryTextColor: "text-[#d9b45f]",
  primaryBgColor: "bg-[#d9b45f]",
  badgeBgColor: "bg-[#d9b45f]/30",
}
const whyChooseSectionStyles = {
  sectionBg: "bg-[#0a0908]",
}

const JingsengPlus = () => {
  const product: Product | null = getProductsById("jingseng-plus")

  if (!product) return null

  return (
    <main>
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
        theme={styles}
        title="🔒 সম্পূর্ণ গোপন ডেলিভারি"
      />

      <OrderForm
        product={product}
        theme={styles}
        title={`আজই আপনার ${product.brand_name} অর্ডার করুন`}
        subtitle="অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করে নিশ্চিত করবেন।"
        styles={whyChooseSectionStyles}
      />
      <ContactSection
        title="যেকোনো প্রয়োজনে যোগাযোগ করুন"
        styles={whyChooseSectionStyles}
      />
      <Footer theme={styles} />
      <ProductStickyActions product={product} theme={styles} />
    </main>
  )
}

export default JingsengPlus
