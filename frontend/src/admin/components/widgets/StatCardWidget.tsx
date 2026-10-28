import type { StatCardWidgetProps } from "../../types/dashboard"

const gradientClass = {
  "midnight-bloom": "bg-midnight-bloom",
  "arielle-smile": "bg-arielle-smile",
  "grow-early": "bg-grow-early",
  "premium-dark": "bg-premium-dark",
} as const

export function StatCardWidget({ card }: StatCardWidgetProps) {
  const visibilityClass = card.hideAtXlBelow ? "xl:hidden" : ""

  return (
    <div className={visibilityClass}>
      <div
        className={`admin-dashboard-card admin-stat-card ${gradientClass[card.gradient]}`}
      >
        <div className="flex items-center text-white">
          <div>
            <div className="font-bold opacity-80">{card.title}</div>
            <div className="text-sm opacity-60">{card.subtitle}</div>
          </div>
          <div className="ml-auto">
            <div className="text-[1.8rem] leading-none font-bold">
              <span>{card.value}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
