import ProblemSection from "@/pages/Products/ultrahot/ProblemSection"
import ProductPreviewSection from "@/components/ProductPreviewSection"
import getProductsById from "@/lib/getProductsById"
import type { Product } from "@/types/product"

export interface ProductPreviewSectionProps {
  product: Product | null
}

export interface ProblemSectionData {
  problems: { title: string; description: string }[]
}
// const problemSectionData: ProblemSectionData = {
//   problems: [
//     {
//       title: "ক্লান্ত বোধ করা",
//       description:
//         "সারাদিনের ব্যস্ততা ও মানসিক চাপে শরীর অতিরিক্ত ক্লান্ত হয়ে পড়া?",
//     },
//     {
//       title: "সঙ্গীকে সময় দিতে না পারা",
//       description:
//         "দাম্পত্য জীবনে সঙ্গীকে কাঙ্ক্ষিত সময় ও সন্তুষ্টি দিতে না পারা?",
//     },
//     {
//       title: "স্ট্যামিনা কমে যাওয়া",
//       description:
//         "বয়সের প্রভাব কিংবা পুষ্টির অভাবে শারীরিক ড্রাইভ ও স্ট্যামিনা কমে যাওয়া?",
//     },
//     {
//       title: "আত্মবিশ্বাস হারানো",
//       description: "ভেতরের আত্মবিশ্বাস হারিয়ে ফেলে মানসিকভাবে বিষণ্ণ বোধ করা?",
//     },
//   ],
// }

const styles = {
  bg: "bg-gradient-to-br from-[#1a0b15] via-[#2d0a1b] to-[#1a0b15]",
  textColor: "text-white",
  primaryTextColor: "text-[#d4af37]",
  primaryBgColor: "bg-[#d4af37]",
}

const Ultrahot = () => {
  const product: Product | null = getProductsById("ultrahot")
  return (
    <div>
      <ProductPreviewSection styles={styles} product={product} />
      <ProblemSection
        title="আপনি কি নিয়মিত এই সমস্যাগুলোর মুখোমুখি হচ্ছেন?"
        subtitle="মনে রাখবেন: কৃত্রিম বা কেমিক্যালযুক্ত তাৎক্ষণিক সমাধান আপনার শরীরের স্থায়ী ক্ষতি করতে পারে। আপনার প্রয়োজন প্রাকৃতিকভাবে ভেতর থেকে শক্তি রিচার্জ করা!"
        problems={product?.problems}
      />
      <ProblemSection
        title="🌿 কেন আপনার প্রতিদিনের সঙ্গী হিসেবে বেছে নেবেন ULTRAHOT?"
        problems={product?.benefits}
      />
    </div>
  )
}
export default Ultrahot
