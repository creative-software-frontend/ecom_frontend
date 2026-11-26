import { apiRequest } from "./client"
import type {
  CourierAccount,
  CourierLocationOption,
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
  getCities(slug: CourierSlug, signal?: AbortSignal): Promise<CourierLocationOption[]> {
    return apiRequest<CourierLocationOption[]>(
      `/shop/courier/locations/${slug}/cities`,
      { signal }
    )
  },
  getZones(
    slug: CourierSlug,
    cityId: number,
    signal?: AbortSignal
  ): Promise<CourierLocationOption[]> {
    return apiRequest<CourierLocationOption[]>(
      `/shop/courier/locations/${slug}/zones?cityId=${cityId}`,
      { signal }
    )
  },
  getAreas(
    slug: CourierSlug,
    params: { cityId?: number; zoneId?: number },
    signal?: AbortSignal
  ): Promise<CourierLocationOption[]> {
    const query = new URLSearchParams()
    if (params.cityId) query.set("cityId", String(params.cityId))
    if (params.zoneId) query.set("zoneId", String(params.zoneId))
    const suffix = query.toString()
    return apiRequest<CourierLocationOption[]>(
      `/shop/courier/locations/${slug}/areas${suffix ? `?${suffix}` : ""}`,
      { signal }
    )
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
  toggleSandbox(
    slug: CourierSlug,
    isSandbox: boolean
  ): Promise<CourierAccount> {
    return apiRequest<CourierAccount>(
      `/shop/settings/courier/accounts/${slug}/sandbox`,
      { method: "PATCH", body: { isSandbox } }
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
