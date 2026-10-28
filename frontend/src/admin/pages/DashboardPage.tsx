import { dashboardMockData } from "../data/dashboardMock"
import { PageTitleBlock } from "../components/widgets/PageTitleBlock"
import { StatCardWidget } from "../components/widgets/StatCardWidget"
import { SalesReport } from "../components/widgets/SalesReport"
import { BandwidthReports } from "../components/widgets/BandwidthReports"
import { StatCardRow2 } from "../components/widgets/StatCardRow2"
import { RecentOrders } from "../components/tables/RecentOrders"
import { TargetProgressCard } from "../components/widgets/TargetProgressCard"

export function DashboardPage() {
  return (
    <div className="admin-dashboard-content p-4 md:p-[30px]">
      <PageTitleBlock data={dashboardMockData.pageTitle} />
      <div className="admin-stats-grid">
        {dashboardMockData.statsRow1.map((card) => (
          <StatCardWidget key={card.id} card={card} />
        ))}
      </div>
      <div className="admin-report-grid">
        <SalesReport data={dashboardMockData.salesReport} />
        <BandwidthReports data={dashboardMockData.bandwidthReports} />
      </div>
      <div className="admin-stats-grid">
        {dashboardMockData.statsRow2.map((card) => (
          <StatCardRow2 key={card.id} card={card} />
        ))}
      </div>
      <div className="my-6">
        <RecentOrders data={dashboardMockData.recentOrders} />
      </div>
      <div className="admin-target-grid">
        {dashboardMockData.progressRow.map((card) => (
          <TargetProgressCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
