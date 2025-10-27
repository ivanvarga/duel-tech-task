import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { fetchBrandAnalytics, fetchBrandPlatformAnalytics } from '../lib/api'
import { CHART_COLORS, BRAND_COLORS } from '../lib/brandColors'
import { PlatformIcon, getPlatformColor } from '../components/PlatformIcon'

export default function BrandAnalytics() {
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')

  const { data: brandsData, isLoading, error } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrandAnalytics,
  })

  const { data: brandPlatformData } = useQuery({
    queryKey: ['brand-platforms'],
    queryFn: fetchBrandPlatformAnalytics,
  })

  const selectedBrand = useMemo(() => {
    if (!selectedBrandId || !brandsData) return null
    return brandsData.find(b => b.brandId === selectedBrandId)
  }, [selectedBrandId, brandsData])

  const platformDataForBrand = useMemo(() => {
    if (!selectedBrandId || !brandPlatformData) return []
    return brandPlatformData.filter(d => d.brandId === selectedBrandId)
  }, [selectedBrandId, brandPlatformData])

  // Automatically select first brand when data loads
  useMemo(() => {
    if (brandsData && brandsData.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brandsData[0].brandId)
    }
  }, [brandsData, selectedBrandId])

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
        <span>Error loading brand analytics. Make sure API is running on port 3000.</span>
      </div>
    )
  }

  // Engagement chart options
  const engagementChartOptions = {
    title: {
      text: 'Engagement Breakdown',
      left: 'center',
      textStyle: { fontSize: 16 }
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
        name: 'Engagement',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: selectedBrand ? [
          { value: selectedBrand.totalLikes, name: 'Likes' },
          { value: selectedBrand.totalComments, name: 'Comments' },
          { value: selectedBrand.totalShares, name: 'Shares' }
        ] : []
      }
    ]
  }

  // Platform breakdown chart
  const platformChartOptions = {
    title: {
      text: 'Tasks by Platform',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: platformDataForBrand.map(d => d.platform)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: platformDataForBrand.map(d => d.totalTasks),
        type: 'bar',
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: CHART_COLORS[0]
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }

  // Platform engagement comparison
  const platformEngagementOptions = {
    title: {
      text: 'Engagement by Platform',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Likes', 'Comments', 'Shares'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: platformDataForBrand.map(d => d.platform)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Likes',
        type: 'bar',
        data: platformDataForBrand.map(d => d.totalLikes),
        itemStyle: { color: CHART_COLORS[0] }
      },
      {
        name: 'Comments',
        type: 'bar',
        data: platformDataForBrand.map(d => d.totalComments),
        itemStyle: { color: CHART_COLORS[3] }
      },
      {
        name: 'Shares',
        type: 'bar',
        data: platformDataForBrand.map(d => d.totalShares),
        itemStyle: { color: CHART_COLORS[4] }
      }
    ]
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Brand Selector */}
      <div className="mb-8">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text text-lg font-semibold">Select Brand</span>
          </div>
          <select
            className="select select-bordered select-lg w-full max-w-xs"
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
          >
            {brandsData?.map((brand) => (
              <option key={brand.brandId} value={brand.brandId}>
                {brand.brandName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedBrand && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure" style={{color: BRAND_COLORS.primary}}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div className="stat-title">Total Tasks</div>
                <div className="stat-value" style={{color: BRAND_COLORS.primary}}>{selectedBrand.totalTasks.toLocaleString()}</div>
              </div>
            </div>

            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure" style={{color: BRAND_COLORS.teal}}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div className="stat-title">Total Engagement</div>
                <div className="stat-value" style={{color: BRAND_COLORS.teal}}>{selectedBrand.totalEngagement.toLocaleString()}</div>
                <div className="stat-desc">Likes + Comments + Shares</div>
              </div>
            </div>

            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure" style={{color: BRAND_COLORS.blue}}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </div>
                <div className="stat-title">Total Reach</div>
                <div className="stat-value" style={{color: BRAND_COLORS.blue}}>{selectedBrand.totalReach.toLocaleString()}</div>
              </div>
            </div>

            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure" style={{color: BRAND_COLORS.teal}}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="stat-title">Total Sales</div>
                <div className="stat-value" style={{color: BRAND_COLORS.teal}}>${selectedBrand.totalSales.toLocaleString()}</div>
                <div className="stat-desc">From program memberships</div>
              </div>
            </div>

            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure" style={{color: BRAND_COLORS.blue}}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div className="stat-title">Sales Per Task</div>
                <div className="stat-value" style={{color: BRAND_COLORS.blue}}>${selectedBrand.salesPerTask.toFixed(2)}</div>
                <div className="stat-desc">Average revenue efficiency</div>
              </div>
            </div>

            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure" style={{color: BRAND_COLORS.cyanLight}}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <div className="stat-title">Conversion Rate</div>
                <div className="stat-value" style={{color: BRAND_COLORS.cyanLight}}>${selectedBrand.conversionRate.toFixed(2)}</div>
                <div className="stat-desc">Sales per engagement</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <ReactECharts option={engagementChartOptions} style={{ height: '400px' }} />
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <ReactECharts option={platformChartOptions} style={{ height: '400px' }} />
              </div>
            </div>
          </div>

          {/* Platform Engagement Comparison */}
          {platformDataForBrand.length > 0 && (
            <div className="card bg-base-100 shadow-xl mb-8">
              <div className="card-body">
                <ReactECharts option={platformEngagementOptions} style={{ height: '400px' }} />
              </div>
            </div>
          )}

          {/* Platform Details Table */}
          {platformDataForBrand.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Platform Performance Details</h2>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Tasks</th>
                        <th>Likes</th>
                        <th>Comments</th>
                        <th>Shares</th>
                        <th>Reach</th>
                        <th>Eng. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {platformDataForBrand.map((platform) => (
                        <tr key={platform.platform}>
                          <td className="font-semibold">
                            <div className="flex items-center gap-2">
                              <PlatformIcon platform={platform.platform} size={20} style={{color: getPlatformColor(platform.platform)}} />
                              {platform.platform}
                            </div>
                          </td>
                          <td>{platform.totalTasks.toLocaleString()}</td>
                          <td>{platform.totalLikes.toLocaleString()}</td>
                          <td>{platform.totalComments.toLocaleString()}</td>
                          <td>{platform.totalShares.toLocaleString()}</td>
                          <td>{platform.totalReach.toLocaleString()}</td>
                          <td>{(platform.avgEngagementRate * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
