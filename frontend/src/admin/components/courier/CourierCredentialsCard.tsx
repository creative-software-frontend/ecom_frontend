import { useEffect, useState, type FormEvent } from "react"
import { Key, Loader2, Unplug, Zap } from "lucide-react"
import { CourierCardHeader } from "./CourierCardHeader"
import { ConfirmationDialog } from "../common/ConfirmationDialog"
import { ErrorState } from "../common/ErrorState"
import { InlineNotice } from "../common/InlineNotice"
import { LoadingState } from "../common/LoadingState"
import { StatusBadge, type StatusBadgeVariant } from "../common/StatusBadge"
import { FormToggle } from "../settings/SettingsField"
import {
  useCourierAccountsQuery,
  useDisconnectCourierAccountMutation,
  useTestCourierAccountMutation,
  useToggleCourierAccountMutation,
  useUpdateCourierAccountMutation,
} from "../../hooks/useCourierQuery"
import { getErrorMessage } from "../../lib/errors"
import { relativeTime } from "../../lib/formatTime"
import { formatTaka } from "../../lib/orderStatus"
import type {
  CourierAccount,
  CourierAccountStatus,
  CourierSlug,
  UpdateCourierAccountInput,
} from "../../types/courier"

/* ================================================================
   Courier API credentials — four real per-shop accounts.
   Secrets are write-only: the API returns only flags + masked previews.
   ================================================================ */

type EditableField = Exclude<keyof UpdateCourierAccountInput, "enabled">
type FormValues = Partial<Record<EditableField, string>>
type SecretFlagKey =
  | "hasApiKey"
  | "hasSecretKey"
  | "hasClientSecret"
  | "hasPassword"
  | "hasAccessToken"
type SecretPreviewKey =
  | "apiKeyPreview"
  | "secretKeyPreview"
  | "clientSecretPreview"
  | "passwordPreview"
  | "accessTokenPreview"

type FieldDef = {
  key: EditableField
  label: string
  kind: "text" | "url" | "password"
  secret?: boolean
  hasKey?: SecretFlagKey
  previewKey?: SecretPreviewKey
}

type CourierMeta = {
  slug: CourierSlug
  name: string
  description: string
  initials: string
}

type AccountWithMeta = CourierAccount & CourierMeta

const COURIERS: CourierMeta[] = [
  {
    slug: "steadfast",
    name: "Steadfast Courier",
    description: "Primary nationwide parcel carrier with return tracking.",
    initials: "SF",
  },
  {
    slug: "pathao",
    name: "Pathao Courier",
    description: "On-demand delivery with Dhaka rider tracking.",
    initials: "PT",
  },
  {
    slug: "redx",
    name: "RedX Logistics",
    description: "Cross-district express parcels with OTP confirmation.",
    initials: "RX",
  },
  {
    slug: "carrybee",
    name: "Carrybee",
    description: "Suburban distribution and bulk shipment dispatch.",
    initials: "CB",
  },
]

const FIELDS: Record<CourierSlug, FieldDef[]> = {
  steadfast: [
    { key: "baseUrl", label: "Base URL", kind: "url" },
    {
      key: "apiKey",
      label: "API Key",
      kind: "password",
      secret: true,
      hasKey: "hasApiKey",
      previewKey: "apiKeyPreview",
    },
    {
      key: "secretKey",
      label: "Secret Key",
      kind: "password",
      secret: true,
      hasKey: "hasSecretKey",
      previewKey: "secretKeyPreview",
    },
  ],
  pathao: [
    { key: "baseUrl", label: "Base URL", kind: "url" },
    { key: "clientId", label: "Client ID", kind: "text" },
    {
      key: "clientSecret",
      label: "Client Secret",
      kind: "password",
      secret: true,
      hasKey: "hasClientSecret",
      previewKey: "clientSecretPreview",
    },
    { key: "username", label: "Username", kind: "text" },
    {
      key: "password",
      label: "Password",
      kind: "password",
      secret: true,
      hasKey: "hasPassword",
      previewKey: "passwordPreview",
    },
    { key: "storeId", label: "Store ID", kind: "text" },
  ],
  redx: [
    { key: "baseUrl", label: "Base URL", kind: "url" },
    { key: "storeId", label: "Store ID", kind: "text" },
    {
      key: "accessToken",
      label: "Access Token",
      kind: "password",
      secret: true,
      hasKey: "hasAccessToken",
      previewKey: "accessTokenPreview",
    },
  ],
  carrybee: [
    { key: "baseUrl", label: "Base URL", kind: "url" },
    { key: "clientId", label: "Client ID", kind: "text" },
    {
      key: "clientSecret",
      label: "Client Secret",
      kind: "password",
      secret: true,
      hasKey: "hasClientSecret",
      previewKey: "clientSecretPreview",
    },
    { key: "storeId", label: "Store ID", kind: "text" },
    { key: "clientContext", label: "Client Context", kind: "text" },
  ],
}

const STATUS_META: Record<
  CourierAccountStatus,
  { label: string; variant: StatusBadgeVariant }
> = {
  connected: { label: "Connected", variant: "success" },
  ready: { label: "Ready", variant: "info" },
  not_connected: { label: "Not Configured", variant: "inactive" },
  error: { label: "Error", variant: "danger" },
}

const FLAG_KEYS: SecretFlagKey[] = [
  "hasApiKey",
  "hasSecretKey",
  "hasClientSecret",
  "hasPassword",
  "hasAccessToken",
]

const inputClass =
  "h-8 w-full rounded border border-(--border-light) bg-(--bg-surface) px-2 text-xs " +
  "text-(--text-primary) outline-none placeholder:text-(--text-muted) " +
  "focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"

const noticeClass = (variant: "success" | "error") =>
  variant === "success"
    ? "flex items-center justify-between gap-3 rounded border border-(--status-delivered-text) bg-(--status-delivered-bg) px-3 py-2 text-xs text-(--status-delivered-text)"
    : "flex items-center justify-between gap-3 rounded border border-(--status-cancelled-text) bg-(--status-cancelled-bg) px-3 py-2 text-xs text-(--status-cancelled-text)"

/** Only non-secret values are copied into the form — never decrypted secrets. */
function toFormValues(account: CourierAccount): FormValues {
  return {
    baseUrl: account.baseUrl ?? "",
    clientId: account.clientId ?? "",
    username: account.username ?? "",
    storeId: account.storeId ?? "",
    clientContext: account.clientContext ?? "",
  }
}

function isConfigured(account: CourierAccount): boolean {
  return (
    FLAG_KEYS.some((key) => account[key]) ||
    Boolean(
      account.clientId ||
      account.username ||
      account.storeId ||
      account.clientContext
    )
  )
}

/** Mirrors the backend's required-credential list using only safe flags. */
const REQUIRED_CREDENTIALS: Record<
  CourierSlug,
  readonly (keyof CourierAccount)[]
> = {
  steadfast: ["hasApiKey", "hasSecretKey"],
  pathao: ["clientId", "hasClientSecret", "username", "hasPassword", "storeId"],
  redx: ["storeId", "hasAccessToken"],
  carrybee: ["clientId", "hasClientSecret", "storeId", "clientContext"],
}

function hasRequiredCredentials(account: CourierAccount): boolean {
  return REQUIRED_CREDENTIALS[account.slug].every((field) => {
    const value = account[field]
    return typeof value === "string" ? value.trim().length > 0 : value === true
  })
}

function CourierAccountPanel({ account }: { account: AccountWithMeta }) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(account))
  const [notice, setNotice] = useState<{
    variant: "success" | "error"
    message: string
  } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [statusNoticeDismissed, setStatusNoticeDismissed] = useState(false)

  const updateMutation = useUpdateCourierAccountMutation()
  const toggleMutation = useToggleCourierAccountMutation()
  const disconnectMutation = useDisconnectCourierAccountMutation()
  const testMutation = useTestCourierAccountMutation()

  useEffect(() => {
    setValues(toFormValues(account))
    setStatusNoticeDismissed(false)
  }, [account])

  const fields = FIELDS[account.slug]
  const status = STATUS_META[account.status] ?? STATUS_META.error
  const configured = isConfigured(account)
  const credentialsSaved = hasRequiredCredentials(account)
  const dirty = JSON.stringify(values) !== JSON.stringify(toFormValues(account))
  const canTest = credentialsSaved && !dirty && !testMutation.isPending

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    const payload: UpdateCourierAccountInput = {}
    for (const field of fields) {
      // baseUrl is server-owned and read-only — it is never sent on save.
      if (field.key === "baseUrl") continue
      const raw = values[field.key] ?? ""
      if (field.secret) {
        // Empty means "keep the saved secret"; only non-empty values are sent.
        if (raw.length > 0) payload[field.key] = raw
      } else {
        Object.assign(payload, { [field.key]: raw.trim() || null })
      }
    }

    try {
      await updateMutation.mutateAsync({ slug: account.slug, input: payload })
      setValues(toFormValues(account))
      setNotice({
        variant: "success",
        message: `${account.slug} credentials saved.`,
      })
    } catch (error) {
      setNotice({
        variant: "error",
        message: getErrorMessage(error, "Could not save credentials."),
      })
    }
  }

  async function handleToggle(next: boolean) {
    setNotice(null)
    try {
      await toggleMutation.mutateAsync({ slug: account.slug, enabled: next })
      setNotice({
        variant: "success",
        message: next
          ? `${account.slug} enabled.`
          : `${account.slug} disabled.`,
      })
    } catch (error) {
      setNotice({
        variant: "error",
        message: getErrorMessage(error, "Could not change courier status."),
      })
    }
  }

  async function handleDisconnect() {
    setNotice(null)
    try {
      await disconnectMutation.mutateAsync(account.slug)
      setConfirmOpen(false)
      setNotice({
        variant: "success",
        message: `${account.slug} credentials cleared.`,
      })
    } catch (error) {
      setNotice({
        variant: "error",
        message: getErrorMessage(error, "Could not disconnect courier."),
      })
    }
  }

  async function handleTest() {
    setNotice(null)
    try {
      const result = await testMutation.mutateAsync(account.slug)
      setNotice({
        variant: result.ok ? "success" : "error",
        message: result.message,
      })
    } catch (error) {
      setNotice({
        variant: "error",
        message: getErrorMessage(error, "Could not test connection."),
      })
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded bg-(--primary-soft) text-xs font-bold text-primary">
            {account.initials ?? account.slug.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-(--text-primary)">
                {account.name ?? account.slug}
              </span>
              <StatusBadge
                variant={status.variant}
                label={status.label}
                ariaLive="polite"
                className={
                  account.status === "error"
                    ? "bg-(--status-cancelled-bg)! text-(--status-cancelled-text)!"
                    : undefined
                }
              />
            </div>
            <p className="mt-0.5 truncate text-xs text-(--text-muted)">
              {account.description ?? "Courier account"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pr-3">
          <span className="text-xs text-(--text-muted)">Enabled</span>
          <FormToggle
            checked={account.enabled}
            disabled={toggleMutation.isPending}
            onChange={(next) => void handleToggle(next)}
            aria-label={`Enable ${account.slug} courier`}
          />
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-3 border-t border-(--border-light) bg-(--bg-app) p-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((field) => {
            const isSaved =
              field.secret && field.hasKey ? account[field.hasKey] : false
            const preview =
              field.secret && field.previewKey
                ? account[field.previewKey]
                : null
            const inputId = `${account.slug}-${field.key}`
            return (
              <div key={field.key}>
                <label
                  htmlFor={inputId}
                  className="mb-1 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase"
                >
                  {field.label}
                </label>
                <input
                  id={inputId}
                  name={field.key}
                  type={field.kind}
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  readOnly={field.key === "baseUrl"}
                  placeholder={
                    isSaved
                      ? "Saved (••••) — enter new value to replace"
                      : `Enter ${field.label.toLowerCase()}`
                  }
                  autoComplete="off"
                  className={`${inputClass} ${
                    field.key === "baseUrl"
                      ? "cursor-not-allowed !bg-(--bg-surface-hover) text-(--text-muted)"
                      : ""
                  }`}
                />
                {field.key === "baseUrl" ? (
                  <p className="mt-1 text-xs text-(--text-muted)">
                    Official API endpoint (read-only)
                  </p>
                ) : isSaved && preview ? (
                  <p className="mt-1 text-xs text-(--text-muted)">
                    Saved {preview}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        {notice && (
          <InlineNotice
            message={notice.message}
            variant={notice.variant}
            className={noticeClass(notice.variant)}
            dismissLabel="Dismiss notice"
            onDismiss={() => setNotice(null)}
          />
        )}
        {!notice &&
          !statusNoticeDismissed &&
          account.status === "error" &&
          account.statusMessage && (
            <InlineNotice
              message={account.statusMessage}
              variant="error"
              className={noticeClass("error")}
              dismissLabel="Dismiss connection error"
              onDismiss={() => setStatusNoticeDismissed(true)}
            />
          )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-(--bg-surface) px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--text-muted)">
            {!credentialsSaved && (
              <span>Save required credentials before testing.</span>
            )}
            {credentialsSaved && dirty && (
              <span>Save changes before testing</span>
            )}
            {account.slug === "steadfast" && account.balance !== null && (
              <span>
                Balance:{" "}
                <span className="font-semibold text-(--text-primary)">
                  {formatTaka(account.balance)}
                </span>
              </span>
            )}
            {account.checkedAt && (
              <span>Last checked: {relativeTime(account.checkedAt)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={!canTest}
              title={
                !credentialsSaved
                  ? "Save required credentials before testing"
                  : dirty
                    ? "Save changes before testing"
                    : undefined
              }
              className="inline-flex h-7 items-center gap-1 rounded border border-(--border-light) bg-(--bg-surface) px-2 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              {testMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Zap className="size-3" />
              )}
              {testMutation.isPending ? "Testing..." : "Test Connection"}
            </button>
            {configured && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={disconnectMutation.isPending}
                className="inline-flex h-7 items-center gap-1 rounded border border-(--border-light) bg-(--bg-surface) px-2 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
              >
                <Unplug className="size-3" />
                Disconnect
              </button>
            )}
            <button
              type="submit"
              disabled={updateMutation.isPending || toggleMutation.isPending}
              className="inline-flex h-7 items-center rounded bg-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>

      <ConfirmationDialog
        open={confirmOpen}
        title={`Disconnect ${account.slug}?`}
        description="This clears all saved credentials, disables the courier, and resets its configuration. You will need to enter the credentials again to reconnect."
        variant="danger"
        confirmLabel="Disconnect"
        isPending={disconnectMutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleDisconnect()}
      />
    </div>
  )
}

export function CourierCredentialsCard() {
  const { data, isLoading, isError, error, refetch } = useCourierAccountsQuery()

  return (
    <section className="rounded-md border border-(--border-light) bg-(--bg-surface)">
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

      {isLoading && (
        <LoadingState className="px-4 py-10 text-center text-sm text-(--text-muted)">
          Loading courier accounts…
        </LoadingState>
      )}

      {isError && (
        <ErrorState
          message={`Failed to load courier accounts: ${getErrorMessage(error, "Unknown error")}`}
          onRetry={() => void refetch()}
          className="px-4 py-6 text-center text-sm text-(--status-cancelled-text)"
          buttonClassName="mt-2 rounded border border-(--border-light) bg-(--bg-surface) px-3 py-1.5 text-xs font-medium text-(--text-primary)"
        />
      )}

      {data && (
        <div className="space-y-3 p-4">
          {COURIERS.map((meta) => {
            const account = data.find((item) => item.slug === meta.slug)
            if (!account) return null
            return (
              <CourierAccountPanel
                key={account.slug}
                account={{ ...account, ...meta }}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
