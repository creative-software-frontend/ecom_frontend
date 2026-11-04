import { Outlet } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./AuthProvider"

// QueryClient ইনস্ট্যান্সটি কম্পোনেন্টের বাইরে রাখা হয়েছে যাতে রি-রেন্ডারে নতুন ক্লায়েন্ট তৈরি না হয়।
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // ১ মিনিট পর্যন্ত ডেটা ফ্রেশ থাকবে
      refetchOnWindowFocus: false, // উইন্ডো ফোকাসে অটো রিফেচ বন্ধ (প্রয়োজন হলে চালু করা যাবে)
    },
  },
})

export function AdminRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  )
}
export default AdminRoot
