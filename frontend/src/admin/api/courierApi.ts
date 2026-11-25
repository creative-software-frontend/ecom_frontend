import { apiRequest } from "./client"
import type {
  CourierAccount,
  CourierSettings,
  CourierSlug,
  CourierTestResult,
  UpdateCourierAccountInput,
} from "../types/courier"

export const courierApi = {
  get(signal?: AbortSignal): Promise<CourierSettings> {
    return apiRequest<CourierSettings>("/shop/settings/courier", { signal })
  },
  update(input: CourierSettings): Promise<CourierSettings> {
    return apiRequest<CourierSettings>("/shop/settings/courier", {
      method: "PUT",
      body: input,
    })
  },
  listAccounts(signal?: AbortSignal): Promise<CourierAccount[]> {
    return apiRequest<CourierAccount[]>("/shop/settings/courier/accounts", {
      signal,
    })
  },
  updateAccount(
    slug: CourierSlug,
    input: UpdateCourierAccountInput
  ): Promise<CourierAccount> {
    return apiRequest<CourierAccount>(`/shop/settings/courier/accounts/${slug}`, {
      method: "PUT",
      body: input,
    })
  },
  toggleAccount(
    slug: CourierSlug,
    enabled: boolean
  ): Promise<CourierAccount> {
    return apiRequest<CourierAccount>(
      `/shop/settings/courier/accounts/${slug}/toggle`,
      { method: "PATCH", body: { enabled } }
    )
  },
  disconnectAccount(slug: CourierSlug): Promise<CourierAccount> {
    return apiRequest<CourierAccount>(
      `/shop/settings/courier/accounts/${slug}/credentials`,
      { method: "DELETE" }
    )
  },
  testAccount(slug: CourierSlug): Promise<CourierTestResult> {
    return apiRequest<CourierTestResult>(
      `/shop/settings/courier/accounts/${slug}/test`,
      { method: "POST" }
    )
  },
}
