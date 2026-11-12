import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SettingsLayout } from "../SettingsLayout"
import { DeliveryZonesCard } from "../../courier/DeliveryZonesCard"
import { CourierCredentialsCard } from "../../courier/CourierCredentialsCard"
import { CheckoutPreviewCard } from "../../courier/CheckoutPreviewCard"
import { LogisticsRulesCard } from "../../courier/LogisticsRulesCard"
import {
  useCourierQuery,
  useUpdateCourierMutation,
} from "../../../hooks/useCourierQuery"
import {
  courierSchema,
  defaultCourierValues,
  type CourierFormValues,
} from "../../../schemas/courierSchema"

export default function CourierTab() {
  const { data, isLoading, error } = useCourierQuery()
  const updateMutation = useUpdateCourierMutation()

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

  async function onSubmit(values: CourierFormValues) {
    await updateMutation.mutateAsync(values)
    // Server response updates cache -> useEffect resets form -> dirty cleared
  }

  return (
    <SettingsLayout
      activeTab="courier"
      //   pageTitle="Courier Settings"
      //   pageSubtitle="Configure delivery fees, zones, and courier API integrations in one unified hub"
      headerRight={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--status-delivered-bg) px-2.5 py-1 text-xs font-medium text-(--status-delivered-text)">
          <span className="size-1.5 rounded-full bg-(--status-delivered-text)" />
          Automated Dispatch Active
        </span>
      }
      isDirty={isDirty}
      isSaving={updateMutation.isPending}
      onDiscard={() => data && form.reset(data)}
      onSave={form.handleSubmit(onSubmit)}
      saveBarTitle="You have unsaved changes in Courier Settings"
      saveBarDescription="Changes in Dhaka zone fees and free delivery rules are pending saving."
    >
      {isLoading && (
        <div className="flex min-h-80 items-center justify-center text-sm text-(--text-muted)">
          Loading courier settings…
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load courier settings:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
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
