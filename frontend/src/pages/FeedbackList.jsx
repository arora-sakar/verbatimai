import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// Components
import FeedbackFilters from '../components/feedback/FeedbackFilters';
import FeedbackItem from '../components/feedback/FeedbackItem';
import Pagination from '../components/common/Pagination';

const FeedbackList = () => {
  // Get current user
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse URL parameters for filters
  const urlParams = new URLSearchParams(location.search);
  const initialFilters = {
    sentiment: urlParams.get('sentiment') || '',
    source: urlParams.get('source') || '',
    search: urlParams.get('search') || '',
    topic: urlParams.get('topic') || '', // Add topic filter
  };
  
  // State for filters and pagination
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Fetch feedback data with filters
  const { data: feedbackResponse, isLoading, refetch } = useQuery(
    ['feedback', filters, currentPage, user?.id],
    async () => {
      try {
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
        };
        
        // Only add filters if they have values
        if (filters.sentiment) params.sentiment = filters.sentiment;
        if (filters.source) params.source = filters.source;
        if (filters.search) params.search = filters.search;
        if (filters.topic) params.topic = filters.topic; // Add topic parameter
        
        console.log('Fetching feedback with params:', params);
        
        const response = await api.get('/feedback/', { params });
        console.log('Feedback response:', response.data);
        
        // Get total count from headers
        const totalCount = parseInt(response.headers['x-total-count'] || '0');
        setTotalItems(totalCount);
        
        return response.data || [];
      } catch (error) {
        console.error('Error fetching feedback:', error);
        // Return an empty array in case of error to avoid rendering issues
        return [];
      }
    },
    {
      keepPreviousData: true,
    }
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle filter changes and update URL
  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL with new filters
    const searchParams = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    
    const newUrl = searchParams.toString() ? `?${searchParams.toString()}` : '';
    navigate(`/feedback${newUrl}`, { replace: true });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feedback List</h1>
      </div>

      {/* Filters */}
      <FeedbackFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {/* Results */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div 
              data-testid="loading-spinner"
              className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"
            ></div>
          </div>
        ) : feedbackResponse && Array.isArray(feedbackResponse) && feedbackResponse.length > 0 ? (
          <div>
            <ul className="divide-y divide-gray-200">
              {feedbackResponse.map((item) => (
                <FeedbackItem key={item.id} item={item} />
              ))}
            </ul>
            
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200">
              <Pagination 
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No feedback found with the current filters.</p>
            {(filters.sentiment || filters.source || filters.search || filters.topic) && (
              <button
                onClick={() => setFilters({ sentiment: '', source: '', search: '', topic: '' })}
                className="mt-2 text-sm text-primary-600 hover:text-primary-500"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;