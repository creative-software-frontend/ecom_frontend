import { apiRequest } from "./client"
import type { AdminUser } from "../auth/AuthProvider"

export const profileApi = {
  updateProfile(data: { email: string }): Promise<AdminUser> {
    return apiRequest<AdminUser>("/admin/auth/profile", {
      method: "PUT",
      body: data,
    })
  },
}

