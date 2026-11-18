import { useState } from "react"
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
      .refine((value) => !value || /^01[3-9]\d{8}$/.test(value), {
        message: "Enter a valid BD mobile number",
      }),
    address: z.string().trim().max(500, "Address must be 500 characters or fewer"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegistrationFormValues = z.input<typeof registrationSchema>

export default function ShopRegistrationPage() {
  const { state, registerShop } = useAuth()
  const [passwordVisible, setPasswordVisible] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
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

  async function submitRegistration(values: RegistrationFormValues) {
    try {
      await registerShop({
        shopName: values.shopName,
        name: values.name,
        email: values.email,
        mobile: values.mobile || undefined,
        address: values.address || undefined,
        password: values.password,
      })
    } catch (error: unknown) {
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
        if (mappedFieldError) return
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

          {errors.root?.message && (
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
            <fieldset disabled={isSubmitting} className="space-y-5">
              <legend className="mb-3 text-sm font-semibold text-(--text-primary)">
                Shop information
              </legend>
              <div>
                <label
                  htmlFor="registration-shop-name"
                  className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                >
                  Shop name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("shopName")}
                  id="registration-shop-name"
                  autoComplete="organization"
                  className={inputClass}
                  aria-invalid={Boolean(errors.shopName)}
                  aria-describedby={
                    errors.shopName ? "registration-shop-name-error" : undefined
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="registration-mobile"
                    className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                  >
                    Mobile number
                  </label>
                  <input
                    {...register("mobile")}
                    id="registration-mobile"
                    type="tel"
                    autoComplete="tel"
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
              </div>

              <div className="border-t border-(--border-light) pt-5">
                <p className="mb-3 text-sm font-semibold text-(--text-primary)">
                  Owner account
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
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
                        type={passwordVisible ? "text" : "password"}
                        autoComplete="new-password"
                        className={passwordInputClass}
                        aria-invalid={Boolean(errors.confirmPassword)}
                      />
                      <PasswordShowHide
                        passwordVisible={passwordVisible}
                        setPasswordVisible={setPasswordVisible}
                      />
                    </div>
                    {errors.confirmPassword?.message && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--primary-hover) focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Creating your shop...
                </>
              ) : (
                "Create shop account"
              )}
            </button>
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
