import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

// Components
import SentimentChart from '../components/dashboard/SentimentChart'
import TopTopics from '../components/dashboard/TopTopics'
import FeedbackSummary from '../components/dashboard/FeedbackSummary'
import RecentFeedback from '../components/dashboard/RecentFeedback'

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true)

  const { user } = useAuthStore();

  // Fetch dashboard data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery(
    ['analytics', user?.id],
    async () => {
      const response = await api.get('/analytics/summary')
      return response.data
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
    }
  )

  // Fetch recent feedback
  const { data: recentFeedback, isLoading: isLoadingFeedback } = useQuery(
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
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
    }
  )

  // Update loading state when data is loaded
  useEffect(() => {
    if (!isLoadingAnalytics && !isLoadingFeedback) {
      setIsLoading(false)
    }
  }, [isLoadingAnalytics, isLoadingFeedback])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
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