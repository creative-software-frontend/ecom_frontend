import { itemVariants } from "@/lib/motionVariants"
import { motion } from "motion/react"

type FeatureCardProps = {
  icon: string | number
  iconTextClass?: string
  title: string
  description: string
  accentClass?: string
  accentTextClass?: string
  textClass?: string
  appearance?: "light" | "dark"
}

export const FeatureCard = ({
  icon,
  title,
  description,
  accentClass,
  accentTextClass,
  textClass,
  iconTextClass,
  appearance,
}: FeatureCardProps) => {
  return (
    <motion.div
      variants={itemVariants}
      className={`flex items-start gap-4 rounded-[24px] border p-6 transition-all duration-300 hover:bg-white/10 ${appearance === "light" ? "border-gray-200 bg-white shadow-sm" : "border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"}`}
    >
      <div
        className={`flex h-11 min-w-11 items-center justify-center rounded-full text-base font-black ${accentClass} ${iconTextClass}`}
      >
        {icon}
      </div>
      <div>
        <h3
          className={`mb-2 text-lg font-bold ${appearance === "light" ? "text-[#171717]" : accentTextClass}`}
        >
          {title}
        </h3>
        <p
          className={`text-base leading-relaxed ${textClass} text-muted-foreground opacity-75`}
        >
          {description}
        </p>
      </div>
    </motion.div>
  )
}
