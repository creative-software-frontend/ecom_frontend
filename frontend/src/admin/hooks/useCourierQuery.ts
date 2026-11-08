import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courierApi } from "../api/courierApi"
import type { CourierSettings } from "../types/courier"

export const COURIER_QUERY_KEY = ["admin", "settings", "courier"] as const

export function useCourierQuery() {
  return useQuery({
    queryKey: COURIER_QUERY_KEY,
    queryFn: ({ signal }) => courierApi.get(signal),
    staleTime: 60 * 1000,
  })
}

export function useUpdateCourierMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CourierSettings) => courierApi.update(input),
    onSuccess: (updated) => {
      qc.setQueryData(COURIER_QUERY_KEY, updated)
    },
  })
}
