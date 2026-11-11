import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield, Store, X, Plus } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { FormSegmentedControl } from "../settings/SettingsField"
import { PermissionMatrix } from "./PermissionMatrix"
import { useCreateRoleMutation } from "../../hooks/useAdminUsers"
import { ApiError } from "../../api/client"

const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Minimum 3 characters")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscore only"),
  displayName: z.string().trim().min(1, "Display name is required").max(80),
  scope: z.enum(["platform", "shop"]),
  description: z.string().trim().max(500),
  permissions: z
    .record(z.string(), z.array(z.string()))
    .refine((p) => Object.keys(p).length > 0, "Grant at least one permission"),
})

type CreateRoleFormValues = z.infer<typeof createRoleSchema>

const EMPTY: CreateRoleFormValues = {
  name: "",
  displayName: "",
  scope: "shop",
  description: "",
  permissions: {},
}

type CreateRoleModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function CreateRoleModal({
  open,
  onClose,
  onSuccess,
}: CreateRoleModalProps) {
  const mutation = useCreateRoleMutation()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose()
    }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [open, isSubmitting, onClose])

  if (!open) return null

  async function onSubmit(values: CreateRoleFormValues) {
    try {
      await mutation.mutateAsync({
        name: values.name,
        displayName: values.displayName,
        scope: values.scope,
        description: values.description || undefined,
        permissions: values.permissions,
      })
      onSuccess(`Role "${values.displayName}" created.`)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        let mapped = false
        for (const [field, msg] of Object.entries(err.fieldErrors)) {
          if (field === "name") {
            setError("name", { type: "server", message: msg })
            mapped = true
          } else if (field === "displayName") {
            setError("displayName", { type: "server", message: msg })
            mapped = true
          }
        }
        if (!mapped) {
          setError("name", {
            type: "server",
            message: err.message || "Failed to create role",
          })
        }
      } else {
        setError("name", {
          type: "server",
          message:
            err instanceof ApiError ? err.message : "Failed to create role",
        })
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-role-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
              <Plus className="size-4" />
            </span>
            <h2
              id="create-role-title"
              className="text-sm font-semibold text-(--text-primary)"
            >
              Create role
            </h2>
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-(--text-primary)">
                  Internal name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. customer_support"
                  className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 font-mono text-[13px] transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                  {...register("name")}
                />
                <p className="mt-1 text-[10px] text-(--text-muted)">
                  Lowercase letters, numbers, underscore only. Cannot be changed
                  after creation.
                </p>
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-(--text-primary)">
                  Display name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer Support"
                  className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-[13px] transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                  {...register("displayName")}
                />
                {errors.displayName && (
                  <FieldError>{errors.displayName.message}</FieldError>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-(--text-primary)">
                Scope <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <FormSegmentedControl
                    aria-label="Role scope"
                    options={[
                      {
                        value: "shop",
                        label: "Shop",
                        icon: <Store className="size-3.5" />,
                      },
                      {
                        value: "platform",
                        label: "Platform",
                        icon: <Shield className="size-3.5" />,
                      },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <p className="mt-1 text-[10px] text-(--text-muted)">
                Shop roles must be assigned to a shop. Platform roles operate
                across all shops.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-(--text-primary)">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="What can this role do?"
                className="block w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-[13px] transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                {...register("description")}
              />
              {errors.description && (
                <FieldError>{errors.description.message}</FieldError>
              )}
            </div>

            <Controller
              control={control}
              name="permissions"
              render={({ field }) => (
                <PermissionMatrix
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.permissions && (
              <FieldError>
                {errors.permissions?.message as string | undefined}
              </FieldError>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              {isSubmitting ? "Creating..." : "Create role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
