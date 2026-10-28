import type { TargetProgressCardProps } from "../../types/dashboard"

const colorClass = {
  danger: "bg-[#d92550]",
  success: "bg-[#3ac47d]",
  warning: "bg-[#f7b924]",
  info: "bg-[#16aaff]",
} as const

export function TargetProgressCard({ card }: TargetProgressCardProps) {
  return (
    <div
      className={`admin-dashboard-card admin-target-card admin-target-card--${card.color}`}
    >
      <div className="flex items-center">
        <div className={`pr-2 text-2xl font-bold ${colorClass[card.color]}`}>
          {card.value}
        </div>
        <div className="w-full">
          <div
            className="h-1 overflow-hidden rounded-sm bg-gray-200"
            role="progressbar"
            aria-label={`${card.title} progress`}
            aria-valuenow={card.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full ${colorClass[card.color]}`}
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-1 text-sm text-gray-500 opacity-60">{card.title}</div>
    </div>
  )
}
