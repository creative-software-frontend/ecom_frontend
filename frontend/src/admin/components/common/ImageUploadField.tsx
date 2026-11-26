import { useId, useRef, useState, type ChangeEvent } from "react"
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { InlineNotice } from "./InlineNotice"
import { uploadImage, type UploadFolder } from "../../api/uploadApi"
import { IMAGE_ACCEPT_ATTRIBUTE, validateImageFile } from "../../lib/imageUpload"

type ImageUploadFieldProps = {
  value: string | null | undefined
  onChange: (url: string | null) => void
  folder: UploadFolder
  label?: string
  hint?: string
  aspect?: "square" | "banner"
  error?: string
  disabled?: boolean
}

/** Single local image uploader — no URL input, previews the saved path. */
export function ImageUploadField({
  value,
  onChange,
  folder,
  label,
  hint,
  aspect = "square",
  error,
  disabled = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Allow picking the same file again after a replace or failed upload.
    event.target.value = ""
    if (!file) return

    const validationMessage = validateImageFile(file)
    if (validationMessage) {
      setUploadError(validationMessage)
      return
    }

    setUploadError(null)
    setUploading(true)
    try {
      const result = await uploadImage(file, folder)
      onChange(result.url)
    } catch (uploadFailure: unknown) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "Upload failed. Please try again."
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT_ATTRIBUTE}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => void handleChange(event)}
      />
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
        >
          {label}
        </label>
      )}
      <div className="flex items-start gap-3">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-(--border-light) bg-(--bg-app) ${
            aspect === "square" ? "size-20" : "aspect-8/3 w-40"
          }`}
        >
          {value ? (
            <img
              src={value}
              alt={label ? `${label} preview` : "Image preview"}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-5 text-(--text-muted)" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {uploading ? "Uploading..." : value ? "Replace" : "Upload new"}
          </button>
          {value && (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => {
                onChange(null)
                setUploadError(null)
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-(--status-cancelled-text) transition-colors hover:bg-(--status-cancelled-bg) disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          )}
          {hint && <p className="w-full text-[10px] text-(--text-muted)">{hint}</p>}
        </div>
      </div>
      {error && <FieldError>{error}</FieldError>}
      {uploadError && (
        <InlineNotice
          message={uploadError}
          variant="error"
          ariaLive="assertive"
          dismissLabel="Dismiss upload error"
          onDismiss={() => setUploadError(null)}
          className="mt-2 flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
        />
      )}
    </div>
  )
}
