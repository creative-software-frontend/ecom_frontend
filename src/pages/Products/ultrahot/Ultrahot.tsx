import ProblemSection from "@/ProblemSection"
import ProductPreviewSection from "@/components/ProductPreviewSection"
import ContactSection from "@/components/shared/ContactSection"
import Footer from "@/components/shared/Footer"
import OrderForm from "@/components/shared/OrderForm"
import ProductStickyActions from "@/components/shared/ProductStickyActions"
import ProductTrustSection from "@/components/shared/ProductTrustSection"
import getProductsById from "@/lib/getProductsById"
import type { Product, ProductTheme } from "@/types/product"

const styles: ProductTheme = {
  bg: "bg-gradient-to-br from-lx-bg via-lx-bg2 to-lx-bg",
  textColor: "text-white",
  primaryTextColor: "text-lx-gold",
  primaryBgColor: "bg-lx-gold",
  badgeBgColor: "bg-lx-gold/20",
  badgeOutlineColor: "ring-lx-gold/40",
  descriptionTextColor: "text-white/60",
}

const problemSectionStyles = {
  sectionBg: "bg-lx-bg2",
}

const benefitSectionStyles = {
  sectionBg: "bg-lx-bg",
}

const Ultrahot = () => {
  const product: Product | null = getProductsById("ultrahot")

  if (!product) return null

  return (
    <main>
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
      <ProductTrustSection product={product} theme={styles} />
      <OrderForm
        product={product}
        theme={styles}
        title={`আজই আপনার ULTRAHOT অর্ডার করুন`}
        subtitle="অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করে নিশ্চিত করবেন।"
        styles={problemSectionStyles}
      />
      <ContactSection title="যোগাযোগ" styles={benefitSectionStyles} />
      <div className="">
        <Footer classNames="bg-lx-bg2" theme={styles} />
        <ProductStickyActions product={product} theme={styles} />
      </div>
    </main>
  )
}

export default Ultrahot
