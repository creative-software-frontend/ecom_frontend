import { apiRequest } from "./client"
import type { ChangePasswordInput, StoreSettings } from "../types/settings"

export const settingsApi = {
  get(signal?: AbortSignal): Promise<StoreSettings> {
    return apiRequest<StoreSettings>("/admin/settings", { signal })
  },

  updateStore(data: StoreSettings): Promise<StoreSettings> {
    return apiRequest<StoreSettings>("/admin/settings", {
      method: "PUT",
      body: data,
    })
  },

  changePassword(data: ChangePasswordInput): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/admin/settings/password", {
      method: "PUT",
      body: data,
    })
  },
}

