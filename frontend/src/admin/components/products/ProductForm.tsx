import { useEffect, useRef, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { ApiError } from "../../api/client"
import {
  productSchema,
  type ProductFormInitialValues,
  type ProductFormValues,
} from "../../schemas/productSchema"

const defaultValues: Partial<ProductFormValues> = {
  name: "",
  brandName: "",
  category: "",
  slug: "",
  stockQuantity: 0,
  isActive: true,
  images: [],
}

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="admin-form-error" role="alert">
      {message}
    </p>
  )
}

function ImagePreview({ src, index }: { src: string; index: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div
        className="admin-product-image-preview admin-product-image-fallback"
        aria-label="Image preview unavailable"
      >
        Image preview
      </div>
    )
  }

  return (
    <img
      className="admin-product-image-preview"
      src={src}
      alt={`Product image ${index + 1} preview`}
      onError={() => setFailedSrc(src)}
    />
  )
}

type ProductFormProps = {
  initialValues?: ProductFormInitialValues
  mode: "create" | "edit"
  onSubmit: (values: ProductFormValues) => Promise<void> | void
  submitLabel: string
  onCancel: () => void
}

export function ProductForm({
  initialValues,
  mode,
  onSubmit,
  submitLabel,
  onCancel,
}: ProductFormProps) {
  const slugEdited = useRef(false)
  const {
    control,
    register,
    setValue,
    setError,
    clearErrors,
    trigger,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialValues ?? defaultValues,
  })
  const { fields, append, move, remove } = useFieldArray({
    control,
    name: "images",
  })
  const [newImage, setNewImage] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const name = useWatch({ control, name: "name" }) ?? ""
  const regularPrice = useWatch({ control, name: "regularPrice" }) ?? 0
  const currentPrice = useWatch({ control, name: "currentPrice" }) ?? 0
  const stockQuantity = useWatch({ control, name: "stockQuantity" }) ?? 0
  const watchedImages = useWatch({ control, name: "images" }) ?? []
  const generatedSlug = createSlug(name)
  const discountPercent =
    Number.isFinite(regularPrice) &&
    regularPrice > 0 &&
    Number.isFinite(currentPrice)
      ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100)
      : 0
  const inStock = Number.isFinite(stockQuantity) && stockQuantity > 0
  const slugHelp =
    mode === "edit"
      ? "Changing the slug changes the product's public URL."
      : name.trim() && !generatedSlug
        ? "This name has no Latin letters. Enter a slug manually."
        : "Generated from Latin letters in the name; Bengali-only names need a manual slug."
  const slugRegistration = register("slug")
  const imageError = errors.images?.message
  const isActiveRegistration = register("isActive")

  const submitForm = async (values: ProductFormValues) => {
    setSubmitError(null)
    clearErrors()

    try {
      await onSubmit(values)
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setError("slug", {
            type: "server",
            message: error.fieldErrors?.slug ?? error.message,
          })
          return
        }

        const setters: Record<string, (message: string) => void> = {
          name: (message) => setError("name", { type: "server", message }),
          brandName: (message) =>
            setError("brandName", { type: "server", message }),
          category: (message) =>
            setError("category", { type: "server", message }),
          slug: (message) => setError("slug", { type: "server", message }),
          regularPrice: (message) =>
            setError("regularPrice", { type: "server", message }),
          currentPrice: (message) =>
            setError("currentPrice", { type: "server", message }),
          stockQuantity: (message) =>
            setError("stockQuantity", { type: "server", message }),
          images: (message) => setError("images", { type: "server", message }),
          isActive: (message) =>
            setError("isActive", { type: "server", message }),
        }
        let mappedFieldError = false
        let unmappedFieldError = false
        for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
          const setter = setters[field]
          if (setter) {
            setter(message)
            mappedFieldError = true
          } else {
            unmappedFieldError = true
          }
        }
        if (mappedFieldError && !unmappedFieldError) return

        setSubmitError(error.message)
        return
      }

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not save this product. Please try again."
      )
    }
  }

  useEffect(() => {
    if (mode === "create" && !slugEdited.current) {
      setValue("slug", generatedSlug)
    }
  }, [generatedSlug, mode, setValue])

  useEffect(() => {
    if (!isDirty) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [isDirty])

  return (
    <div className="admin-dashboard-content min-w-0 p-4 md:p-[30px]">
      <header className="admin-page-title flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            {mode === "create" ? "Add product" : "Edit product"}
          </h1>
          <p className="pt-[3px] text-base text-gray-500">
            {mode === "create"
              ? "Enter product details for your catalog"
              : "Update product details for your catalog"}
          </p>
        </div>
        {mode === "edit" && initialValues ? (
          <dl className="grid gap-x-4 gap-y-1 text-sm text-gray-500 sm:grid-cols-3">
            {initialValues.id ? (
              <div>
                <dt className="font-medium text-gray-700">ID</dt>
                <dd>{initialValues.id}</dd>
              </div>
            ) : null}
            {initialValues.createdAt ? (
              <div>
                <dt className="font-medium text-gray-700">Created</dt>
                <dd>
                  {new Intl.DateTimeFormat("en-BD", {
                    dateStyle: "medium",
                  }).format(new Date(initialValues.createdAt))}
                </dd>
              </div>
            ) : null}
            {initialValues.updatedAt ? (
              <div>
                <dt className="font-medium text-gray-700">Updated</dt>
                <dd>
                  {new Intl.DateTimeFormat("en-BD", {
                    dateStyle: "medium",
                  }).format(new Date(initialValues.updatedAt))}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </header>

      <form
        className="space-y-6"
        noValidate
        onSubmit={handleSubmit(submitForm)}
      >
        {submitError ? (
          <p
            className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <section
          className="admin-dashboard-card overflow-hidden bg-white"
          aria-labelledby="product-basic-info"
        >
          <div className="admin-form-card-header">
            <h2 id="product-basic-info" className="text-base font-semibold">
              Basic info
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-4 md:grid-cols-2 md:p-6">
            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="product-name">
                Name
              </label>
              <input
                {...register("name")}
                id="product-name"
                className="admin-form-control"
                autoComplete="off"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "product-name-error" : undefined
                }
              />
              <FieldError
                id="product-name-error"
                message={errors.name?.message}
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="product-brand">
                Brand name
              </label>
              <input
                {...register("brandName")}
                id="product-brand"
                className="admin-form-control"
                autoComplete="off"
                aria-invalid={Boolean(errors.brandName)}
                aria-describedby={
                  errors.brandName ? "product-brand-error" : undefined
                }
              />
              <FieldError
                id="product-brand-error"
                message={errors.brandName?.message}
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="product-category">
                Category
              </label>
              <input
                {...register("category")}
                id="product-category"
                className="admin-form-control"
                autoComplete="off"
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? "product-category-error" : undefined
                }
              />
              <FieldError
                id="product-category-error"
                message={errors.category?.message}
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="product-slug">
                Slug
              </label>
              <input
                {...slugRegistration}
                id="product-slug"
                className="admin-form-control"
                autoComplete="off"
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={`product-slug-help${errors.slug ? " product-slug-error" : ""}`}
                onChange={(event) => {
                  slugEdited.current = true
                  void slugRegistration.onChange(event)
                }}
              />
              <p id="product-slug-help" className="admin-form-help">
                {slugHelp}
              </p>
              <FieldError
                id="product-slug-error"
                message={errors.slug?.message}
              />
            </div>
          </div>
        </section>

        <section
          className="admin-dashboard-card overflow-hidden bg-white"
          aria-labelledby="product-pricing"
        >
          <div className="admin-form-card-header">
            <h2 id="product-pricing" className="text-base font-semibold">
              Pricing
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-4 md:grid-cols-2 md:p-6">
            <div className="admin-form-field">
              <label
                className="admin-form-label"
                htmlFor="product-regular-price"
              >
                Regular price
              </label>
              <input
                {...register("regularPrice", { valueAsNumber: true })}
                id="product-regular-price"
                type="number"
                min={1}
                step={1}
                className="admin-form-control"
                aria-invalid={Boolean(errors.regularPrice)}
                aria-describedby={
                  errors.regularPrice
                    ? "product-regular-price-error"
                    : undefined
                }
              />
              <FieldError
                id="product-regular-price-error"
                message={errors.regularPrice?.message}
              />
            </div>

            <div className="admin-form-field">
              <label
                className="admin-form-label"
                htmlFor="product-current-price"
              >
                Current price
              </label>
              <input
                {...register("currentPrice", { valueAsNumber: true })}
                id="product-current-price"
                type="number"
                min={1}
                step={1}
                className="admin-form-control"
                aria-invalid={Boolean(errors.currentPrice)}
                aria-describedby={
                  errors.currentPrice
                    ? "product-current-price-error"
                    : undefined
                }
              />
              <FieldError
                id="product-current-price-error"
                message={errors.currentPrice?.message}
              />
            </div>

            <div className="admin-form-field md:col-span-2">
              <label className="admin-form-label" htmlFor="product-discount">
                Discount percent
              </label>
              <input
                id="product-discount"
                type="number"
                className="admin-form-control admin-form-control--readonly"
                value={discountPercent}
                readOnly
                aria-readonly="true"
              />
              <p className="admin-form-help">
                Calculated from regular and current prices.
              </p>
            </div>
          </div>
        </section>

        <section
          className="admin-dashboard-card overflow-hidden bg-white"
          aria-labelledby="product-inventory"
        >
          <div className="admin-form-card-header">
            <h2 id="product-inventory" className="text-base font-semibold">
              Inventory
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-4 md:grid-cols-2 md:p-6">
            <div className="admin-form-field">
              <label
                className="admin-form-label"
                htmlFor="product-stock-quantity"
              >
                Stock quantity
              </label>
              <input
                {...register("stockQuantity", { valueAsNumber: true })}
                id="product-stock-quantity"
                type="number"
                min={0}
                step={1}
                className="admin-form-control"
                aria-invalid={Boolean(errors.stockQuantity)}
                aria-describedby={
                  errors.stockQuantity ? "product-stock-error" : undefined
                }
              />
              <FieldError
                id="product-stock-error"
                message={errors.stockQuantity?.message}
              />
            </div>
            <div className="admin-form-field">
              <span className="admin-form-label">In stock</span>
              <span
                className={`admin-product-stock ${inStock ? "admin-product-stock--in" : "admin-product-stock--out"}`}
                aria-live="polite"
              >
                {inStock ? "In stock" : "Out of stock"}
              </span>
            </div>
            <div className="admin-form-field md:col-span-2">
              <label
                className="flex items-center gap-3 text-sm text-gray-700"
                htmlFor="product-is-active"
              >
                <input
                  {...isActiveRegistration}
                  id="product-is-active"
                  type="checkbox"
                  role="switch"
                  className="h-4 w-4 accent-[#3f6ad8]"
                  aria-invalid={Boolean(errors.isActive)}
                  aria-describedby={
                    errors.isActive ? "product-active-error" : undefined
                  }
                />
                Active (visible on the public site)
              </label>
              <FieldError
                id="product-active-error"
                message={errors.isActive?.message}
              />
            </div>
          </div>
        </section>

        <section
          className="admin-dashboard-card overflow-hidden bg-white"
          aria-labelledby="product-images"
        >
          <div className="admin-form-card-header">
            <h2 id="product-images" className="text-base font-semibold">
              Images
            </h2>
          </div>
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="sm:mb-0! admin-form-field">
                <label className="admin-form-label" htmlFor="product-image-url">
                  Add image by URL or path
                </label>
                <input
                  id="product-image-url"
                  type="text"
                  className="admin-form-control"
                  value={newImage}
                  onChange={(event) => setNewImage(event.currentTarget.value)}
                  onBlur={() => void trigger("images")}
                  placeholder="/images/products/example.webp"
                  aria-invalid={Boolean(imageError)}
                  aria-describedby={
                    imageError ? "product-images-error" : undefined
                  }
                />
              </div>
              <button
                type="button"
                className="admin-template-button admin-template-button--secondary"
                disabled={!newImage.trim()}
                onClick={() => {
                  const image = newImage.trim()
                  if (image) {
                    append({ src: image })
                    setNewImage("")
                    void trigger("images")
                  }
                }}
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add image
              </button>
            </div>

            <FieldError id="product-images-error" message={imageError} />

            <ul className="space-y-3" aria-label="Product images">
              {fields.map((field, index) => {
                const imageRegistration = register(`images.${index}.src`)
                return (
                  <li
                    key={field.id}
                    className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 rounded border border-(--admin-form-control-border) p-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]"
                  >
                    <div className="relative">
                      <ImagePreview
                        src={watchedImages?.[index]?.src ?? ""}
                        index={index}
                      />
                      {index === 0 ? (
                        <span className="admin-product-primary-badge">
                          Primary
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <label
                        className="admin-form-label"
                        htmlFor={`product-image-${index}`}
                      >
                        Image {index + 1} path
                      </label>
                      <input
                        {...imageRegistration}
                        id={`product-image-${index}`}
                        type="text"
                        className="admin-form-control"
                        aria-invalid={Boolean(errors.images?.[index]?.src)}
                        aria-describedby={
                          errors.images?.[index]?.src?.message
                            ? `product-image-${index}-error`
                            : undefined
                        }
                        onBlur={(event) => {
                          void imageRegistration.onBlur(event)
                          void trigger("images")
                        }}
                      />
                      <FieldError
                        id={`product-image-${index}-error`}
                        message={errors.images?.[index]?.src?.message}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                      <button
                        type="button"
                        className="admin-icon-button"
                        aria-label={`Move image ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                      >
                        <ArrowUp aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button"
                        aria-label={`Move image ${index + 1} down`}
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, index + 1)}
                      >
                        <ArrowDown aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button admin-icon-button--danger"
                        aria-label={`Remove image ${index + 1}`}
                        onClick={() => {
                          remove(index)
                          void trigger("images")
                        }}
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="admin-template-button admin-template-button--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-template-button admin-template-button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? mode === "create"
                ? "Adding product..."
                : "Saving product..."
              : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
