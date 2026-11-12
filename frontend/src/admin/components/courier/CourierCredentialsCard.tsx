import { useState } from "react"
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Key,
  Check,
  Send,
} from "lucide-react"
import { CourierCardHeader } from "./CourierCardHeader"

/* ================================================================
   Courier API credentials — 4 fixed integrations, mock data.
   Only one panel expanded at a time (accordion style).
   ================================================================ */

type CourierIntegrationId = "steadfast" | "pathao" | "redx" | "carrybee"

type CourierIntegration = {
  id: CourierIntegrationId
  name: string
  description: string
  initials: string
  initialsBgClass: string
  status: "connected" | "ready" | "not_configured" | "optional"
  statusLabel: string
  versionOrType?: string // e.g. "v1.2.0", "OAuth 2.0"
}

const INTEGRATIONS: CourierIntegration[] = [
  {
    id: "steadfast",
    name: "Steadfast Courier",
    description:
      "Primary nationwide parcel carrier with automated return tracking.",
    initials: "SF",
    initialsBgClass: "bg-emerald-600 text-white",
    status: "connected",
    statusLabel: "Connected",
    versionOrType: "v1.2.0",
  },
  {
    id: "pathao",
    name: "Pathao Courier",
    description: "Fast on-demand delivery with real-time Dhaka rider tracking.",
    initials: "PT",
    initialsBgClass: "bg-fuchsia-500 text-white",
    status: "ready",
    statusLabel: "Ready to Connect",
    versionOrType: "OAuth 2.0",
  },
  {
    id: "redx",
    name: "RedX Logistics",
    description:
      "Cross-district express parcels with door-to-door OTP confirmation.",
    initials: "RX",
    initialsBgClass: "bg-amber-500 text-white",
    status: "not_configured",
    statusLabel: "Not Configured",
  },
  {
    id: "carrybee",
    name: "Carrybee",
    description:
      "Reliable suburban distribution network & bulk shipment dispatch.",
    initials: "CB",
    initialsBgClass: "bg-blue-500 text-white",
    status: "optional",
    statusLabel: "Optional",
  },
]

function StatusChip({
  status,
  label,
}: {
  status: CourierIntegration["status"]
  label: string
}) {
  const styles: Record<CourierIntegration["status"], string> = {
    connected: "bg-(--status-delivered-bg) text-(--status-delivered-text)",
    ready: "bg-blue-100 text-blue-800",
    not_configured: "bg-(--bg-table-header) text-(--text-muted)",
    optional: "bg-(--bg-table-header) text-(--text-muted)",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status === "connected" && <Check className="size-2.5" />}
      {label}
    </span>
  )
}

/* Expanded Steadfast panel — mock inputs, no wiring. */
function SteadfastPanel() {
  return (
    <div className="space-y-3 border-t border-(--border-light) bg-(--bg-app) p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
              API Key
            </label>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
            >
              Regenerate
            </button>
          </div>
          <input
            type="text"
            defaultValue="••••••••••••••••••••••••"
            readOnly
            className="h-8 w-full rounded border border-(--border-light) bg-(--bg-surface) px-2 font-mono text-xs tracking-wider text-(--text-muted)"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
              Secret Key
            </label>
            <span className="text-xs text-(--text-muted)">Encrypted</span>
          </div>
          <input
            type="text"
            defaultValue="••••••••••••••••••••••••"
            readOnly
            className="h-8 w-full rounded border border-(--border-light) bg-(--bg-surface) px-2 font-mono text-xs tracking-wider text-(--text-muted)"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
            Webhook Secret Token
          </label>
          <input
            type="text"
            defaultValue="whsec_884920481240"
            readOnly
            className="h-8 w-full rounded border border-(--border-light) bg-(--bg-surface) px-2 font-mono text-xs text-(--text-primary)"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
            Webhook Callback URL
          </label>
          <input
            type="text"
            defaultValue="https://api.powerzenox.com/courier/"
            readOnly
            className="h-8 w-full rounded border border-(--border-light) bg-(--bg-surface) px-2 font-mono text-xs text-(--text-primary)"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-(--bg-surface) px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
          <Check className="size-3 text-emerald-600" />
          Verified response: Latency 142ms • Balance ৳4,250
        </div>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded bg-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
        >
          <Send className="size-3" />
          Save Steadfast
        </button>
      </div>
    </div>
  )
}

export function CourierCredentialsCard() {
  const [expanded, setExpanded] = useState<CourierIntegrationId | null>(
    "steadfast"
  )
  const [sandbox, setSandbox] = useState(false)

  return (
    <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <CourierCardHeader
        icon={<Key className="size-4" />}
        title="Courier Gateway API Credentials"
        subtitle="Connect accounts to auto-generate tracking IDs, consignment notes, and parcel booking."
        badge={
          <span className="rounded bg-(--bg-surface-hover) px-2 py-0.5 text-xs font-medium text-(--text-muted)">
            4 Couriers Supported
          </span>
        }
      />

      <div className="space-y-3 p-4">
        {/* Sandbox toggle */}
        <div className="flex items-start justify-between gap-3 rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2.5">
          <div className="flex items-start gap-2">
            <FlaskConical className="mt-0.5 size-4 text-(--text-muted)" />
            <div>
              <p className="text-xs font-semibold text-(--text-primary)">
                Sandbox / Test Mode
              </p>
              <p className="text-xs text-(--text-muted)">
                Simulate bookings and tracking updates without contacting live
                courier fleets.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sandbox}
            onClick={() => setSandbox((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              sandbox ? "bg-primary" : "bg-(--border-hover)"
            }`}
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                sandbox ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Integration list */}
        {INTEGRATIONS.map((int) => {
          const isExpanded = expanded === int.id
          return (
            <div
              key={int.id}
              className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)"
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => (prev === int.id ? null : int.id))
                }
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-(--bg-surface-hover)"
                aria-expanded={isExpanded}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded text-xs font-bold ${int.initialsBgClass}`}
                  >
                    {int.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-(--text-primary)">
                        {int.name}
                      </span>
                      <StatusChip status={int.status} label={int.statusLabel} />
                      {int.versionOrType && (
                        <span className="text-xs text-(--text-muted)">
                          {int.versionOrType}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-(--text-muted)">
                      {int.description}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {int.id === "steadfast" ? (
                    <span className="inline-flex h-7 items-center gap-1 rounded border border-(--border-light) bg-(--bg-surface) px-2 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)">
                      <RefreshCw className="size-3" />
                      Test Connection
                    </span>
                  ) : (
                    <span className="inline-flex h-7 items-center rounded border border-(--border-light) bg-(--bg-surface) px-2 text-xs font-medium text-(--text-primary)">
                      {int.status === "ready" ? "Configure" : "Connect"}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-(--text-muted)" />
                  ) : (
                    <ChevronDown className="size-4 text-(--text-muted)" />
                  )}
                </div>
              </button>
              {isExpanded && int.id === "steadfast" && <SteadfastPanel />}
              {isExpanded && int.id !== "steadfast" && (
                <div className="border-t border-(--border-light) bg-(--bg-app) p-4 text-center text-xs text-(--text-muted)">
                  {int.name} configuration panel coming soon.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
