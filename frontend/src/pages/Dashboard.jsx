import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

// Components
import SentimentChart from '../components/dashboard/SentimentChart'
import TopTopics from '../components/dashboard/TopTopics'
import FeedbackSummary from '../components/dashboard/FeedbackSummary'
import RecentFeedback from '../components/dashboard/RecentFeedback'

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const { user } = useAuthStore();

  // Fetch dashboard data
  const { data: analyticsData, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useQuery(
    ['analytics', user?.id],
    async () => {
      const response = await api.get('/analytics/summary')
      return response.data
    },
    {
      refetchOnWindowFocus: true,
      staleTime: 10000, // 10 seconds
    }
  )

  // Fetch recent feedback
  const { data: recentFeedback, isLoading: isLoadingFeedback, refetch: refetchFeedback } = useQuery(
    ['recentFeedback', user?.id],
    async () => {
      try {
        const response = await api.get('/feedback/', {
          params: { limit: 5 },
        });
        console.log('Recent feedback response:', response.data);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching recent feedback:', error);
        return [];
      }
    },
    {
      refetchOnWindowFocus: true,
      staleTime: 10000, // 10 seconds
    }
  )

  // Function to manually refresh dashboard data
  const refreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchAnalytics(),
        refetchFeedback()
      ]);
      console.log('Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update loading state when data is loaded
  useEffect(() => {
    if (!isLoadingAnalytics && !isLoadingFeedback) {
      setIsLoading(false)
    }
  }, [isLoadingAnalytics, isLoadingFeedback])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div 
          data-testid="dashboard-loading-spinner"
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"
        ></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={refreshDashboard}
          disabled={isRefreshing}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </>
          )}
        </button>
      </div>
      
      {/* No data state */}
      {!analyticsData?.sentiment?.total && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Welcome to SMB Feedback Insights!</h2>
          <p className="text-gray-600 mb-4">
            Start by uploading your customer feedback to gain valuable insights.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Upload Feedback
          </a>
        </div>
      )}
      
      {/* Dashboard grid */}
      {analyticsData?.sentiment?.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment Overview */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Sentiment Overview</h2>
            <SentimentChart data={analyticsData.sentiment} />
          </div>

          {/* Top Topics */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Top Topics</h2>
            <TopTopics 
              positiveTopics={analyticsData.top_positive_topics} 
              negativeTopics={analyticsData.top_negative_topics} 
            />
          </div>

          {/* Feedback Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Feedback Summary</h2>
            <FeedbackSummary data={analyticsData.sentiment} />
          </div>

          {/* Recent Feedback */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Recent Feedback</h2>
            <RecentFeedback items={recentFeedback || []} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard