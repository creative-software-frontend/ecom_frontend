import { useEffect, useState } from "react"
import {
  Search,
  MessageSquare,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Plus,
  Trash2,
} from "lucide-react"
import { apiRequest } from "../../../../api/client"
import { useAuth } from "../../../../auth/AuthProvider"
import { ConfirmationDialog } from "../../../../components/common/ConfirmationDialog"

const VARIABLES = [
  "{name}",
  "{shop_name}",
  "{order_id}",
  "{product_name}",
  "{tracking_code}",
]

type SmsTemplate = {
  id: string | number
  name: string
  message: string
}

const DEFAULT_TEMPLATES: SmsTemplate[] = [
  {
    id: "confirmed",
    name: "Confirmed Orders",
    message:
      "প্রিয় {name}, আপনার অর্ডারটি কনফার্ম হয়েছে। অর্ডারের ট্র্যাকিং কোড {tracking_code}। শীঘ্রই আপনার কাছে পৌঁছাবে।",
  },
  {
    id: "pending",
    name: "Pending Orders",
    message:
      "প্রিয় {name}, আপনার অর্ডার #{order_id} পেন্ডিং অবস্থায় আছে। দ্রুত নিশ্চিত করতে আমাদের সাথে যোগাযোগ করুন।",
  },
  {
    id: "delivery",
    name: "Delivery Update",
    message:
      "প্রিয় {name}, আপনার {product_name} পাঠানো হয়েছে। ট্র্যাকিং কোড: {tracking_code}।",
  },
]

export function SmsCampaignCard() {
  const { state } = useAuth()
  const [templates, setTemplates] = useState<SmsTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    DEFAULT_TEMPLATES[0].id
  )
  const [template, setTemplate] = useState(DEFAULT_TEMPLATES[0].message)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(
    null
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    const controller = new AbortController()

    void apiRequest<SmsTemplate[]>("/shop/settings/sms/templates", {
      signal: controller.signal,
    })
      .then((savedTemplates) => {
        setTemplates([...DEFAULT_TEMPLATES, ...savedTemplates])
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSaveError("টেমপ্লেট লোড করা যায়নি।")
      })

    return () => controller.abort()
  }, [])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const selected = templates.find((item) => String(item.id) === templateId)
    if (selected) setTemplate(selected.message)
  }

  const openCreateTemplate = () => {
    setEditingTemplateId(null)
    setTemplateName("")
    setSaveError("")
    setShowSaveTemplate(true)
  }

  const openUpdateTemplate = () => {
    const selected = templates.find(
      (item) => String(item.id) === String(selectedTemplateId)
    )
    if (!selected || typeof selected.id !== "number") return

    setEditingTemplateId(selected.id)
    setTemplateName(selected.name)
    setTemplate(selected.message)
    setSaveError("")
    setShowSaveTemplate(true)
  }

  const saveTemplate = async () => {
    const name = templateName.trim()
    if (!name || !template.trim()) return

    setSavingTemplate(true)
    setSaveError("")

    try {
      const savedTemplate =
        editingTemplateId === null
          ? await apiRequest<SmsTemplate>("/shop/settings/sms/templates", {
              method: "POST",
              body: { name, message: template },
            })
          : await apiRequest<SmsTemplate>(
              `/shop/settings/sms/templates/${editingTemplateId}`,
              {
                method: "PUT",
                body: { name, message: template },
              }
            )

      setTemplates((current) =>
        editingTemplateId === null
          ? [...current, savedTemplate]
          : current.map((item) =>
              String(item.id) === String(editingTemplateId)
                ? savedTemplate
                : item
            )
      )
      setSelectedTemplateId(String(savedTemplate.id))
      setEditingTemplateId(null)
      setTemplateName("")
      setShowSaveTemplate(false)
    } catch {
      setSaveError("টেমপ্লেট সেভ করা যায়নি। আবার চেষ্টা করুন।")
    } finally {
      setSavingTemplate(false)
    }
  }

  const openDeleteTemplate = () => {
    setDeleteError("")
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!selectedTemplate || typeof selectedTemplate.id !== "number") return

    setDeletingTemplate(true)
    setDeleteError("")

    try {
      await apiRequest(`/shop/settings/sms/templates/${selectedTemplate.id}`, {
        method: "DELETE",
      })

      const remaining = templates.filter(
        (item) => String(item.id) !== String(selectedTemplate.id)
      )
      setTemplates(remaining)

      const nextTemplate = remaining[0] ?? DEFAULT_TEMPLATES[0]
      setSelectedTemplateId(String(nextTemplate.id))
      setTemplate(nextTemplate.message)
      setShowDeleteConfirm(false)
    } catch {
      setDeleteError("টেমপ্লেট ডিলিট করা যায়নি। আবার চেষ্টা করুন।")
    } finally {
      setDeletingTemplate(false)
    }
  }

  const shopName =
    state.status === "authenticated" ? (state.user.shop?.name ?? "") : ""
  const selectedTemplate = templates.find(
    (item) => String(item.id) === String(selectedTemplateId)
  )
  const canUpdateSelectedTemplate =
    selectedTemplate && typeof selectedTemplate.id === "number"

  // লাইভ প্রিভিউ ডামি ডেটা
  const previewText = template
    .replaceAll("{name}", "রহিম")
    .replaceAll("{shop_name}", shopName || "আপনার দোকান")
    .replaceAll("{order_id}", "#PZ-88391")
    .replaceAll("{product_name}", "Ultra Hot Capsules")
    .replaceAll("{tracking_code}", "PZ-88391")

  // ডামি হিসাব
  const charCount = template.length
  const smsCount = Math.ceil(charCount / 70)

  return (
    <div className="rounded-md border border-(--border-light) bg-(--bg-surface)">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--border-light) p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-(--primary-soft) text-(--primary)">
            <MessageSquare className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-(--text-primary)">
              Send Bulk SMS Campaign
            </h2>
            <p className="text-xs text-(--text-muted)">
              Filter target segment and compose template with dynamic data tags
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Ready to
          Broadcast
        </span>
      </div>

      <div className="space-y-5 p-4">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-(--text-muted)" />
            <input
              type="text"
              placeholder="Zenox Vital Organic 500ml"
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-3 pl-9 text-sm outline-none focus:border-(--primary)"
            />
          </div>
          <select
            value={selectedTemplateId}
            onChange={(event) => handleTemplateChange(event.target.value)}
            className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
            aria-label="Message template"
          >
            {templates.map((item) => (
              <option key={String(item.id)} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
          {/* <span className="pointer-events-none absolute -top-2 right-2 rounded-full bg-(--primary) px-1.5 py-0.5 text-[9px] font-bold text-white">
              {templates.length} templates
            </span> */}
          <select className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)">
            <option>All Sources</option>
            <option>Website</option>
          </select>
          <select className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>

        <div className="flex items-center justify-between rounded-md bg-(--bg-app) px-3 py-2 text-xs">
          <span className="text-(--text-muted)">
            Current target match:{" "}
            <strong className="text-(--text-primary)">240 customers</strong>{" "}
            filtered
          </span>
          <button className="flex items-center gap-1 text-(--primary) hover:underline">
            <RotateCcw className="size-3" /> Reset filters
          </button>
        </div>

        {/* Message Template */}
        <div>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="text-sm font-semibold text-(--text-primary)">
                Message Template
              </label>
              <p className="text-xs text-(--text-muted)">
                Write it once — variables are dynamically swapped for each
                matched customer.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-(--text-muted)">
                Insert variable:
              </span>
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTemplate((prev) => prev + " " + v)}
                  className="rounded border border-(--border-light) bg-(--bg-app) px-2 py-0.5 font-mono text-[11px] text-(--text-primary) hover:border-(--primary)"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={4}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-app) p-3 text-sm outline-none focus:border-(--primary)"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-(--text-muted)">
            <div className="flex items-center gap-3">
              <span>অ Unicode (Bengali)</span>
              <span>• {charCount} characters</span>
              <span>• {smsCount} SMS parts / recipient</span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                Audience: <strong>240</strong>
              </span>
              <span className="rounded bg-(--primary-soft) px-2 py-0.5 font-medium text-(--primary)">
                Est. Cost: ৳ 120.00 (৳0.25/SMS)
              </span>
            </div>
          </div>
        </div>

        {showSaveTemplate && (
          <div className="flex flex-col gap-2 rounded-md border border-(--border-light) bg-(--bg-app) p-3 sm:flex-row sm:items-center">
            <label
              htmlFor="sms-template-name"
              className="text-xs font-semibold text-(--text-primary)"
            >
              {editingTemplateId === null
                ? "Create template name"
                : "Update template name"}
            </label>
            <input
              id="sms-template-name"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveTemplate()
              }}
              placeholder="যেমন: Payment Reminder"
              className="h-9 flex-1 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm outline-none focus:border-(--primary)"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplate(false)}
                className="h-9 rounded-md border border-(--border-light) px-3 text-sm text-(--text-primary)"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTemplate}
                disabled={
                  savingTemplate || !templateName.trim() || !template.trim()
                }
                className="h-9 rounded-md bg-(--primary) px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingTemplate
                  ? "Saving..."
                  : editingTemplateId === null
                    ? "Create Template"
                    : "Update Template"}
              </button>
            </div>
            {saveError && (
              <p className="text-xs text-red-600 sm:basis-full">{saveError}</p>
            )}
          </div>
        )}

        {/* Live Preview */}
        <div className="rounded-md border border-(--border-light) bg-(--bg-app) p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-(--text-primary)">
              Recipient Handset View{" "}
              <span className="ml-1 rounded border border-(--border-light) bg-(--bg-surface) px-1.5 py-0.5 text-[10px] text-(--text-muted)">
                Live Preview
              </span>
            </span>
            <span className="text-[10px] text-(--text-muted)">
              Sender ID: PowerZenox
            </span>
          </div>
          <div className="max-w-sm rounded-md border border-(--border-light) bg-(--bg-surface) p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold text-(--text-primary)">
                <Smartphone className="size-3 text-(--primary)" /> PowerZenox
                SMS
              </span>
              <span className="text-[10px] text-(--text-muted)">Just now</span>
            </div>
            <div className="rounded-md bg-blue-50 p-2.5 text-sm text-blue-900">
              {previewText}
            </div>
            <p className="mt-2 text-center text-[10px] text-(--text-muted)">
              Delivered via Grameephone / Robi Route
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border-light) pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openCreateTemplate}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)"
            >
              <Plus className="size-4" /> New Template
            </button>
            <button
              type="button"
              onClick={openUpdateTemplate}
              disabled={!canUpdateSelectedTemplate}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover) disabled:cursor-not-allowed disabled:opacity-50"
              title={
                canUpdateSelectedTemplate
                  ? "Update the selected custom template"
                  : "Select a custom template to update"
              }
            >
              <Save className="size-4" /> Update Template
            </button>
            <button
              type="button"
              onClick={openDeleteTemplate}
              disabled={!canUpdateSelectedTemplate}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-red-600 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                canUpdateSelectedTemplate
                  ? "Delete the selected custom template"
                  : "Select a custom template to delete"
              }
            >
              <Trash2 className="size-4" /> Delete Template
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)">
              <Send className="size-4" /> Send Test SMS to My Number
            </button>
          </div>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)">
            <Send className="size-4" /> Broadcast Campaign
          </button>
        </div>
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        title="Delete SMS Template"
        variant="danger"
        icon={Trash2}
        confirmLabel={deletingTemplate ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        isPending={deletingTemplate}
        errorMessage={deleteError}
        description={
          <p>
            Are you sure you want to delete the template{" "}
            <strong>&ldquo;{selectedTemplate?.name}&rdquo;</strong>? This action
            cannot be undone.
          </p>
        }
        onCancel={() => {
          if (!deletingTemplate) {
            setShowDeleteConfirm(false)
            setDeleteError("")
          }
        }}
        onConfirm={confirmDeleteTemplate}
      />
    </div>
  )
}
