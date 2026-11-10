import { apiRequest } from "./client"
import type { CourierSettings } from "../types/courier"

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
}
