import type { ChartData } from "chart.js"

export type StatCardGradient =
  "midnight-bloom" | "arielle-smile" | "grow-early" | "premium-dark"

export type DashboardPageTitle = {
  title: string
  description: string
  actions: string[]
}

export type GradientStatCard = {
  id: string
  title: string
  subtitle: string
  value: string
  gradient: StatCardGradient
  hideAtXlBelow?: boolean
}

export type MetricStatCard = {
  id: string
  title: string
  subtitle: string
  value: string
  valueColor: "success" | "warning" | "danger" | "focus"
  hideAtXlBelow?: boolean
  progress?: {
    value: number
    label: string
    labelValue: string
    color: "info"
  }
}

export type ProgressStatCard = {
  id: string
  title: string
  value: string
  progress: number
  color: "danger" | "success" | "warning" | "info"
}

export type SalesReportChartDataset = {
  label: string
  data: number[]
  backgroundColor: string
  borderColor?: string
  borderWidth?: number
}

export type SalesReportChart = {
  labels: string[]
  datasets: SalesReportChartDataset[]
}

export type SalesReportEntry = {
  id: string
  name: string
  subtitle: string
  avatar: string
  value: number
  trend: "up" | "down" | "steady"
}

export type SalesReportTabData = {
  chart: SalesReportChart
  listTitle: string
  entries: SalesReportEntry[]
}

export type SalesReportData = {
  last: SalesReportTabData
  current: SalesReportTabData
}

export type BandwidthProgressWidget = {
  id: string
  label: string
  value: number
  color: "danger" | "success" | "primary" | "warning" | "info" | "alternate"
}

export type BandwidthReportTabData = {
  chart: ChartData<"line", number[], string>
  trend: {
    direction: "left" | "up"
    value: string
    description: string
    color: "warning" | "success"
  }
  progressWidgets: BandwidthProgressWidget[]
}

export type BandwidthReportsData = {
  first: BandwidthReportTabData
  second: BandwidthReportTabData
}

export type RecentOrderStatus =
  "Pending" | "Completed" | "In Progress" | "On Hold"

export type RecentOrder = {
  id: string
  number: string
  name: string
  subtitle: string
  avatar: string
  city: string
  status: RecentOrderStatus
}

export type RecentOrdersData = {
  title: string
  lastWeek: RecentOrder[]
  allMonth: RecentOrder[]
}

export type DashboardMockData = {
  pageTitle: DashboardPageTitle
  statsRow1: GradientStatCard[]
  salesReport: SalesReportData
  bandwidthReports: BandwidthReportsData
  statsRow2: MetricStatCard[]
  recentOrders: RecentOrdersData
  progressRow: ProgressStatCard[]
}

export type PageTitleBlockProps = {
  data: DashboardPageTitle
}

export type StatCardWidgetProps = {
  card: GradientStatCard
}

export type StatCardRow2Props = {
  card: MetricStatCard
}

export type TargetProgressCardProps = {
  card: ProgressStatCard
}

export type SalesReportProps = {
  data: SalesReportData
}

export type BandwidthReportsProps = {
  data: BandwidthReportsData
}

export type RecentOrdersProps = {
  data: RecentOrdersData
}
