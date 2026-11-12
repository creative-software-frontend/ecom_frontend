import { Pencil } from "lucide-react"
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react"
import { forwardRef } from "react"

/* ================================================================
   Shared field styling
   ================================================================ */

const fieldBase =
  "block w-full rounded-md bg-[var(--bg-app)] px-3 text-sm text-[var(--text-primary)] " +
  "border border-transparent outline-none transition-all placeholder:text-[var(--text-muted)] " +
  "hover:border-[var(--border-hover)] " +
  "focus:border-[var(--primary)] focus:bg-[var(--bg-surface)] focus:ring-2 focus:ring-[var(--primary)]/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60"

const fieldErrorStyle =
  "border-red-300 bg-red-50 hover:border-red-400 " +
  "focus:border-red-500 focus:ring-red-500/20"

/* ================================================================
   FieldLabel
   ================================================================ */

export function FieldLabel({
  htmlFor,
  children,
  required,
  rightSlot,
}: {
  htmlFor: string
  children: ReactNode
  required?: boolean
  rightSlot?: ReactNode
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold text-(--text-primary)"
      >
        {children}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {rightSlot}
    </div>
  )
}

/* ================================================================
   FieldHelp / FieldError
   ================================================================ */

export function FieldHelp({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 text-xs leading-relaxed text-(--text-muted)">
      {children}
    </p>
  )
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
      <span className="inline-block size-1.5 rounded-full bg-red-500" />
      {children}
    </p>
  )
}

/* ================================================================
   FormField — text / email / tel / url / number
   ================================================================ */

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  help?: string
  icon?: ReactNode
  rightSlot?: ReactNode
  required?: boolean
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField(
    { label, error, help, icon, rightSlot, required, id, className, ...rest },
    ref
  ) {
    const inputId = id ?? `field-${rest.name ?? label}`
    const hasError = Boolean(error)
    return (
      <div>
        <FieldLabel htmlFor={inputId} required={required} rightSlot={rightSlot}>
          {label}
        </FieldLabel>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-muted)">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${fieldBase} ${hasError ? fieldErrorStyle : ""} ${
              icon ? "pl-9" : ""
            } h-9 ${className ?? ""}`}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            {...rest}
          />
        </div>
        {hasError && <FieldError>{error}</FieldError>}
        {help && !hasError && <FieldHelp>{help}</FieldHelp>}
      </div>
    )
  }
)

/* ================================================================
   FormTextarea
   ================================================================ */

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
  help?: string
  required?: boolean
  showCounter?: boolean
  maxLength?: number
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    {
      label,
      error,
      help,
      required,
      showCounter,
      maxLength,
      value,
      id,
      className,
      ...rest
    },
    ref
  ) {
    const inputId = id ?? `field-${rest.name ?? label}`
    const hasError = Boolean(error)
    const length = typeof value === "string" ? value.length : 0

    return (
      <div>
        <FieldLabel
          htmlFor={inputId}
          required={required}
          rightSlot={
            showCounter && maxLength ? (
              <span className="text-xs text-(--text-muted) tabular-nums">
                {length}/{maxLength}
              </span>
            ) : undefined
          }
        >
          {label}
        </FieldLabel>
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={`${fieldBase} ${hasError ? fieldErrorStyle : ""} min-h-20 resize-y py-2 ${
            className ?? ""
          }`}
          aria-invalid={hasError}
          {...rest}
        />
        {hasError && <FieldError>{error}</FieldError>}
        {help && !hasError && <FieldHelp>{help}</FieldHelp>}
      </div>
    )
  }
)

/* ================================================================
   FormRow — 2-column responsive grid
   ================================================================ */

export function FormRow({
  children,
  cols = 2,
}: {
  children: ReactNode
  cols?: 1 | 2
}) {
  return (
    <div
      className={`grid gap-4 ${cols === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
    >
      {children}
    </div>
  )
}

/* ================================================================
   FormToggle
   ================================================================ */

export function FormToggle({
  checked,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  "aria-label"?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-(--border-hover)"
      }`}
    >
      <span
        className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

/* ================================================================
   FormColorPicker
   ================================================================ */

export function FormColorPicker({
  label,
  hint,
  value,
  onChange,
  onReset,
  error,
}: {
  label: string
  hint?: string
  value: string
  onChange: (hex: string) => void
  onReset?: () => void
  error?: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold text-(--text-primary)">
          {label}
        </label>
        {hint && (
          <span className="text-xs text-(--text-muted)">{hint}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="peer absolute inset-0 cursor-pointer opacity-0 ring"
            aria-label={`${label} color picker`}
          />
          <span
            className="flex size-9 items-center justify-center rounded-md border border-(--border-light) transition-shadow peer-focus-visible:ring-2 peer-focus-visible:ring-(--primary)/40"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          >
            <Pencil className="size-3 text-white mix-blend-difference" />
          </span>
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          maxLength={7}
          className="h-9 flex-1 rounded-md border border-transparent bg-(--bg-app) px-3 font-mono text-sm text-(--text-primary) transition-all outline-none hover:border-(--border-hover) focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
          aria-invalid={Boolean(error)}
        />
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="h-9 shrink-0 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
          >
            Reset
          </button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

/* ================================================================
   FormUnitField — number input with prefix/suffix (৳ / min / %)
   Used by delivery charges and future coupon discount fields.
   ================================================================ */

type FormUnitFieldSlot = string | number | ReactNode | null

type FormUnitFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  help?: string
  hint?: string
  badge?: ReactNode
  leadingSlot?: FormUnitFieldSlot
  trailingSlot?: FormUnitFieldSlot
}

export const FormUnitField = forwardRef<HTMLInputElement, FormUnitFieldProps>(
  function FormUnitField(
    {
      label,
      error,
      help,
      hint,
      badge,
      leadingSlot,
      trailingSlot,
      id,
      className,
      ...rest
    },
    ref
  ) {
    const inputId = id ?? `field-${rest.name ?? label}`
    const hasError = Boolean(error)

    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-(--text-primary)"
          >
            {label}
          </label>
          {(hint || badge) && (
            <span className="shrink-0 text-xs text-(--text-muted)">
              {badge ?? hint}
            </span>
          )}
        </div>
        <div className="relative">
          {leadingSlot && (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-(--text-muted)">
              {leadingSlot}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${fieldBase} ${hasError ? fieldErrorStyle : ""} h-9 text-right tabular-nums ${
              leadingSlot ? "pl-8" : "pl-3"
            } ${trailingSlot ? "pr-10" : "pr-3"} ${className ?? ""}`}
            aria-invalid={hasError}
            {...rest}
          />
          {trailingSlot && (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-(--text-muted)">
              {trailingSlot}
            </span>
          )}
        </div>
        {hasError && <FieldError>{error}</FieldError>}
        {help && !hasError && <FieldHelp>{help}</FieldHelp>}
      </div>
    )
  }
)

/* ================================================================
   FormSegmentedControl — 2/3-way pill switch
   Used by coupon discount type, and future Marketing/Pixel toggles.
   ================================================================ */

type SegmentOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
}

type FormSegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (next: T) => void
  disabled?: boolean
  "aria-label"?: string
}

export function FormSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
}: FormSegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid gap-1 rounded-md bg-(--bg-surface-hover) p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isActive
                ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
                : "text-(--text-muted) hover:text-(--text-primary)"
            }`}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
