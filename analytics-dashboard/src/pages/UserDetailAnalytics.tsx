import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUserDetailAnalytics } from '../lib/api'
import { BRAND_COLORS, BADGE_COLORS, CHART_COLORS } from '../lib/brandColors'
import ReactECharts from 'echarts-for-react'
import { PlatformIcon, getPlatformColor } from '../components/PlatformIcon'

export default function UserDetailAnalytics() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => fetchUserDetailAnalytics(userId!),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto mt-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Error loading user analytics. Make sure API is running on port 3000.</span>
      </div>
    )
  }

  const { user, platformBreakdown, programParticipation, taskHistory } = data

  // Platform breakdown pie chart
  const platformChartOption = {
    title: {
      text: 'Engagement by Platform',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: platformBreakdown.map(p => ({
          name: p.platform,
          value: p.totalEngagement
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%'
        },
        color: CHART_COLORS
      }
    ]
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Breadcrumb and back button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="btn btn-sm btn-ghost gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>
              <a onClick={() => navigate('/users')} className="cursor-pointer">Top Advocates</a>
            </li>
            <li style={{ color: BRAND_COLORS.primary }}>{user.userName}</li>
          </ul>
        </div>
      </div>

      {/* User header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{user.userName}</h1>
        <p className="text-base-content/70">{user.userEmail || 'No email available'}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-100 shadow-xl rounded-lg">
          <div className="stat-title">Total Engagement</div>
          <div className="stat-value text-2xl" style={{ color: BRAND_COLORS.primary }}>
            {user.totalEngagement.toLocaleString()}
          </div>
          <div className="stat-desc">{user.totalTasks} tasks completed</div>
        </div>
        <div className="stat bg-base-100 shadow-xl rounded-lg">
          <div className="stat-title">Total Sales</div>
          <div className="stat-value text-2xl" style={{ color: BRAND_COLORS.teal }}>
            ${user.totalSales.toLocaleString()}
          </div>
          <div className="stat-desc">${user.conversionRate.toFixed(2)} per engagement</div>
        </div>
        <div className="stat bg-base-100 shadow-xl rounded-lg">
          <div className="stat-title">Influence Score</div>
          <div className="stat-value text-2xl" style={{ color: BADGE_COLORS.accent }}>
            {(user.influenceScore * 100).toFixed(2)}%
          </div>
          <div className="stat-desc">Engagement / Reach ratio</div>
        </div>
        <div className="stat bg-base-100 shadow-xl rounded-lg">
          <div className="stat-title">Total Reach</div>
          <div className="stat-value text-2xl" style={{ color: BRAND_COLORS.blue }}>
            {user.totalReach.toLocaleString()}
          </div>
          <div className="stat-desc">{user.totalPrograms} programs</div>
        </div>
      </div>

      {/* Platform breakdown and Program participation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Platform breakdown chart */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ReactECharts option={platformChartOption} style={{ height: '350px' }} />
            <div className="divider"></div>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Tasks</th>
                    <th>Engagement</th>
                    <th>Reach</th>
                    <th>Eng. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {platformBreakdown.map((platform) => (
                    <tr key={platform.platform}>
                      <td>
                        <div className="flex items-center gap-2">
                          <PlatformIcon
                            platform={platform.platform}
                            size={18}
                            style={{ color: getPlatformColor(platform.platform) }}
                          />
                          <span className="font-semibold">{platform.platform}</span>
                        </div>
                      </td>
                      <td>{platform.totalTasks}</td>
                      <td>{platform.totalEngagement.toLocaleString()}</td>
                      <td>{platform.totalReach.toLocaleString()}</td>
                      <td>
                        <div className="badge badge-sm" style={{ backgroundColor: BRAND_COLORS.primary, color: 'white', border: 'none' }}>
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

        {/* Program participation */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Program Participation</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {programParticipation.map((program) => (
                <div key={program.programId} className="card bg-base-200 shadow">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">{program.programName || 'Unknown Program'}</h3>
                    <p className="text-sm opacity-70">{program.brandName || 'Unknown Brand'}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <div className="opacity-70">Tasks</div>
                        <div className="font-semibold">{program.totalTasks}</div>
                      </div>
                      <div>
                        <div className="opacity-70">Engagement</div>
                        <div className="font-semibold">{program.totalEngagement.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="opacity-70">Reach</div>
                        <div className="font-semibold">{program.totalReach.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="opacity-70">Sales</div>
                        <div className="font-semibold" style={{ color: BRAND_COLORS.teal }}>
                          ${program.salesAttributed.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task history table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Task History (Last 100)</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Platform</th>
                  <th>Brand</th>
                  <th>Program</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Shares</th>
                  <th>Reach</th>
                  <th>Engagement</th>
                  <th>Eng. Rate</th>
                </tr>
              </thead>
              <tbody>
                {taskHistory.map((task) => (
                  <tr key={task.taskId}>
                    <td>{new Date(task.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <PlatformIcon
                          platform={task.platform}
                          size={16}
                          style={{ color: getPlatformColor(task.platform) }}
                        />
                        {task.platform}
                      </div>
                    </td>
                    <td className="text-sm">{task.brandName}</td>
                    <td className="text-sm">{task.programName}</td>
                    <td>{task.likes.toLocaleString()}</td>
                    <td>{task.comments.toLocaleString()}</td>
                    <td>{task.shares.toLocaleString()}</td>
                    <td>{task.reach.toLocaleString()}</td>
                    <td className="font-semibold">{task.engagement.toLocaleString()}</td>
                    <td>
                      <div className="badge badge-sm" style={{ backgroundColor: BRAND_COLORS.primary, color: 'white', border: 'none' }}>
                        {(task.engagementRate * 100).toFixed(2)}%
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
