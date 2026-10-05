import { useParams } from "react-router"
import ProductPage from "./ProductPage"

const productThemes = {
  ultrahot: {
    bg: "bg-gradient-to-br from-[#1a0b15] via-[#2d0a1b] to-[#1a0b15]",
    sectionBg: "bg-[#2d0a1b]",
    textColor: "text-white",
    primaryTextColor: "text-[#d4af37]",
    primaryBgColor: "bg-[#d4af37]",
  },
  "jingseng-plus": {
    bg: "bg-gradient-to-br from-[#1b1024] via-[#2d1632] to-[#140d1b]",
    sectionBg: "bg-[#140d1b]",
    textColor: "text-white",
    primaryTextColor: "text-[#f4c95d]",
    primaryBgColor: "bg-[#f4c95d]",
  },
  "ling-long": {
    bg: "bg-gradient-to-br from-[#101b1d] via-[#163230] to-[#0d1718]",
    sectionBg: "bg-[#0d1718]",
    textColor: "text-white",
    primaryTextColor: "text-[#d6b45a]",
    primaryBgColor: "bg-[#d6b45a]",
  },
} as const

const ProductRoute = () => {
  const { slug } = useParams()

  const productId = slug ?? "ultrahot"
  const theme =
    productThemes[productId as keyof typeof productThemes] ??
    productThemes.ultrahot

  return (
    <ProductPage
      productId={productId}
      styles={theme}
      benefitTitle={
        productId === "jingseng-plus"
          ? "কেন JINGSENG PLUS?"
          : productId === "ling-long"
            ? "কেন এই পণ্যটি ব্যবহার করবেন?"
            : "🌿 কেন আপনার প্রতিদিনের সঙ্গী হিসেবে বেছে নেবেন ULTRAHOT?"
      }
    />
  )
}

export default ProductRoute
