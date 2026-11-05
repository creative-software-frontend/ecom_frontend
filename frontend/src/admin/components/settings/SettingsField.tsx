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
  "block w-full rounded-md bg-[var(--bg-app)] px-3 text-[13px] text-[var(--text-primary)] " +
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
        className="text-[12px] font-semibold text-(--text-primary)"
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
    <p className="mt-1 text-[11px] leading-relaxed text-(--text-muted)">
      {children}
    </p>
  )
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
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
              <span className="text-[11px] text-(--text-muted) tabular-nums">
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
