import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courierApi } from "../api/courierApi"
import type {
  CourierAccount,
  CourierSettings,
  CourierSlug,
  UpdateCourierAccountInput,
} from "../types/courier"

export const COURIER_QUERY_KEY = ["admin", "settings", "courier"] as const
export const COURIER_ACCOUNTS_QUERY_KEY = [
  ...COURIER_QUERY_KEY,
  "accounts",
] as const

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

export function useCourierAccountsQuery() {
  return useQuery({
    queryKey: COURIER_ACCOUNTS_QUERY_KEY,
    queryFn: ({ signal }) => courierApi.listAccounts(signal),
    staleTime: 30 * 1000,
  })
}

// The mutationFn is supplied per hook below; the shared helper only handles
// cache replacement, so no secret-bearing payload is ever cached by it.
function useAccountCacheMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<CourierAccount>
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (account) => {
      qc.setQueryData<CourierAccount[]>(
        COURIER_ACCOUNTS_QUERY_KEY,
        (current) =>
          current?.map((item) => (item.slug === account.slug ? account : item))
      )
    },
  })
}

export function useUpdateCourierAccountMutation() {
  return useAccountCacheMutation(
    ({
      slug,
      input,
    }: {
      slug: CourierSlug
      input: UpdateCourierAccountInput
    }) => courierApi.updateAccount(slug, input)
  )
}

export function useToggleCourierAccountMutation() {
  return useAccountCacheMutation(
    ({ slug, enabled }: { slug: CourierSlug; enabled: boolean }) =>
      courierApi.toggleAccount(slug, enabled)
  )
}

export function useDisconnectCourierAccountMutation() {
  return useAccountCacheMutation((slug: CourierSlug) =>
    courierApi.disconnectAccount(slug)
  )
}

/** Test results carry the refreshed safe account, so no secrets enter the cache. */
export function useTestCourierAccountMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slug: CourierSlug) => courierApi.testAccount(slug),
    onSuccess: (result) => {
      qc.setQueryData<CourierAccount[]>(
        COURIER_ACCOUNTS_QUERY_KEY,
        (current) =>
          current?.map((item) =>
            item.slug === result.account.slug ? result.account : item
          )
      )
    },
  })
}
