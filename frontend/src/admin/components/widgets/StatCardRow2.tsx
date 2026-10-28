import type { StatCardRow2Props } from "../../types/dashboard"

const valueColorClass = {
  success: "text-[#3ac47d]",
  warning: "text-[#f7b924]",
  danger: "text-[#d92550]",
  focus: "text-[#444054]",
} as const

const progressColorClass = {
  info: "bg-[#16aaff]",
} as const

export function StatCardRow2({ card }: StatCardRow2Props) {
  const visibilityClass = card.hideAtXlBelow ? "xl:hidden" : ""

  return (
    <div className={visibilityClass}>
      <div className="admin-dashboard-card admin-stat-card bg-white">
        <div className="flex items-center">
          <div>
            <div className="font-bold text-gray-700">{card.title}</div>
            <div className="text-sm text-gray-500">{card.subtitle}</div>
          </div>
          <div className="ml-auto">
            <div
              className={`text-[1.8rem] leading-none font-bold ${valueColorClass[card.valueColor]}`}
            >
              {card.value}
            </div>
          </div>
        </div>
        {card.progress ? (
          <div className="mt-4">
            <div
              className="h-1 overflow-hidden rounded-sm bg-gray-200"
              role="progressbar"
              aria-label={`${card.title} progress`}
              aria-valuenow={card.progress.value}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full ${progressColorClass[card.progress.color]}`}
                style={{ width: `${card.progress.value}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{card.progress.label}</span>
              <span>{card.progress.labelValue}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
