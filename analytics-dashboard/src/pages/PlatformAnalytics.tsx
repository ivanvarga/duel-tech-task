import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { fetchPlatformAnalytics, fetchBrandPlatformAnalytics } from '../lib/api'
import { BRAND_COLORS, CHART_COLORS, createLinearGradient, createAreaStyle } from '../lib/brandColors'
import { PlatformIcon, getPlatformColor } from '../components/PlatformIcon'

export default function PlatformAnalytics() {
  const { data: platformsData, isLoading, error } = useQuery({
    queryKey: ['platforms'],
    queryFn: fetchPlatformAnalytics,
  })

  const { data: brandPlatformData } = useQuery({
    queryKey: ['brand-platforms'],
    queryFn: fetchBrandPlatformAnalytics,
  })

  // Get top 10 brands per platform
  const topBrandsByPlatform = useMemo(() => {
    if (!brandPlatformData) return {}

    const grouped: Record<string, typeof brandPlatformData> = {}
    brandPlatformData.forEach(item => {
      if (!grouped[item.platform]) {
        grouped[item.platform] = []
      }
      grouped[item.platform].push(item)
    })

    // Sort and get top 10 for each platform
    Object.keys(grouped).forEach(platform => {
      grouped[platform] = grouped[platform]
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 10)
    })

    return grouped
  }, [brandPlatformData])

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
        <span>Error loading platform analytics. Make sure API is running on port 3000.</span>
      </div>
    )
  }

  // Platform comparison chart - Tasks
  const taskComparisonOptions = {
    title: {
      text: 'Total Tasks by Platform',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    color: [CHART_COLORS[0], CHART_COLORS[3], CHART_COLORS[4]],
    series: [
      {
        name: 'Tasks',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        data: platformsData?.map(p => ({
          value: p.totalTasks,
          name: p.platform
        })) || []
      }
    ]
  }

  // Engagement comparison chart
  const engagementComparisonOptions = {
    title: {
      text: 'Engagement Metrics by Platform',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['Likes', 'Comments', 'Shares'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: platformsData?.map(p => p.platform) || []
    },
    yAxis: {
      type: 'value',
      name: 'Count'
    },
    series: [
      {
        name: 'Likes',
        type: 'bar',
        data: platformsData?.map(p => p.totalLikes) || [],
        itemStyle: { color: CHART_COLORS[0] }
      },
      {
        name: 'Comments',
        type: 'bar',
        data: platformsData?.map(p => p.totalComments) || [],
        itemStyle: { color: CHART_COLORS[3] }
      },
      {
        name: 'Shares',
        type: 'bar',
        data: platformsData?.map(p => p.totalShares) || [],
        itemStyle: { color: CHART_COLORS[4] }
      }
    ]
  }

  // Reach comparison
  const reachComparisonOptions = {
    title: {
      text: 'Total Reach by Platform',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        return `${params[0].name}<br/>${params[0].marker}Reach: ${params[0].value.toLocaleString()}`
      }
    },
    xAxis: {
      type: 'category',
      data: platformsData?.map(p => p.platform) || []
    },
    yAxis: {
      type: 'value',
      name: 'Total Reach',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
          if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
          return value.toString()
        }
      }
    },
    series: [
      {
        data: platformsData?.map(p => p.totalReach) || [],
        type: 'bar',
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: createLinearGradient(BRAND_COLORS.gradients.primary.start, BRAND_COLORS.gradients.primary.end)
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const value = params.value
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
            if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
            return value.toString()
          }
        }
      }
    ]
  }

  // Engagement rate comparison
  const engagementRateOptions = {
    title: {
      text: 'Average Engagement Rate by Platform',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return `${params[0].name}<br/>${params[0].marker}Engagement Rate: ${(params[0].value * 100).toFixed(2)}%`
      }
    },
    xAxis: {
      type: 'category',
      data: platformsData?.map(p => p.platform) || []
    },
    yAxis: {
      type: 'value',
      name: 'Engagement Rate (%)',
      axisLabel: {
        formatter: (value: number) => (value * 100).toFixed(1) + '%'
      }
    },
    series: [
      {
        data: platformsData?.map(p => p.avgEngagementRate) || [],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        itemStyle: {
          color: BRAND_COLORS.cyan
        },
        areaStyle: createAreaStyle(BRAND_COLORS.cyan)
      }
    ]
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
        <p className="text-base-content/70">Compare performance across Instagram, TikTok, and Facebook</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {platformsData?.map((platform) => (
          <div key={platform.platform} className="stats shadow">
            <div className="stat">
              <div className="stat-figure" style={{color: getPlatformColor(platform.platform)}}>
                <PlatformIcon platform={platform.platform} size={32} className="inline-block" />
              </div>
              <div className="stat-title flex items-center gap-2">
                <PlatformIcon platform={platform.platform} size={16} style={{color: getPlatformColor(platform.platform)}} />
                {platform.platform}
              </div>
              <div className="stat-value" style={{color: BRAND_COLORS.primary}}>{platform.totalTasks.toLocaleString()}</div>
              <div className="stat-desc">Total Tasks</div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ReactECharts option={taskComparisonOptions} style={{ height: '400px' }} />
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ReactECharts option={reachComparisonOptions} style={{ height: '400px' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ReactECharts option={engagementComparisonOptions} style={{ height: '400px' }} />
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ReactECharts option={engagementRateOptions} style={{ height: '400px' }} />
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title mb-4">Platform Metrics Overview</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Tasks</th>
                  <th>Total Likes</th>
                  <th>Total Comments</th>
                  <th>Total Shares</th>
                  <th>Total Engagement</th>
                  <th>Total Reach</th>
                  <th>Avg Eng. Rate</th>
                </tr>
              </thead>
              <tbody>
                {platformsData?.map((platform) => (
                  <tr key={platform.platform}>
                    <td className="font-bold text-lg">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={platform.platform} size={20} style={{color: getPlatformColor(platform.platform)}} />
                        {platform.platform}
                      </div>
                    </td>
                    <td>{platform.totalTasks.toLocaleString()}</td>
                    <td>{platform.totalLikes.toLocaleString()}</td>
                    <td>{platform.totalComments.toLocaleString()}</td>
                    <td>{platform.totalShares.toLocaleString()}</td>
                    <td className="font-semibold">{platform.totalEngagement.toLocaleString()}</td>
                    <td>{platform.totalReach.toLocaleString()}</td>
                    <td>
                      <div className="badge" style={{backgroundColor: BRAND_COLORS.primary, color: 'white', border: 'none'}}>
                        {(platform.avgEngagementRate * 100).toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Brands per Platform */}
      {Object.entries(topBrandsByPlatform).map(([platform, brands]) => (
        <div key={platform} className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <PlatformIcon platform={platform} size={24} style={{color: getPlatformColor(platform)}} />
              Top 10 Brands on {platform}
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Brand</th>
                    <th>Tasks</th>
                    <th>Total Engagement</th>
                    <th>Avg Eng. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand, index) => (
                    <tr key={brand.brandId}>
                      <td>
                        <div className="badge badge-lg">#{index + 1}</div>
                      </td>
                      <td className="font-semibold">{brand.brandName}</td>
                      <td>{brand.totalTasks.toLocaleString()}</td>
                      <td className="font-semibold">{brand.totalEngagement.toLocaleString()}</td>
                      <td>
                        <div className="badge" style={{backgroundColor: BRAND_COLORS.teal, color: 'white', border: 'none'}}>
                          {(brand.avgEngagementRate * 100).toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
