export type PendingOrderItem = {
  id: string
  orderNumber: string
  placedTime: string
  customerName: string
  customerPhone: string
  deliveryArea: string
  itemSummary: string
}

export type DashboardData = {
  metrics: {
    newOrdersToday: {
      count: number
      change: string
      cod: number
      bkash: number
    }
    waitingConfirmation: { count: number; oldestTime: string }
    deliveredRevenueMonth: {
      amount: number
      parcelCount: number
      avgPerOrder: number
    }
    lowStockProducts: { count: number; alertText: string }
  }
  pendingVerificationOrders: PendingOrderItem[]
  weeklyChart: {
    days: { day: string; count: number; active?: boolean }[]
    totalOrders: number
    totalValue: number
    dailyAverage: number
    dateRange: string
  }
  courierSummary: {
    readyForPickup: number
    insideDhaka: number
    outsideDhaka: number
    totalCod: number
  }
}
