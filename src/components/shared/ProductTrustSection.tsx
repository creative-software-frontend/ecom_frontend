import { motion } from "motion/react"
import type { Product, ProductTheme } from "@/types/product"
import { containerVariants, itemVariants } from "@/lib/motionVariants"

const ProductTrustSection = ({
  product,
  theme,
  title = "অরিজিনালিটি ও গোপনীয়তা",
}: {
  product: Product
  theme: ProductTheme
  title?: string
}) => {
  if (!product.trust?.length) return null
  return (
    <section
      className={`${theme.sectionBg} px-4 py-10 text-white backdrop-brightness-2 sm:py-12`}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="mx-auto max-w-5xl"
      >
        <div className="text-center">
          <motion.h2
            variants={itemVariants}
            className="text-3xl leading-tight font-black sm:text-4xl"
          >
            {title}
          </motion.h2>
          <div className="mx-auto mt-6 flex h-1.5 w-24 overflow-hidden rounded-full bg-white/15">
            <div
              className={`h-full w-1/2 rounded-full ${theme.primaryBgColor ?? "bg-amber-400"}`}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {product.trust.map((item, index) => (
            <motion.article
              key={`${item.title}-${index}`}
              className="flex min-h-32 cursor-default items-start gap-4 rounded-[28px] border border-white/8 bg-white/5 p-5 hover:bg-white/10 sm:p-6"
              variants={itemVariants}
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${theme.badgeBgColor ?? "bg-amber-400"} text-base font-black ${theme.primaryTextColor ?? "text-amber-400"}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-lg leading-snug font-bold sm:text-xl">
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55 sm:text-base">
                  {item.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default ProductTrustSection
