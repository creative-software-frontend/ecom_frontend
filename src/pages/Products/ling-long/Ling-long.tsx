import ProblemSection from "@/ProblemSection"
import ProductInfoSection from "@/components/ProductInfoSection"
import ProductPreviewSection from "@/components/ProductPreviewSection"
import ContactSection from "@/components/shared/ContactSection"
import Footer from "@/components/shared/Footer"
import OrderForm from "@/components/shared/OrderForm"
import getProductsById from "@/lib/getProductsById"
import type { Product } from "@/types/product"

const styles = {
  bg: "bg-gradient-to-br from-[#101b1d] via-[#163230] to-[#0d1718]",
  sectionBg: "bg-[#0d1718]",
  textColor: "text-white",
  primaryTextColor: "text-[#d6b45a]",
  primaryBgColor: "bg-[#d6b45a]",
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
      <ProductInfoSection product={product} styles={styles} />
      <OrderForm />
      <ContactSection title="যোগাযোগ" styles={styles} />
      <Footer />
    </main>
  )
}

export default LingLong
