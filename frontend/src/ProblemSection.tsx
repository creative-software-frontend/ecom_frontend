import type { ProblemSectionData } from "./components/shared/ProductDetails"
import { motion } from "motion/react"
import { FeatureCard } from "./components/ui/FeatureCard"
import { Progress } from "@/components/ui/progress"
import { containerVariants, itemVariants } from "./lib/motionVariants"

export default function ProblemSection({
  title,
  subtitle,
  problems = [],
  theme,
  sectionStyles,
}: ProblemSectionData) {
  const accentTextClass = theme?.textColor ?? "text-white"
  const accentClass = theme?.primaryBgColor ?? "bg-yellow-600"
  const textClass = theme?.textColor
  const isLightTheme = theme?.appearance === "light"

  return (
    <section
      className={`${sectionStyles?.sectionBg ?? theme?.sectionBg ?? ""} px-4 py-8 sm:px-6 sm:py-12 ${textClass} md:py-20`}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="mx-auto max-w-4xl text-center"
      >
        {title && (
          <motion.h2
            variants={itemVariants}
            className="mb-4 text-center text-3xl leading-tight font-extrabold md:text-5xl"
          >
            {title}
          </motion.h2>
        )}
        <Progress
          value={50}
          className={`mx-auto my-6 h-2 w-24 rounded-full ${isLightTheme ? "bg-red-100" : "bg-white/10"}`}
          indicatorClassName={accentClass}
        />

        {subtitle && (
          <motion.p
            variants={itemVariants}
            className="mb-12 text-center text-lg leading-relaxed opacity-75"
          >
            {subtitle}
          </motion.p>
        )}

        <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2">
          {problems.map((item, index) => {
            const icon = item?.icon || `0${index + 1}`
            return (
              <FeatureCard
                icon={icon}
                key={index}
                iconTextClass={theme?.primaryTextColor}
                title={item.title}
                description={item.description}
                accentClass={theme?.badgeBgColor}
                accentTextClass={accentTextClass}
                textClass={theme?.descriptionTextColor}
                appearance={theme?.appearance}
              />
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
