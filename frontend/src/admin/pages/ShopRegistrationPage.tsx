import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, Navigate } from "react-router"
import { z } from "zod"
import { AlertCircle, Loader2, Store } from "lucide-react"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthProvider"
import { PasswordShowHide } from "../components/PasswordShowHide"

const registrationSchema = z
  .object({
    shopName: z.string().trim().min(1, "Shop name is required").max(150),
    name: z.string().trim().min(1, "Your name is required").max(120),
    email: z.string().trim().email("Enter a valid email address"),
    mobile: z
      .string()
      .trim()
      .min(1, "Mobile number is required")
      .refine((value) => /^01[3-9]\d{8}$/.test(value), {
        message: "Enter a valid BD mobile number",
      }),
    address: z
      .string()
      .trim()
      .max(500, "Address must be 500 characters or fewer"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegistrationFormValues = z.input<typeof registrationSchema>

const REGISTRATION_ATTEMPT_LIMIT = 3
const REGISTRATION_WINDOW_MINUTES = 5
const REGISTRATION_RATE_LIMIT_STORAGE_KEY = "shop-registration-rate-limit-until"

function getStoredRateLimitSeconds(): number {
  try {
    const storedExpiry = window.localStorage.getItem(
      REGISTRATION_RATE_LIMIT_STORAGE_KEY
    )
    if (!storedExpiry) return 0

    const expiresAt = Number(storedExpiry)
    if (!Number.isFinite(expiresAt)) {
      window.localStorage.removeItem(REGISTRATION_RATE_LIMIT_STORAGE_KEY)
      return 0
    }

    const secondsLeft = Math.ceil((expiresAt - Date.now()) / 1000)
    if (secondsLeft <= 0) {
      window.localStorage.removeItem(REGISTRATION_RATE_LIMIT_STORAGE_KEY)
      return 0
    }
    return secondsLeft
  } catch (error) {
    console.error("Unable to restore the registration rate-limit timer", error)
    return 0
  }
}

function persistRateLimit(seconds: number) {
  try {
    window.localStorage.setItem(
      REGISTRATION_RATE_LIMIT_STORAGE_KEY,
      String(Date.now() + seconds * 1000)
    )
  } catch (error) {
    console.error("Unable to save the registration rate-limit timer", error)
  }
}

function clearPersistedRateLimit() {
  try {
    window.localStorage.removeItem(REGISTRATION_RATE_LIMIT_STORAGE_KEY)
  } catch (error) {
    console.error("Unable to clear the registration rate-limit timer", error)
  }
}

export default function ShopRegistrationPage() {
  const { state, requestRegistrationOtp, verifyRegistrationOtp, registerShop } =
    useAuth()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(getStoredRateLimitSeconds)
  const [step, setStep] = useState<"details" | "verify">("details")
  const [otp, setOtp] = useState("")
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null
  )

  useEffect(() => {
    if (secondsLeft <= 0) {
      clearPersistedRateLimit()
      return
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const isRateLimited = secondsLeft > 0
  const retryCountdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      shopName: "",
      name: "",
      email: "",
      mobile: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
  })

  if (state.status === "authenticated") {
    return (
      <Navigate
        to={
          state.user.role === "super_admin"
            ? "/admin/dashboard"
            : "/shop/dashboard"
        }
        replace
      />
    )
  }

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-(--bg-app) text-sm text-(--text-muted)"
        role="status"
      >
        Loading admin…
      </div>
    )
  }

  async function sendRegistrationOtp(email: string, mobile: string) {
    const result = await requestRegistrationOtp(email, mobile)
    setDevelopmentCode(result.developmentCode ?? null)
    setOtp("")
    setVerificationToken(null)
    setStep("verify")
    clearErrors("root")
  }

  async function submitRegistration(values: RegistrationFormValues) {
    try {
      if (step === "details") {
        await sendRegistrationOtp(values.email, values.mobile)
        return
      }

      const verifiedToken =
        verificationToken ??
        (await verifyRegistrationOtp(values.mobile, otp)).verificationToken
      setVerificationToken(verifiedToken)
      await registerShop({
        shopName: values.shopName,
        name: values.name,
        email: values.email,
        mobile: values.mobile,
        address: values.address || undefined,
        password: values.password,
        verificationToken: verifiedToken,
      })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 429) {
        const retryAfterSeconds =
          error.retryAfterSeconds ?? REGISTRATION_WINDOW_MINUTES * 60
        persistRateLimit(retryAfterSeconds)
        setSecondsLeft(retryAfterSeconds)
        clearErrors("root")
        return
      }

      if (error instanceof ApiError && error.fieldErrors) {
        const fieldNames = [
          "shopName",
          "name",
          "email",
          "mobile",
          "address",
          "password",
        ] as const
        let mappedFieldError = false
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          const fieldName = fieldNames.find((name) => name === field)
          if (fieldName) {
            setError(fieldName, {
              type: "server",
              message,
            })
            mappedFieldError = true
          } else {
            setError("root", { type: "server", message })
          }
        }
        if (mappedFieldError) {
          if (step === "verify") {
            setStep("details")
            setOtp("")
            setVerificationToken(null)
          }
          return
        }
      }

      setError("root", {
        type: "server",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to register your shop. Please try again.",
      })
    }
  }

  const inputClass =
    "block h-10 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm text-(--text-primary) outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60"
  const passwordInputClass = `${inputClass} pr-10`

  return (
    <main className="admin-root flex min-h-screen items-center justify-center bg-(--bg-app) px-4 py-8">
      <section className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-white">
            <Store className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-bold text-(--text-primary)">
              Power Zenox
            </p>
            <p className="text-xs text-(--text-muted)">Shop Admin</p>
          </div>
        </div>

        <div className="rounded-xl border border-(--border-light) bg-(--bg-surface) p-6 shadow-sm sm:p-8">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-(--text-primary)">
              Register your shop
            </h1>
            <p className="mt-2 text-sm text-(--text-muted)">
              Create your shop and owner account to start managing your store.
            </p>
          </header>

          {isRateLimited && (
            <div
              className="mb-5 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold">Too many attempts</p>
                <p className="mt-0.5">
                  Please try again in{" "}
                  <span className="font-semibold tabular-nums">
                    {retryCountdown}
                  </span>
                  . Your form data is still here.
                </p>
              </div>
            </div>
          )}

          {!isRateLimited && errors.root?.message && (
            <div
              className="mb-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0 text-red-600"
                aria-hidden="true"
              />
              <p>{errors.root.message}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(submitRegistration)}
            noValidate
            className="space-y-5"
          >
            {step === "details" ? (
              <fieldset
                disabled={isSubmitting || isRateLimited}
                className="space-y-5"
              >
                {/* <legend className="mb-3 text-sm font-semibold text-(--text-primary)">
                Shop information
              </legend> */}
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* shop name */}
                  <div>
                    <label
                      htmlFor="registration-shop-name"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Business name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("shopName")}
                      id="registration-shop-name"
                      autoComplete="organization"
                      placeholder="Enter Shop/Business Name"
                      className={inputClass}
                      aria-invalid={Boolean(errors.shopName)}
                      aria-describedby={
                        errors.shopName
                          ? "registration-shop-name-error"
                          : undefined
                      }
                    />
                    {errors.shopName?.message && (
                      <p
                        id="registration-shop-name-error"
                        className="mt-1 text-xs text-red-600"
                        role="alert"
                      >
                        {errors.shopName.message}
                      </p>
                    )}
                  </div>
                  {/* name */}
                  <div>
                    <label
                      htmlFor="registration-owner-name"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Your name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("name")}
                      id="registration-owner-name"
                      placeholder="Enter Your Name"
                      autoComplete="name"
                      className={inputClass}
                      aria-invalid={Boolean(errors.name)}
                    />
                    {errors.name?.message && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  {/* mobile */}
                  <div>
                    <label
                      htmlFor="registration-mobile"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Mobile number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("mobile")}
                      id="registration-mobile"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      className={inputClass}
                      aria-invalid={Boolean(errors.mobile)}
                    />
                    {errors.mobile?.message && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.mobile.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="registration-email"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("email")}
                      id="registration-email"
                      type="email"
                      placeholder="example@email.com"
                      autoComplete="email"
                      className={inputClass}
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email?.message && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
                {/* address */}
                <div>
                  <label
                    htmlFor="registration-address"
                    className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                  >
                    Address
                  </label>
                  <input
                    {...register("address")}
                    id="registration-address"
                    placeholder="Enter Your Full Address"
                    autoComplete="street-address"
                    className={inputClass}
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address?.message && (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {errors.address.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* password */}
                  <div>
                    <label
                      htmlFor="registration-password"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register("password")}
                        id="registration-password"
                        placeholder="Enter Your Password"
                        type={passwordVisible ? "text" : "password"}
                        autoComplete="new-password"
                        className={passwordInputClass}
                        aria-invalid={Boolean(errors.password)}
                      />
                      <PasswordShowHide
                        passwordVisible={passwordVisible}
                        setPasswordVisible={setPasswordVisible}
                      />
                    </div>
                    {errors.password?.message && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.password.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-(--text-muted)">
                      Use at least 12 characters.
                    </p>
                  </div>
                  {/* confirm password */}
                  <div>
                    <label
                      htmlFor="registration-confirm-password"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Confirm password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register("confirmPassword")}
                        id="registration-confirm-password"
                        placeholder="Confirm Your Password"
                        type={confirmPasswordVisible ? "text" : "password"}
                        autoComplete="new-password"
                        className={passwordInputClass}
                        aria-invalid={Boolean(errors.confirmPassword)}
                      />
                      <PasswordShowHide
                        passwordVisible={confirmPasswordVisible}
                        setPasswordVisible={setConfirmPasswordVisible}
                      />
                    </div>
                    {errors.confirmPassword?.message && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>
            ) : (
              <section
                className="space-y-5"
                aria-labelledby="mobile-verify-title"
              >
                <div>
                  <h2
                    id="mobile-verify-title"
                    className="text-sm font-semibold text-(--text-primary)"
                  >
                    Verify your mobile number
                  </h2>
                  <p className="mt-1 text-sm text-(--text-muted)">
                    Enter the 6-digit code for{" "}
                    <span className="font-medium text-(--text-primary)">
                      {getValues("mobile")}
                    </span>
                    .
                  </p>
                </div>

                {developmentCode && (
                  <div
                    className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
                    role="status"
                  >
                    Development code (SMS delivery is not configured):{" "}
                    <strong className="font-mono tabular-nums">
                      {developmentCode}
                    </strong>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="registration-mobile-otp"
                    className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                  >
                    Verification code
                  </label>
                  <input
                    id="registration-mobile-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    disabled={isSubmitting || isRateLimited}
                    className={inputClass}
                    aria-label="6-digit mobile verification code"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    disabled={isSubmitting || isRateLimited}
                    onClick={() => {
                      setStep("details")
                      setOtp("")
                      setDevelopmentCode(null)
                      setVerificationToken(null)
                      clearErrors("root")
                    }}
                    className="font-medium text-(--primary) hover:underline disabled:opacity-60"
                  >
                    Change details
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || isRateLimited}
                    onClick={async () => {
                      try {
                        await sendRegistrationOtp(
                          getValues("email"),
                          getValues("mobile")
                        )
                      } catch (error: unknown) {
                        if (error instanceof ApiError && error.status === 429) {
                          const retryAfterSeconds =
                            error.retryAfterSeconds ??
                            REGISTRATION_WINDOW_MINUTES * 60
                          persistRateLimit(retryAfterSeconds)
                          setSecondsLeft(retryAfterSeconds)
                          clearErrors("root")
                          return
                        }

                        setError("root", {
                          type: "server",
                          message:
                            error instanceof ApiError
                              ? error.message
                              : "Unable to send a verification code. Please try again.",
                        })
                      }
                    }}
                    className="font-medium text-(--primary) hover:underline disabled:opacity-60"
                  >
                    Resend code
                  </button>
                </div>
              </section>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isRateLimited ||
                (step === "verify" && otp.length !== 6)
              }
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--primary-hover) focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Please wait...
                </>
              ) : isRateLimited ? (
                `Try again in ${retryCountdown}`
              ) : step === "details" ? (
                "Create shop account"
              ) : verificationToken ? (
                "Create shop account"
              ) : (
                "Verify mobile and create account"
              )}
            </button>

            <p className="text-center text-xs text-(--text-muted)">
              Only {REGISTRATION_ATTEMPT_LIMIT} registration attempts are
              allowed every {REGISTRATION_WINDOW_MINUTES} minutes.
            </p>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-(--text-muted)">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-(--primary) hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
