import { useEffect } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield, Store, X, Plus } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { FormSegmentedControl } from "../settings/SettingsField"
import { PermissionMatrix } from "./PermissionMatrix"
import { useCreateRoleMutation } from "../../hooks/useAdminUsers"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { getErrorMessage } from "../../lib/errors"
import { ApiError } from "../../api/client"

function toRoleName(displayName: string) {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const createRoleSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required")
      .max(80)
      .regex(
        /^[\x20-\x7E]+$/,
        "Use English letters and standard ASCII characters only"
      ),
    scope: z.enum(["platform", "shop"]),
    description: z.string().trim().max(500),
    permissions: z
      .record(z.string(), z.array(z.string()))
      .refine(
        (p) => Object.keys(p).length > 0,
        "Grant at least one permission"
      ),
  })
  .superRefine(({ displayName }, ctx) => {
    const name = toRoleName(displayName)
    if (name.length < 3 || name.length > 50) {
      ctx.addIssue({
        code: "custom",
        path: ["displayName"],
        message:
          "Display name must produce an internal name between 3 and 50 characters",
      })
    }
  })

type CreateRoleFormValues = z.infer<typeof createRoleSchema>

const EMPTY: CreateRoleFormValues = {
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
  const scope = useWatch({ name: "scope", control })
  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open) return null

  async function onSubmit(values: CreateRoleFormValues) {
    try {
      await mutation.mutateAsync({
        displayName: values.displayName,
        scope: values.scope,
        description: values.description || undefined,
        permissions: values.permissions,
      })
      onSuccess(`Role "${values.displayName}" created.`)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const message =
          err.fieldErrors.displayName ??
          err.fieldErrors.name ??
          err.message ??
          "Failed to create role"
        setError("displayName", { type: "server", message })
      } else {
        setError("displayName", {
          type: "server",
          message: getErrorMessage(err, "Failed to create role"),
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
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Customer Support"
                className="text-xm block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                {...register("displayName")}
              />
              <p className="mt-1 text-xs text-(--text-muted)">
                Use English characters. The internal role name is generated
                automatically and cannot be changed.
              </p>
              {errors.displayName && (
                <FieldError>{errors.displayName.message}</FieldError>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
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
              <p className="mt-1 text-xs text-(--text-muted)">
                {scope === "platform"
                  ? "Platform roles operate globally across all shops and system settings."
                  : "Shop roles must be assigned to a shop. Platform roles operate across all shops."}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="What can this role do?"
                className="text-xm block w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
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
                  scope={scope}
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
              className="text-xm inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-xm inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
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
