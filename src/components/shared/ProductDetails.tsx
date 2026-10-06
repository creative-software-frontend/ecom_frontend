import getProductsById from "@/lib/getProductsById"
import type { Product } from "@/types/product"
import ProductPreviewSection from "../ProductPreviewSection"
import ProblemSection from "../../ProblemSection"

export interface ProductPreviewSectionProps {
  product: Product | null
  styles?: {
    bg?: string
    textColor?: string
    primaryColor?: string
    primaryTextColor?: string
    primaryBgColor?: string
    badgeBgColor?: string
    badgeOutlineColor?: string
    appearance?: "light" | "dark"
  }
}

export interface ProblemSectionData {
  title?: string
  subtitle?: string
  problems: { title: string; description: string; icon?: string }[] | undefined
  theme?: {
    bg?: string
    sectionBg?: string
    textColor?: string
    primaryBgColor?: string
    primaryTextColor?: string
    badgeBgColor?: string
    descriptionTextColor?: string
    appearance?: "light" | "dark"
  }
  sectionStyles?: { sectionBg?: string }
}

const problemSectionData: ProblemSectionData = {
  title: "আপনি কি নিয়মিত এই সমস্যাগুলোর মুখোমুখি হচ্ছেন?",
  subtitle:
    "মনে রাখবেন: কৃত্রিম বা কেমিক্যালযুক্ত তাৎক্ষণিক সমাধান আপনার শরীরের স্থায়ী ক্ষতি করতে পারে। আপনার প্রয়োজন প্রাকৃতিকভাবে ভেতর থেকে শক্তি রিচার্জ করা!",
  problems: [
    {
      title: "ক্লান্ত বোধ করা",
      description:
        "সারাদিনের ব্যস্ততা ও মানসিক চাপে শরীর অতিরিক্ত ক্লান্ত হয়ে পড়া?",
    },
    {
      title: "সঙ্গীকে সময় দিতে না পারা",
      description:
        "দাম্পত্য জীবনে সঙ্গীকে কাঙ্ক্ষিত সময় ও সন্তুষ্টি দিতে না পারা?",
    },
    {
      title: "স্ট্যামিনা কমে যাওয়া",
      description:
        "বয়সের প্রভাব কিংবা পুষ্টির অভাবে শারীরিক ড্রাইভ ও স্ট্যামিনা কমে যাওয়া?",
    },
    {
      title: "আত্মবিশ্বাস হারানো",
      description: "ভেতরের আত্মবিশ্বাস হারিয়ে ফেলে মানসিকভাবে বিষণ্ণ বোধ করা?",
    },
  ],
}

const ProductDetails = ({ id }: { id: string }) => {
  const product: Product | null = getProductsById(id)
  return (
    <main>
      <ProductPreviewSection product={product} />
      <ProblemSection
        title={problemSectionData.title}
        subtitle={problemSectionData.subtitle}
        problems={problemSectionData.problems}
      />
    </main>
  )
}
export default ProductDetails
