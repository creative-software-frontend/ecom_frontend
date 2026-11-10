import { apiRequest } from "./client"
import type { ChangePasswordInput, StoreSettings } from "../types/settings"

export const settingsApi = {
  get(signal?: AbortSignal): Promise<StoreSettings> {
    return apiRequest<StoreSettings>("/shop/settings/store", { signal })
  },

  updateStore(data: StoreSettings): Promise<StoreSettings> {
    return apiRequest<StoreSettings>("/shop/settings/store", {
      method: "PUT",
      body: data,
    })
  },

  changePassword(data: ChangePasswordInput): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/auth/password", {
      method: "PUT",
      body: data,
    })
  },
}
