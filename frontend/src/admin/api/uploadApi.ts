import { apiRequest } from "./client"

export type UploadFolder = "products" | "brands" | "banners" | "logos"

export type UploadedImageResult = {
  url: string
  folder: UploadFolder
  size: number
}

/** Upload to backend disk — the returned path is served from /uploads. */
export function uploadImage(
  file: File,
  folder: UploadFolder
): Promise<UploadedImageResult> {
  const formData = new FormData()
  formData.append("image", file)
  return apiRequest<UploadedImageResult>(
    `/uploads?folder=${encodeURIComponent(folder)}`,
    { method: "POST", body: formData }
  )
}
