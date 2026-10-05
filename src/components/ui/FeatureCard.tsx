export const FeatureCard = ({ id, title, description }) => {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-rose-950 bg-rose-950 p-6 shadow-lg">
      <div className="text-yellow flex h-10 min-w-10 items-center justify-center rounded-full bg-rose-950 text-lg font-bold">
        {id}
      </div>
      <div>
        <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-300">{description}</p>
      </div>
    </div>
  )
}
