import ProductPage from "@/pages/Products/ProductPage"

const styles = {
  bg: "bg-gradient-to-br from-[#101b1d] via-[#163230] to-[#0d1718]",
  sectionBg: "bg-[#0d1718]",
  textColor: "text-white",
  primaryTextColor: "text-[#d6b45a]",
  primaryBgColor: "bg-[#d6b45a]",
}

const LingLong = () => {
  return (
    <ProductPage
      productId="ling-long"
      styles={styles}
      benefitTitle="কেন এই পণ্যটি ব্যবহার করবেন?"
    />
  )
}

export default LingLong
