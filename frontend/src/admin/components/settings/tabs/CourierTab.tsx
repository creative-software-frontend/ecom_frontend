import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SettingsLayout } from "../SettingsLayout"
import { DeliveryZonesCard } from "../../courier/DeliveryZonesCard"
import { CourierCredentialsCard } from "../../courier/CourierCredentialsCard"
import { CheckoutPreviewCard } from "../../courier/CheckoutPreviewCard"
import { LogisticsRulesCard } from "../../courier/LogisticsRulesCard"
import { ErrorState } from "../../common/ErrorState"
import { InlineNotice } from "../../common/InlineNotice"
import { LoadingState } from "../../common/LoadingState"
import {
  useCourierAccountsQuery,
  useCourierQuery,
  useUpdateCourierMutation,
} from "../../../hooks/useCourierQuery"
import {
  courierSchema,
  defaultCourierValues,
  type CourierFormValues,
} from "../../../schemas/courierSchema"
import { getErrorMessage } from "../../../lib/errors"

export default function CourierTab() {
  const { data, isLoading, error, refetch } = useCourierQuery()
  const updateMutation = useUpdateCourierMutation()
  const accountsQuery = useCourierAccountsQuery()
  const [saveNotice, setSaveNotice] = useState<{
    variant: "success" | "error"
    message: string
  } | null>(null)

  const form = useForm<CourierFormValues>({
    resolver: zodResolver(courierSchema),
    defaultValues: defaultCourierValues,
  })

  // Sync API data into form once loaded (and after save via queryClient.setQueryData)
  useEffect(() => {
    if (data) form.reset(data)
  }, [data, form])

  const watched = {
    ...defaultCourierValues,
    ...useWatch({ control: form.control }),
  } as CourierFormValues
  const isDirty = form.formState.isDirty
  const enabledCount =
    accountsQuery.data?.filter((account) => account.enabled).length ?? 0

  async function onSubmit(values: CourierFormValues) {
    setSaveNotice(null)
    try {
      await updateMutation.mutateAsync(values)
      setSaveNotice({
        variant: "success",
        message: "Delivery zone settings saved.",
      })
      // Server response updates cache -> useEffect resets form -> dirty cleared
    } catch (error) {
      setSaveNotice({
        variant: "error",
        message: getErrorMessage(error, "Could not save delivery zone settings."),
      })
    }
  }

  return (
    <SettingsLayout
      activeTab="courier"
      headerRight={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--status-delivered-bg) px-2.5 py-1 text-xs font-medium text-(--status-delivered-text)">
          <span className="size-1.5 rounded-full bg-(--status-delivered-text)" />
          {enabledCount} Courier{enabledCount === 1 ? "" : "s"} Enabled
        </span>
      }
      isDirty={isDirty}
      isSaving={updateMutation.isPending}
      onDiscard={() => data && form.reset(data)}
      onSave={form.handleSubmit(onSubmit)}
      saveBarTitle="You have unsaved changes in Courier Settings"
      saveBarDescription="Changes in Dhaka zone fees and free delivery rules are pending saving."
    >
      {saveNotice && (
        <InlineNotice
          message={saveNotice.message}
          variant={saveNotice.variant}
          className={`mb-4 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs ${
            saveNotice.variant === "success"
              ? "border-(--status-delivered-text) bg-(--status-delivered-bg) text-(--status-delivered-text)"
              : "border-(--status-cancelled-text) bg-(--status-cancelled-bg) text-(--status-cancelled-text)"
          }`}
          dismissLabel="Dismiss notice"
          onDismiss={() => setSaveNotice(null)}
        />
      )}

      {isLoading && (
        <LoadingState className="flex min-h-80 items-center justify-center text-sm text-(--text-muted)">
          Loading courier settings…
        </LoadingState>
      )}

      {error && !isLoading && (
        <ErrorState
          message={`Failed to load courier settings: ${getErrorMessage(error, "Unknown error")}`}
          onRetry={() => void refetch()}
          className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4 text-sm text-(--status-cancelled-text)"
          buttonClassName="mt-2 rounded border border-(--border-light) bg-(--bg-surface) px-3 py-1.5 text-xs font-medium text-(--text-primary)"
        />
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <DeliveryZonesCard form={form} />
            <CourierCredentialsCard />
          </div>
          <aside className="space-y-3">
            <CheckoutPreviewCard values={watched} />
            <LogisticsRulesCard />
          </aside>
        </div>
      )}
    </SettingsLayout>
  )
}
