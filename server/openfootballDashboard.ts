import { sampleDashboard } from '../shared/sampleData.js'
import type { DashboardData } from '../shared/types.js'

// The official 2026/27 match list is the reliable pre-season source. This
// keeps the dashboard honest until a live standings feed has started returning
// current league records.
export async function buildPremierLeagueDashboard(): Promise<DashboardData> {
  return {
    ...sampleDashboard,
    provider: {
      ...sampleDashboard.provider,
      lastUpdated: new Date().toISOString(),
    },
  }
}
