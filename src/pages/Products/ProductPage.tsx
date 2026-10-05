import ProblemSection from "@/pages/Products/ultrahot/ProblemSection"
import ProductPreviewSection from "@/components/ProductPreviewSection"
import ProductInfoSection from "../../components/ProductInfoSection"
import getProductsById from "@/lib/getProductsById"
import type { Product } from "@/types/product"

export interface ProductPageTheme {
  bg: string
  sectionBg?: string
  textColor: string
  primaryTextColor?: string
  primaryBgColor?: string
}

export interface ProductPageProps {
  productId: string
  styles: ProductPageTheme
  problemTitle?: string
  problemSubtitle?: string
  benefitTitle?: string
}

const ProductPage = ({
  productId,
  styles,
  problemTitle = "আপনি কি নিয়মিত এই সমস্যাগুলোর মুখোমুখি হচ্ছেন?",
  problemSubtitle = "মনে রাখবেন: কৃত্রিম বা কেমিক্যালযুক্ত তাৎক্ষণিক সমাধান আপনার শরীরের স্থায়ী ক্ষতি করতে পারে। আপনার প্রয়োজন প্রাকৃতিকভাবে ভেতর থেকে শক্তি রিচার্জ করা!",
  benefitTitle = "🌿 কেন আপনার প্রতিদিনের সঙ্গী হিসেবে বেছে নেবেন এই পণ্য?",
}: ProductPageProps) => {
  const product: Product | null = getProductsById(productId)

  if (!product) {
    return null
  }

  return (
    <div>
      <ProductPreviewSection styles={styles} product={product} />
      {product.problems?.length ? (
        <ProblemSection
          title={problemTitle}
          subtitle={problemSubtitle}
          problems={product.problems}
          theme={styles}
        />
      ) : null}
      {product.benefits?.length ? (
        <ProblemSection
          title={benefitTitle}
          problems={product.benefits}
          theme={styles}
        />
      ) : null}
      <ProductInfoSection product={product} styles={styles} />
    </div>
  )
}

export default ProductPage
