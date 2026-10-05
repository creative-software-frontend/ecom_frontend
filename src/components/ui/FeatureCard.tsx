type FeatureCardProps = {
  id: string | number
  title: string
  description: string
  accentClass?: string
  accentTextClass?: string
  textClass?: string
}

export const FeatureCard = ({
  id,
  title,
  description,
  accentClass = "bg-yellow-500 text-slate-900",
  accentTextClass = "text-yellow-400",
  textClass = "text-white",
}: FeatureCardProps) => {
  return (
    <div className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div
        className={`flex h-11 min-w-11 items-center justify-center rounded-full text-base font-black ${accentClass}`}
      >
        {id}
      </div>
      <div>
        <h3 className={`mb-2 text-lg font-bold ${accentTextClass}`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${textClass} opacity-75`}>
          {description}
        </p>
      </div>
    </div>
  )
}
