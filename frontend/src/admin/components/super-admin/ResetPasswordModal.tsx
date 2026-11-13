import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import type { SuperAdminUser } from "../../types/superAdmin"
import { PasswordShowHide } from "../PasswordShowHide"
import { useEscapeKey } from "../../hooks/useEscapeKey"

const resetPasswordSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters"),
  confirmPassword: z.string().min(1, "Please confirm the new password"),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
type ResetPasswordStep = "request" | "verify" | "password"

type ResetPasswordModalProps = {
  open: boolean
  user: SuperAdminUser | null
  onClose: () => void
}

export function ResetPasswordModal({
  open,
  user,
  onClose,
}: ResetPasswordModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)
  const [step, setStep] = useState<ResetPasswordStep>("request")
  const [otp, setOtp] = useState("")
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null)

  // Reset form state each time modal opens (or target user changes).
  useEffect(() => {
    if (open) {
      reset({ password: "", confirmPassword: "" })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("request")
      setOtp("")
      setSubmissionNotice(null)
    }
  }, [open, user?.id, reset])

  // Escape closes
  useEscapeKey(onClose, open && !isSubmitting)

  if (!open || !user) return null

  function onSubmit() {
    setSubmissionNotice(
      "UI preview only. The password was not changed."
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-pw-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-(--border-light) px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-(--status-pending-bg) text-(--status-pending-text)">
              <KeyRound className="size-4" />
            </span>
            <div>
              <h2
                id="reset-pw-title"
                className="text-sm font-semibold text-(--text-primary)"
              >
                Reset password
              </h2>
              <p className="text-xs text-(--text-muted)">
                Set a new password for {user.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-5 py-4">
            <ol className="mb-5 grid grid-cols-3 gap-2" aria-label="Reset password steps">
              {[
                { key: "request", label: "Send OTP" },
                { key: "verify", label: "Verify OTP" },
                { key: "password", label: "New password" },
              ].map((item, index) => {
                const stepIndex = ["request", "verify", "password"].indexOf(step)
                const isComplete = index < stepIndex
                const isCurrent = index === stepIndex
                return (
                  <li
                    key={item.key}
                    className={`border-b-2 pb-2 text-center text-[11px] font-medium ${
                      isCurrent
                        ? "border-primary text-primary"
                        : isComplete
                          ? "border-(--status-delivered-text) text-(--status-delivered-text)"
                          : "border-(--border-light) text-(--text-muted)"
                    }`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {item.label}
                  </li>
                )
              })}
            </ol>
            <p className="mb-4 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 px-3 py-2 text-xs text-(--status-pending-text)">
              UI preview only: OTP and password actions are not connected.
            </p>

            {step === "request" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-md border border-(--border-light) bg-(--bg-app) p-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-(--text-muted)" />
                  <div>
                    <p className="text-xs font-medium text-(--text-primary)">
                      Send a one-time code
                    </p>
                    <p className="mt-1 text-xs text-(--text-muted)">
                      A verification code will be sent to {user.email}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("verify")}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover)"
                >
                  <Mail className="size-4" />
                  Send OTP
                </button>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-md border border-(--border-light) bg-(--bg-app) p-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-(--text-muted)" />
                  <div>
                    <p className="text-xs font-medium text-(--text-primary)">
                      Check the email address
                    </p>
                    <p className="mt-1 text-xs text-(--text-muted)">
                      Enter the 6-digit code sent to {user.email}.
                    </p>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="reset-pw-otp"
                    className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                  >
                    One-time password
                  </label>
                  <input
                    id="reset-pw-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    className="block h-10 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-center font-mono text-lg tracking-[0.4em] text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                  />
                </div>
                <button
                  type="button"
                  disabled={otp.length !== 6}
                  onClick={() => setStep("password")}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShieldCheck className="size-4" />
                  Verify OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtp("")
                    setSubmissionNotice(null)
                  }}
                  className="w-full text-center text-xs font-medium text-primary hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            )}

            {step === "password" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-3 py-2 text-xs text-(--status-delivered-text)">
                  <CheckCircle2 className="size-4 shrink-0" />
                  OTP step complete (preview)
                </div>

                <div>
                  <label
                    htmlFor="reset-pw-input"
                    className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="reset-pw-input"
                      type={passwordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 12 characters"
                      className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                      aria-invalid={Boolean(errors.password)}
                      {...register("password")}
                    />
                    <PasswordShowHide
                      passwordVisible={passwordVisible}
                      setPasswordVisible={setPasswordVisible}
                    />
                  </div>
                  {errors.password && (
                    <FieldError>{errors.password.message}</FieldError>
                  )}
                  <p className="mt-1 text-xs text-(--text-muted)">
                    Use at least 12 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reset-pw-confirm"
                    className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="reset-pw-confirm"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter the new password"
                    className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <FieldError>{errors.confirmPassword.message}</FieldError>
                  )}
                </div>
              </div>
            )}

            {submissionNotice && (
              <p
                className="mt-4 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 px-3 py-2 text-xs text-(--status-pending-text)"
                role="status"
              >
                {submissionNotice}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            {step === "password" && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
              >
                <>
                  <KeyRound className="size-3.5" />
                  Submit
                </>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
