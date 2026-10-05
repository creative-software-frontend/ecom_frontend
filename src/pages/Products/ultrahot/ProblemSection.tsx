import type { ProblemSectionData } from "../../../components/shared/ProductDetails"
import { FeatureCard } from "../../../components/ui/FeatureCard"
import { Progress } from "@/components/ui/progress"
export default function ProblemSection({
  title,
  subtitle,
  problems = [],
}: ProblemSectionData) {
  return (
    <section className="bg-[#1C0B18] px-4 py-16 text-white">
      <div className="mx-auto max-w-4xl text-center">
        {title && (
          <h2 className="mb-4 text-3xl leading-tight font-extrabold md:text-4xl">
            {title}
          </h2>
        )}
        <Progress
          value={50}
          className="mx-auto mb-4 w-24"
          indicatorClassName="!bg-yellow-600"
        />

        {subtitle && (
          <p className="mx-auto mb-12 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
            {subtitle}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2">
          {problems.map((item, index) => (
            <FeatureCard
              id={`0${index + 1}`}
              key={index}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
