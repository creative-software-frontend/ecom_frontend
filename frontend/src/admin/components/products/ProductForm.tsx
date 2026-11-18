import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Tag,
  Hash,
  Layers,
  Search,
  Image as ImageIcon,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react"
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "../../schemas/productSchema"
import { SettingsCard } from "../settings/SettingsLayout"
import {
  FormField,
  FormTextarea,
  FormToggle,
  FieldError,
} from "../settings/SettingsField"
import { RichTextToolbar } from "../settings/RichTextToolbar"
import type { ShopOption } from "@/admin/types/superAdminProduct"
import { ShopSelectorCard } from "../super-admin/ShopSelectorCard"

type ProductFormProps = {
  initialValues?: Partial<ProductFormValues>
  mode: "create" | "edit"
  onSubmit: (values: ProductFormValues) => Promise<void> | void
  submitLabel: string
  onCancel: () => void
  isSubmitting?: boolean
  variant?: "shop" | "super"
  shops?: ShopOption[]
  /** When true, shop selector is read-only (edit mode). */
  shopSelectorLocked?: boolean
}

export function ProductForm({
  initialValues,
  mode,
  onSubmit,
  submitLabel,
  onCancel,
  isSubmitting = false,
  variant = "shop",
  shops = [],
  shopSelectorLocked = false,
}: ProductFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productType: "single",
      inStock: true,
      isPublic: true,
      isFeatured: false,
      isFreeShipping: false,
      enableStockAlert: false,
      images: [""],
      specifications: [{ key: "", value: "" }],
      sizeOptions: [],
      colorOptions: [],
      variants: [],
      sellingPrice: 0,
      ...initialValues,
    },
  })

  // Dynamic arrays
  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({ control, name: "specifications" })
  const { fields: variantFields } = useFieldArray({ control, name: "variants" })

  // Watch fields
  const imageValues = useWatch({ control, name: "images" }) || []
  const productType = useWatch({ control, name: "productType" })
  const enableStockAlert = useWatch({ control, name: "enableStockAlert" })
  const sellingPrice = useWatch({ control, name: "sellingPrice" }) || 0
  const buyingPrice = useWatch({ control, name: "buyingPrice" }) || 0
  const sizeOptions = useWatch({ control, name: "sizeOptions" }) || []
  const colorOptions = useWatch({ control, name: "colorOptions" }) || []
  const metaTitle = useWatch({ control, name: "metaTitle" })
  const shopIdValue = (useWatch({ control, name: "shopId" }) ?? null) as
    number | null
  // Super admin variant requires a shop before the form is usable.
  const shopLocked = variant === "super" && !shopIdValue
  const metaDescription = useWatch({ control, name: "metaDescription" })

  // Calculations
  const profit = sellingPrice - buyingPrice
  const profitPercent =
    buyingPrice > 0 ? ((profit / buyingPrice) * 100).toFixed(1) : "0"

  // Variant Generator (Mock)
  const handleGenerateVariants = () => {
    const generated = []
    for (const size of sizeOptions) {
      for (const color of colorOptions) {
        generated.push({
          id: `${size}-${color}`,
          size,
          color,
          price: sellingPrice || 0,
          sku: `PZ-${size}-${color.substring(0, 3).toUpperCase()}`,
          stock: 0,
        })
      }
    }
    setValue("variants", generated)
  }

  // Guard: super admin variant cannot submit without a shop selected.
  // Button is disabled, but Enter key on inputs could still submit.
  const guardedSubmit = (values: ProductFormValues) => {
    if (variant === "super" && !values.shopId) {
      // Silent return — the disabled button + opacity-40 already signals
      // to the user that a shop must be picked first.
      return
    }
    return onSubmit(values)
  }

  return (
    <div className="flex min-h-screen flex-col bg-(--bg-app)">
      {/* Top Header */}
      <div className="sticky top-0 z-10 border-b border-(--border-light) bg-(--bg-surface) px-6 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={onCancel}
              className="mb-1 flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--primary)"
            >
              <ArrowLeft className="size-3" /> Back to products
            </button>
            <h1 className="text-xl font-bold text-(--text-primary)">
              {mode === "create" ? "Add Product" : "Edit Product"}
            </h1>
            <p className="text-sm text-(--text-muted)">
              Create and configure a new product SKU, pricing, inventory,
              variants, and SEO.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-md px-4 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)"
            >
              Discard
            </button>
            <button
              type="button"
              className="h-9 rounded-md border border-(--border-light) bg-(--bg-surface) px-4 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)"
            >
              Save draft
            </button>
            <button
              onClick={handleSubmit(guardedSubmit)}
              disabled={isSubmitting || shopLocked}
              className="flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover) disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />{" "}
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Layout */}
      <form
        onSubmit={handleSubmit(guardedSubmit)}
        className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-6"
      >
        {/* Shop selector — only for super admin variant */}
        {variant === "super" && (
          <ShopSelectorCard
            shops={shops}
            value={shopIdValue}
            onChange={(id) =>
              setValue("shopId", id, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            locked={shopSelectorLocked}
          />
        )}

        {/* Content grid — locked when shop not selected (super variant) */}
        <div
          className={`grid grid-cols-1 gap-6 lg:grid-cols-3 ${
            shopLocked ? "pointer-events-none opacity-40 select-none" : ""
          }`}
        >
          {/* LEFT COLUMN (Spans 2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <SettingsCard
              title="Basic Information"
              description="Core catalog details"
            >
              <div className="space-y-2 md:col-span-2">
                {/* Product Name */}
                <FormField
                  label="Product Name"
                  required
                  icon={<Tag className="size-4" />}
                  placeholder="Enter product name"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Badge */}
                  <FormField
                    label="Badge"
                    placeholder="e.g. New, Sale"
                    {...register("badge")}
                  />
                  {/* Brand */}
                  <FormField
                    label="Brand"
                    placeholder="Select brand"
                    {...register("brand")}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Category */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                      Category
                    </label>
                    <select
                      className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
                      {...register("category")}
                    >
                      <option value="">Select category</option>
                      <option value="Herbal Supplement">
                        Herbal Supplement
                      </option>
                      <option value="Vitality">Vitality</option>
                    </select>
                    {errors.category && (
                      <FieldError>{errors.category.message}</FieldError>
                    )}
                  </div>
                  {/* Subcategory */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                      Subcategory
                    </label>
                    <select
                      className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-primary"
                      {...register("subcategory")}
                    >
                      <option value="">Select subcategory</option>
                      <option value="Herbal Supplement">
                        Herbal Supplement
                      </option>
                      <option value="Vitality">Vitality</option>
                    </select>
                    {errors.subcategory && (
                      <FieldError>{errors.subcategory.message}</FieldError>
                    )}
                  </div>
                  {/* <FormField
                    label="Subcategory"
                    placeholder="Select subcategory"
                    {...register("subcategory")}
                  /> */}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                      Section
                    </label>
                    <select
                      className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-primary"
                      {...register("section")}
                    >
                      <option value="">Select section</option>
                      <option value="Flash Sale">Flash Sale</option>
                      <option value="New Arrivals">New Arrivals</option>
                      <option value="Featured Products">
                        Featured Products
                      </option>
                      <option value="Upcoming Products">
                        Upcoming Products
                      </option>
                    </select>
                    {errors.section && (
                      <FieldError>{errors.section.message}</FieldError>
                    )}
                  </div>
                  {/* <FormField
                    label="Section"
                    placeholder="Featured Section"
                    {...register("section")}
                  />{" "} */}
                  <FormField
                    label="SKU"
                    icon={<Hash className="size-4" />}
                    placeholder="e.g. PROD-001"
                    error={errors.sku?.message}
                    {...register("sku")}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Short Description"
                    rows={2}
                    placeholder="Brief summary..."
                    error={errors.shortDescription?.message}
                    {...register("shortDescription")}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="rounded-md border border-(--border-light) bg-(--bg-surface)">
                    <RichTextToolbar
                      onCommand={() => {
                        /* Mock */
                      }}
                    />
                    <textarea
                      rows={6}
                      className="w-full resize-y p-3 text-sm outline-none"
                      placeholder="পণ্যের বিবরণ লিখুন..."
                      {...register("description")}
                    />
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* Variants */}
            <SettingsCard
              title="Variants"
              description="Manage product options"
              badge={
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-(--text-muted)">Type:</span>
                  <label className="flex cursor-pointer items-center gap-1">
                    <input
                      type="radio"
                      value="single"
                      {...register("productType")}
                    />{" "}
                    Single
                  </label>
                  <label className="flex cursor-pointer items-center gap-1">
                    <input
                      type="radio"
                      value="variant"
                      {...register("productType")}
                    />{" "}
                    Variant
                  </label>
                </div>
              }
            >
              {productType === "variant" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-(--text-primary)">
                      Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "38",
                        "39",
                        "40",
                        "41",
                        "42",
                        "43",
                        "44",
                        "45",
                        "46",
                      ].map((size) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() =>
                            setValue(
                              "sizeOptions",
                              sizeOptions.includes(size)
                                ? sizeOptions.filter((s) => s !== size)
                                : [...sizeOptions, size]
                            )
                          }
                          className={`flex size-8 items-center justify-center rounded-full border text-xs transition-colors ${sizeOptions.includes(size) ? "border-(--primary) bg-(--primary) text-white" : "border-(--border-light) text-(--text-primary) hover:border-(--primary)"}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-(--text-primary)">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Red", "Green", "Blue", "Black"].map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() =>
                            setValue(
                              "colorOptions",
                              colorOptions.includes(color)
                                ? colorOptions.filter((c) => c !== color)
                                : [...colorOptions, color]
                            )
                          }
                          className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${colorOptions.includes(color) ? "border-(--primary) bg-(--primary) text-white" : "border-(--border-light) text-(--text-primary) hover:border-(--primary)"}`}
                        >
                          {color}{" "}
                          {colorOptions.includes(color) && (
                            <X className="size-3" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateVariants}
                    className="flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-xs font-medium text-white hover:bg-(--primary-hover)"
                  >
                    <Layers className="size-3.5" /> Generate Variants
                  </button>
                  {variantFields.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded border border-(--border-light)">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-(--bg-app) text-(--text-muted)">
                          <tr>
                            <th className="p-2">Variant</th>
                            <th className="p-2">Price</th>
                            <th className="p-2">SKU</th>
                            <th className="p-2">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-light)">
                          {variantFields.map((v, i) => (
                            <tr key={v.id}>
                              <td className="p-2">
                                {v.size} / {v.color}
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  className="w-16 rounded border p-1"
                                  {...register(`variants.${i}.price`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-20 rounded border p-1"
                                  {...register(`variants.${i}.sku`)}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  className="w-12 rounded border p-1"
                                  {...register(`variants.${i}.stock`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </SettingsCard>

            {/* SEO */}
            <SettingsCard
              title="Search Engine Optimization (SEO)"
              description="Google snippet optimization"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Meta Title"
                  placeholder="SEO title"
                  {...register("metaTitle")}
                />
                <FormField
                  label="Meta Description"
                  placeholder="SEO description"
                  {...register("metaDescription")}
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Keywords"
                    icon={<Hash className="size-4" />}
                    placeholder="Comma separated keywords"
                    {...register("keywords")}
                  />
                </div>
              </div>
              <div className="mt-4 rounded-md border border-(--border-light) bg-(--bg-app) p-3">
                <span className="text-[10px] font-semibold text-(--text-muted) uppercase">
                  Search Engine Preview
                </span>
                <p className="mt-1 cursor-pointer text-xs text-blue-600 hover:underline">
                  {metaTitle || "Product Title | Power Zenox"}
                </p>
                <p className="text-[11px] text-green-700">
                  https://powerzenox.com/products/...
                </p>
                <p className="mt-1 text-xs text-(--text-muted)">
                  {metaDescription || "No description provided."}
                </p>
              </div>
            </SettingsCard>
          </div>

          {/* RIGHT COLUMN (Spans 1 col) */}
          <div className="space-y-6">
            {/* Pricing & Stock */}
            <SettingsCard
              title="Pricing & Stock"
              badge={
                <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  Profit: ৳ {profit} ({profitPercent}%)
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Selling Price"
                  required
                  type="number"
                  error={errors.sellingPrice?.message}
                  {...register("sellingPrice", { valueAsNumber: true })}
                />
                <FormField
                  label="Regular Price"
                  type="number"
                  {...register("regularPrice", { valueAsNumber: true })}
                />
                <FormField
                  label="Buying Price"
                  type="number"
                  {...register("buyingPrice", { valueAsNumber: true })}
                />
                <FormField
                  label="Stock"
                  type="number"
                  {...register("stock", { valueAsNumber: true })}
                />
              </div>
            </SettingsCard>

            {/* Visibility & Shipping */}
            <SettingsCard title="Visibility & Shipping">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input type="checkbox" {...register("inStock")} /> In Stock
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input type="checkbox" {...register("isPublic")} /> Public
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input type="checkbox" {...register("isFeatured")} /> Featured
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input type="checkbox" {...register("isFreeShipping")} /> Free
                  Shipping
                </label>
              </div>
              <hr className="my-3 border-(--border-light)" />
              <label className="flex cursor-pointer items-center justify-between text-xs font-semibold">
                Enable Stock Alert & Constraints
                <Controller
                  control={control}
                  name="enableStockAlert"
                  render={({ field }) => (
                    <FormToggle
                      checked={field.value ?? false}
                      onChange={field.onChange}
                    />
                  )}
                />
              </label>
              {enableStockAlert && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <FormField
                    label="Alert Qty"
                    type="number"
                    {...register("stockAlertQty", { valueAsNumber: true })}
                  />
                  <FormField
                    label="Max Order"
                    type="number"
                    {...register("maxOrderQty", { valueAsNumber: true })}
                  />
                  <FormField
                    label="Rank"
                    type="number"
                    {...register("rank", { valueAsNumber: true })}
                  />
                </div>
              )}
            </SettingsCard>

            {/* Product Images (URL based) */}
            <SettingsCard
              title="Product Images"
              description={`${imageValues.length} / 6 uploaded`}
            >
              <div className="space-y-3">
                {imageValues.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`images.${index}`}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="https://example.com/image.jpg"
                          className="h-9 flex-1 rounded-md border border-(--border-light) px-3 text-xs outline-none focus:border-(--primary)"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setValue(
                          "images",
                          imageValues.filter(
                            (_, imageIndex) => imageIndex !== index
                          ),
                          { shouldDirty: true, shouldValidate: true }
                        )
                      }
                      className="rounded p-2 text-red-500 hover:bg-red-50"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setValue("images", [...imageValues, ""], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-(--border-light) transition-colors hover:border-(--primary) hover:bg-(--bg-app)"
                >
                  <ImageIcon className="size-5 text-(--text-muted)" />
                  <span className="text-xs text-(--text-muted)">
                    Click to add image URL
                  </span>
                </button>
              </div>
            </SettingsCard>

            {/* Specifications */}
            <SettingsCard
              title="Specifications"
              badge={
                <button
                  type="button"
                  onClick={() => appendSpec({ key: "", value: "" })}
                  className="flex items-center gap-1 text-xs font-medium text-(--primary) hover:underline"
                >
                  <Plus className="size-3" /> Add Row
                </button>
              }
            >
              <div className="space-y-2">
                {specFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key (e.g. Material)"
                      className="h-9 w-1/3 rounded-md border border-(--border-light) px-3 text-xs"
                      {...register(`specifications.${index}.key`)}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Cotton)"
                      className="h-9 flex-1 rounded-md border border-(--border-light) px-3 text-xs"
                      {...register(`specifications.${index}.value`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(index)}
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </SettingsCard>

            {/* Related Products (UI Only) */}
            <SettingsCard title="Related Products" description="Upsell links">
              <div className="relative mb-3">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="h-9 w-full rounded-md border border-(--border-light) pr-3 pl-9 text-sm outline-none focus:border-(--primary)"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded border border-(--border-light) bg-(--bg-app) px-2 py-1 text-xs">
                  Jingseng Plus <X className="size-3 cursor-pointer" />
                </span>
                <span className="flex items-center gap-1 rounded border border-(--border-light) bg-(--bg-app) px-2 py-1 text-xs">
                  Ling Long Capsules <X className="size-3 cursor-pointer" />
                </span>
              </div>
            </SettingsCard>
          </div>
          {/* end grid */}
        </div>
        {/* end lock wrapper */}
      </form>
    </div>
  )
}
