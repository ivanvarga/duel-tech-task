import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUserAnalytics } from '../lib/api'
import { BRAND_COLORS, BADGE_COLORS } from '../lib/brandColors'

type SortBy = 'totalEngagement' | 'totalSales' | 'influenceScore' | 'totalTasks' | 'conversionRate'

export default function UserAnalytics() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortBy>('totalEngagement')

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUserAnalytics,
  })

  const sortedUsers = usersData?.slice().sort((a, b) => {
    return b[sortBy] - a[sortBy]
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
        <span>Error loading user analytics. Make sure API is running on port 3000.</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Top Advocates</h1>
        <p className="text-base-content/70">Identify top performing advocates based on activity, influence, and conversions</p>
      </div>

      {/* Sort Options */}
      <div className="mb-6">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text text-lg font-semibold">Sort By</span>
          </div>
          <select
            className="select select-bordered select-lg w-full max-w-xs"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="totalEngagement">Total Engagement</option>
            <option value="totalSales">Total Sales</option>
            <option value="influenceScore">Influence Score</option>
            <option value="totalTasks">Total Tasks</option>
            <option value="conversionRate">Conversion Rate</option>
          </select>
        </label>
      </div>

      {/* Top 3 Advocates Cards */}
      {sortedUsers && sortedUsers.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {sortedUsers.slice(0, 3).map((user, index) => (
            <div
              key={user.userId}
              className={`card bg-base-100 shadow-xl cursor-pointer transition-transform hover:scale-105 ${index === 0 ? 'ring-2' : ''}`}
              style={index === 0 ? {borderColor: BRAND_COLORS.primary} : {}}
              onClick={() => navigate(`/users/${user.userId}`)}
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-2">
                  <div className="badge badge-lg" style={{
                    backgroundColor: index === 0 ? BADGE_COLORS.first : index === 1 ? BADGE_COLORS.second : BADGE_COLORS.third,
                    color: 'white',
                    border: 'none'
                  }}>
                    #{index + 1}
                  </div>
                  <div className="text-sm opacity-70">{user.totalPrograms} programs</div>
                </div>
                <h2 className="card-title text-xl">{user.userName}</h2>
                <div className="stat-value text-2xl" style={{color: BRAND_COLORS.primary}}>
                  {sortBy === 'totalSales' && `$${user.totalSales.toLocaleString()}`}
                  {sortBy === 'totalEngagement' && user.totalEngagement.toLocaleString()}
                  {sortBy === 'influenceScore' && (user.influenceScore * 100).toFixed(2) + '%'}
                  {sortBy === 'totalTasks' && user.totalTasks.toLocaleString()}
                  {sortBy === 'conversionRate' && `$${user.conversionRate.toFixed(2)}`}
                </div>
                <div className="stat-desc">
                  {sortBy === 'totalSales' && 'Total Sales'}
                  {sortBy === 'totalEngagement' && 'Total Engagement'}
                  {sortBy === 'influenceScore' && 'Influence Score'}
                  {sortBy === 'totalTasks' && 'Total Tasks'}
                  {sortBy === 'conversionRate' && 'Sales per Engagement'}
                </div>
                <div className="divider my-2"></div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="opacity-70">Engagement</div>
                    <div className="font-semibold">{user.totalEngagement.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="opacity-70">Sales</div>
                    <div className="font-semibold">${user.totalSales.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="opacity-70">Reach</div>
                    <div className="font-semibold">{user.totalReach.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="opacity-70">Tasks</div>
                    <div className="font-semibold">{user.totalTasks.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Complete Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Advocate</th>
                  <th>Tasks</th>
                  <th>Engagement</th>
                  <th>Reach</th>
                  <th>Influence</th>
                  <th>Sales</th>
                  <th>Conv. Rate</th>
                  <th>Eng. Rate</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers?.map((user, index) => (
                  <tr
                    key={user.userId}
                    className="cursor-pointer hover:bg-base-200 transition-colors"
                    onClick={() => navigate(`/users/${user.userId}`)}
                  >
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
                      <div>
                        <div className="font-bold">{user.userName}</div>
                        <div className="text-sm opacity-50">{user.userEmail || 'No email'}</div>
                      </div>
                    </td>
                    <td>{user.totalTasks.toLocaleString()}</td>
                    <td className="font-semibold">{user.totalEngagement.toLocaleString()}</td>
                    <td>{user.totalReach.toLocaleString()}</td>
                    <td>
                      <div className="badge" style={{backgroundColor: BADGE_COLORS.accent, color: 'white', border: 'none'}}>
                        {(user.influenceScore * 100).toFixed(2)}%
                      </div>
                    </td>
                    <td className="font-semibold" style={{color: BRAND_COLORS.teal}}>${user.totalSales.toLocaleString()}</td>
                    <td>${user.conversionRate.toFixed(2)}</td>
                    <td>
                      <div className="badge" style={{backgroundColor: BRAND_COLORS.primary, color: 'white', border: 'none'}}>
                        {(user.avgEngagementRate * 100).toFixed(2)}%
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
