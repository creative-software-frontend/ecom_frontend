import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { settingsApi } from "../api/settingsApi"
import type { StoreSettings } from "../types/settings"

// সেন্ট্রালাইজড query key — invalidate করার সময় একই key ব্যবহার করব
export const STORE_QUERY_KEY = ["admin", "store"] as const

/**
 * স্টোর সেটিংস ফেচ করার জন্য।
 * staleTime ৫ মিনিট — কারণ স্টোরের নাম/নম্বর খুব বেশি চেঞ্জ হয় না।
 */
export function useStoreQuery() {
  return useQuery({
    queryKey: STORE_QUERY_KEY,
    queryFn: ({ signal }) => settingsApi.get(signal),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * স্টোর সেটিংস আপডেট করার জন্য mutation।
 * সফল হলে cache সরাসরি আপডেট হবে + সব consumer রি-রেন্ডার হবে।
 */
export function useUpdateStoreMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StoreSettings) => settingsApi.updateStore(data),
    onSuccess: (updated) => {
      // ক্যাশে নতুন ডেটা রেখে দিই (extra refetch লাগবে না)
      queryClient.setQueryData(STORE_QUERY_KEY, updated)
    },
  })
}
