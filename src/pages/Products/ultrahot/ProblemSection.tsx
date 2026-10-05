import type { ProblemSectionData } from "../../../components/shared/ProductDetails"
import { FeatureCard } from "../../../components/ui/FeatureCard"
import { Progress } from "@/components/ui/progress"
export default function ProblemSection({
  title,
  subtitle,
  problems = [],
  theme,
}: ProblemSectionData) {
  const sectionBgClass = theme?.sectionBg ?? "bg-[#2d0a1b]"
  const textClass = theme?.textColor ?? "text-white"
  const accentClass = theme?.primaryBgColor ?? "bg-yellow-600"
  const accentTextClass = theme?.primaryTextColor ?? "text-yellow-400"

  return (
    <section className={`${sectionBgClass} px-4 py-16 ${textClass} md:py-20`}>
      <div className="mx-auto max-w-5xl text-center">
        {title && (
          <h2 className="mb-4 text-3xl leading-tight font-extrabold md:text-6xl">
            {title}
          </h2>
        )}
        <Progress
          value={50}
          className="mx-auto my-6 h-2 w-24 rounded-full bg-white/10"
          indicatorClassName={accentClass}
        />

        {subtitle && (
          <p className="mx-auto mb-12 max-w-2xl text-sm leading-relaxed opacity-75 md:text-base">
            {subtitle}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2">
          {problems.map((item, index) => {
            const icon = item?.icon || `0${index + 1}`
            return (
              <FeatureCard
                id={icon}
                key={index}
                title={item.title}
                description={item.description}
                accentClass={accentClass}
                accentTextClass={accentTextClass}
                textClass={textClass}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
