import ProductPage from "@/pages/Products/ProductPage"

const styles = {
  bg: "bg-gradient-to-br from-[#1b1024] via-[#2d1632] to-[#140d1b]",
  sectionBg: "bg-[#140d1b]",
  textColor: "text-white",
  primaryTextColor: "text-[#d9b45f]",
  primaryBgColor: "bg-[#d9b45f]",
  badgeBgColor: "bg-[#d9b45f]/40",
}

const JingsengPlus = () => {
  return (
    <ProductPage
      productId="jingseng-plus"
      styles={styles}
      benefitTitle="কেন JINGSENG PLUS?"
    />
  )
}

export default JingsengPlus
