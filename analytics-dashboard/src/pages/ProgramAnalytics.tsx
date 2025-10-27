import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { fetchProgramAnalytics } from '../lib/api'
import { BRAND_COLORS, BADGE_COLORS, createLinearGradient, createAreaStyle } from '../lib/brandColors'

export default function ProgramAnalytics() {
  const { data: programsData, isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchProgramAnalytics,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto mt-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Error loading program analytics. Make sure API is running on port 3000.</span>
      </div>
    )
  }

  const top10Programs = programsData?.slice(0, 10) || []

  // Top programs by engagement chart
  const engagementChartOptions = {
    title: {
      text: 'Top 10 Programs by Engagement',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: top10Programs.map((p, i) => `Program ${i + 1}`),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Total Engagement'
    },
    series: [
      {
        data: top10Programs.map(p => p.totalEngagement),
        type: 'bar',
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: createLinearGradient(BRAND_COLORS.gradients.primary.start, BRAND_COLORS.gradients.primary.end)
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => params.value.toLocaleString()
        }
      }
    ]
  }

  // Sales efficiency chart
  const salesEfficiencyOptions = {
    title: {
      text: 'Sales per Task (Top 10 Programs)',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return `${params[0].name}<br/>${params[0].marker}Sales per Task: $${params[0].value.toFixed(2)}`
      }
    },
    xAxis: {
      type: 'category',
      data: top10Programs.map((p, i) => `Program ${i + 1}`),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Sales per Task ($)',
      axisLabel: {
        formatter: '${value}'
      }
    },
    series: [
      {
        data: top10Programs.map(p => p.salesPerTask),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        itemStyle: {
          color: BRAND_COLORS.teal
        },
        areaStyle: createAreaStyle(BRAND_COLORS.teal)
      }
    ]
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Program Performance</h1>
        <p className="text-base-content/70">Analyze advocacy program metrics and ROI</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Programs</div>
            <div className="stat-value" style={{color: BRAND_COLORS.primary}}>{programsData?.length || 0}</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Advocates</div>
            <div className="stat-value" style={{color: BRAND_COLORS.teal}}>
              {programsData?.reduce((sum, p) => sum + p.totalAdvocates, 0).toLocaleString() || 0}
            </div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Sales</div>
            <div className="stat-value" style={{color: BRAND_COLORS.teal}}>
              ${programsData?.reduce((sum, p) => sum + p.totalSales, 0).toLocaleString() || 0}
            </div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Engagement</div>
            <div className="stat-value" style={{color: BRAND_COLORS.blue}}>
              {programsData?.reduce((sum, p) => sum + p.totalEngagement, 0).toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ReactECharts option={engagementChartOptions} style={{ height: '400px' }} />
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ReactECharts option={salesEfficiencyOptions} style={{ height: '400px' }} />
          </div>
        </div>
      </div>

      {/* Full Programs Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">All Programs</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Brand</th>
                  <th>Advocates</th>
                  <th>Tasks</th>
                  <th>Engagement</th>
                  <th>Reach</th>
                  <th>Sales</th>
                  <th>$/Task</th>
                  <th>$/Advocate</th>
                  <th>Eng. Rate</th>
                </tr>
              </thead>
              <tbody>
                {programsData?.map((program, index) => (
                  <tr key={program.programId}>
                    <td>
                      <div className="badge" style={index < 3 ? {
                        backgroundColor: index === 0 ? BADGE_COLORS.first : index === 1 ? BADGE_COLORS.second : BADGE_COLORS.third,
                        color: 'white',
                        border: 'none'
                      } : {}}>
                        #{index + 1}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">{program.brandName}</div>
                    </td>
                    <td>{program.totalAdvocates.toLocaleString()}</td>
                    <td>{program.totalTasks.toLocaleString()}</td>
                    <td className="font-semibold">{program.totalEngagement.toLocaleString()}</td>
                    <td>{program.totalReach.toLocaleString()}</td>
                    <td className="font-semibold" style={{color: BRAND_COLORS.teal}}>${program.totalSales.toLocaleString()}</td>
                    <td style={{color: BRAND_COLORS.blue}}>${program.salesPerTask.toFixed(2)}</td>
                    <td style={{color: BRAND_COLORS.cyanLight}}>${program.salesPerAdvocate.toFixed(2)}</td>
                    <td>
                      <div className="badge" style={{backgroundColor: BRAND_COLORS.primary, color: 'white', border: 'none'}}>
                        {(program.avgEngagementRate * 100).toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
