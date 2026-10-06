import type { ProductTheme } from "@/types/product"

const Footer = ({
  theme,
  classNames = "",
}: {
  theme?: ProductTheme
  classNames?: string
}) => {
  const isLightTheme = theme?.appearance === "light"
  const footerBackground = theme?.sectionBg ?? "bg-[#120910]"

  return (
    <footer
      className={`mt-18 border-t px-4 py-8 ${footerBackground} ${classNames} ${isLightTheme ? "border-gray-200 text-gray-500" : "border-white/10 text-white/45"}`}
    >
      <p className="text-center text-sm font-bold">
        © Power Zenox — সকল অধিকার সংরক্ষিত
      </p>
    </footer>
  )
}
export default Footer
