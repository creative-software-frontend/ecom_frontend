import ProductPage from "@/pages/Products/ProductPage"

const styles = {
  bg: "bg-gradient-to-br from-lx-bg via-lx-bg2 to-lx-bg",
  sectionBg: "bg-[#120910]",
  textColor: "text-white",
  primaryTextColor: "text-lx-gold",
  primaryBgColor: "bg-lx-gold",
  badgeBgColor: "bg-lx-gold/20",
  badgeOutlineColor: "ring-lx-gold/40",
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
