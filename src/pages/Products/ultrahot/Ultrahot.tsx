import ProductPage from "@/pages/Products/ProductPage"

const styles = {
  bg: "bg-gradient-to-br from-[#1a0b15] via-[#2d0a1b] to-[#1a0b15]",
  sectionBg: "bg-[#120910]",
  textColor: "text-white",
  primaryTextColor: "text-[#d4af37]",
  primaryBgColor: "bg-[#d4af37]",
}

const Ultrahot = () => {
  return (
    <ProductPage
      productId="ultrahot"
      styles={styles}
      problemTitle="আপনি কি নিয়মিত এই সমস্যাগুলোর মুখোমুখি হচ্ছেন?"
      problemSubtitle="মনে রাখবেন: কৃত্রিম বা কেমিক্যালযুক্ত তাৎক্ষণিক সমাধান আপনার শরীরের স্থায়ী ক্ষতি করতে পারে। আপনার প্রয়োজন প্রাকৃতিকভাবে ভেতর থেকে শক্তি রিচার্জ করা!"
      benefitTitle="🌿 কেন আপনার প্রতিদিনের সঙ্গী হিসেবে বেছে নেবেন ULTRAHOT?"
    />
  )
}

export default Ultrahot
