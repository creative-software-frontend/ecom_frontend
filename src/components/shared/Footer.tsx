import type { ProductTheme } from "@/types/product"

const Footer = ({
  theme,
  classNames = "",
}: {
  theme?: ProductTheme
  classNames?: string
}) => {
  const textColor = theme?.textColor ?? "text-muted-foreground"
  const footerBackground = theme?.sectionBg ?? "bg-white"
  console.log(footerBackground)
  return (
    <footer
      className={`border-t border-white/5 px-4 py-8 ${footerBackground} ${classNames} ${textColor}`}
    >
      <p className="text-center text-sm font-bold">
        © Power Zenox — সকল অধিকার সংরক্ষিত
      </p>
    </footer>
  )
}
export default Footer
