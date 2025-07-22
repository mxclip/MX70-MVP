import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { 
  PlusIcon, 
  EyeIcon, 
  HeartIcon, 
  TrendingUpIcon,
  DollarSignIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react'

function Dashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        axios.get('/dashboard/'),
        axios.get('/dashboard/analytics')
      ])
      
      setDashboardData(dashboardResponse.data)
      setAnalytics(analyticsResponse.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.email}!
        </h1>
        <p className="text-gray-600">
          {user?.role === 'business_local' 
            ? 'Manage your gigs and track performance' 
            : 'Find gigs and track your earnings'
          }
        </p>
      </div>

      {user?.role === 'business_local' ? (
        <BusinessDashboard dashboardData={dashboardData} analytics={analytics} />
      ) : (
        <ClipperDashboard dashboardData={dashboardData} analytics={analytics} />
      )}
    </div>
  )
}

function BusinessDashboard({ dashboardData, analytics }) {
  const summary = analytics?.summary || {}
  
  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/post-gig"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <PlusIcon className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Post New Gig</h3>
              <p className="text-sm text-gray-500">Create a new video project</p>
            </div>
          </Link>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg">
            <DollarSignIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">${dashboardData?.total_credits || 0} Credits</h3>
              <p className="text-sm text-gray-500">Available balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUpIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Gigs</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_gigs || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_views || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HeartIcon className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Likes</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_likes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSignIcon className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">ROI</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.roi_percentage?.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Gigs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Gigs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData?.gigs?.slice(0, 5).map((gig) => (
            <div key={gig.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{gig.story_type}</h3>
                <p className="text-sm text-gray-500">{gig.goals}</p>
                <p className="text-xs text-gray-400">Budget: ${gig.budget}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  gig.status === 'completed' ? 'bg-green-100 text-green-800' :
                  gig.status === 'claimed' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {gig.status}
                </span>
              </div>
            </div>
          ))}
          {!dashboardData?.gigs?.length && (
            <div className="px-6 py-8 text-center text-gray-500">
              No gigs posted yet. <Link to="/post-gig" className="text-primary-600 hover:text-primary-500">Post your first gig</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClipperDashboard({ dashboardData, analytics }) {
  const summary = analytics?.summary || {}
  
  return (
    <div className="space-y-8">
      {/* Certification Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Certification Status</h2>
        {analytics?.certifications?.length > 0 ? (
          <div className="flex items-center text-green-600">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            <span>You're certified and eligible to claim gigs!</span>
          </div>
        ) : (
          <div className="flex items-center text-yellow-600">
            <AlertCircleIcon className="w-5 h-5 mr-2" />
            <span>Complete lessons to get certified. </span>
            <Link to="/lessons" className="ml-1 text-primary-600 hover:text-primary-500">
              Start learning
            </Link>
          </div>
        )}
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSignIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${summary.total_earnings?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUpIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Gigs</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.completed_gigs || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Views</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.avg_views_per_gig?.toFixed(0) || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.pending_approval || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/marketplace"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <TrendingUpIcon className="w-8 h-8 text-primary-600 mr-4" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Browse Gigs</h3>
              <p className="text-sm text-gray-500">Find new opportunities</p>
            </div>
          </div>
        </Link>

        <Link
          to="/lessons"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Continue Learning</h3>
              <p className="text-sm text-gray-500">Improve your skills</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData?.submissions?.slice(0, 5).map((submission) => {
            const gig = dashboardData.gigs?.find(g => g.id === submission.gig_id)
            return (
              <div key={submission.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {gig?.story_type || 'Unknown Gig'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {submission.views} views • {submission.likes} likes
                  </p>
                  {submission.bonus > 0 && (
                    <p className="text-xs text-green-600">Bonus: ${submission.bonus.toFixed(2)}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    submission.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            )
          })}
          {!dashboardData?.submissions?.length && (
            <div className="px-6 py-8 text-center text-gray-500">
              No submissions yet. <Link to="/marketplace" className="text-primary-600 hover:text-primary-500">Browse available gigs</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 